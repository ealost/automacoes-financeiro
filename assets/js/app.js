/* app.js — carrega projetos do Firestore (se configurado) ou dos dados semente,
 * e renderiza o hub ou a página de projeto. Módulo ES.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CFG = window.FIREBASE_CONFIG || {};
const CONFIGURED = CFG.projectId && !String(CFG.projectId).startsWith("SEU_");

/* ---------- data source ---------- */
async function loadProjects() {
  if (!CONFIGURED) return { source: "seed", projects: window.SEED.projects };
  try {
    const app = initializeApp(CFG);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, "projects"));
    const projects = [];
    for (const d of snap.docs) {
      const p = { id: d.id, ...d.data() };
      // fases podem vir embutidas (array) ou como subcoleção "fases"
      if (!Array.isArray(p.fases)) {
        const fs = await getDocs(query(collection(d.ref, "fases"), orderBy("n")));
        p.fases = fs.docs.map((f) => ({ id: f.id, ...f.data() }));
      }
      projects.push(p);
    }
    if (!projects.length) return { source: "seed", projects: window.SEED.projects };
    return { source: "firestore", projects };
  } catch (err) {
    console.warn("[Firestore] falha ao carregar, usando dados semente:", err);
    return { source: "seed", projects: window.SEED.projects, error: err };
  }
}

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const STATUS_LBL = { todo: "A fazer", doing: "Em curso", done: "Concluída", blocked: "Bloqueada" };
const initials = (nome) => (window.SEED.team.find((t) => t.nome === nome)?.iniciais)
  || esc(nome).slice(0, 2).toUpperCase();

function allTasks(project) {
  return (project.fases || []).flatMap((f) => f.tasks || []);
}
function progress(tasks) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}
function whoBadge(nome) {
  return `<span class="who" data-p="${esc(nome)}"><span class="who__badge">${initials(nome)}</span>${esc(nome)}</span>`;
}
const slug = (n) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function peopleStack(tasks) {
  const names = [...new Set(tasks.map((t) => t.responsavel))];
  return names.map((n) => `<span class="who__badge" data-p="${esc(n)}" title="${esc(n)}"
      style="background:var(--p-${slug(n)})">${initials(n)}</span>`).join("");
}

/* ---------- render: HUB ---------- */
function renderHub(root, projects) {
  root.innerHTML = projects.map((p) => {
    const tasks = allTasks(p);
    const pct = progress(tasks);
    return `
    <a class="card card--link reveal" href="${esc(p.href || "#")}">
      <div class="pj__top">
        <span class="chip"><span class="chip__dot" style="background:var(--color-accent-2)"></span>${esc(p.area || "Automação")}</span>
        <span class="status" data-s="${esc(p.status || "todo")}">${STATUS_LBL[p.status] || "A fazer"}</span>
      </div>
      <h2 class="pj__title">${esc(p.nome)}</h2>
      <p class="pj__desc">${esc(p.resumo)}</p>
      <div class="bar" aria-hidden="true"><span class="bar__fill" data-w="${pct}" style="width:0"></span></div>
      <div class="pj__foot">
        <span class="pj__people">${peopleStack(tasks)}</span>
        <span class="mono">${pct}% · ${tasks.length} tarefas</span>
      </div>
    </a>`;
  }).join("");
  animateBars(root);
  observeReveals(root);
}

/* ---------- render: PROJECT ---------- */
function renderProject(project) {
  const tasks = allTasks(project);
  const pct = progress(tasks);
  const byStatus = (s) => tasks.filter((t) => t.status === s).length;

  const statsEl = document.querySelector("[data-stats]");
  if (statsEl) {
    statsEl.innerHTML = [
      ["Progresso", pct, "%"],
      ["Fases", (project.fases || []).length, ""],
      ["Tarefas", tasks.length, ""],
      ["Concluídas", byStatus("done"), ""],
    ].map(([lbl, num, suf]) => `
      <div class="stat reveal">
        <div class="stat__num" data-count="${num}">0${suf}</div>
        <div class="stat__lbl">${lbl}</div>
      </div>`).join("");
  }

  const stagesEl = document.querySelector("[data-stages]");
  if (stagesEl) {
    stagesEl.innerHTML = (project.fases || []).map((f) => `
      <div class="stage reveal" style="--stage-c:${f.accent || "var(--color-accent-deep)"}">
        <div class="stage__num">${esc(f.n)}</div>
        <div class="stage__head">
          <h3 class="stage__title">${esc(f.titulo)}</h3>
          <span class="mono">${(f.tasks || []).filter((t)=>t.status==="done").length}/${(f.tasks || []).length}</span>
        </div>
        <p class="stage__desc">${esc(f.desc)}</p>
        <ul class="tasks">
          ${(f.tasks || []).map((t) => `
            <li class="task">
              <span class="task__t ${t.status === "done" ? "is-done" : ""}">${esc(t.titulo)}</span>
              ${whoBadge(t.responsavel)}
              <span class="status" data-s="${esc(t.status)}">${STATUS_LBL[t.status] || t.status}</span>
            </li>`).join("")}
        </ul>
      </div>`).join("");
  }

  animateCounters(document);
  observeReveals(document);
}

/* ---------- micro-interactions ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function observeReveals(scope) {
  const els = scope.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => { if (en.isIntersecting) { setTimeout(() => en.target.classList.add("is-in"), i * 60); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  els.forEach((e) => io.observe(e));
}

function animateBars(scope) {
  scope.querySelectorAll(".bar__fill").forEach((el) => {
    const w = el.dataset.w + "%";
    if (reduce) { el.style.width = w; return; }
    requestAnimationFrame(() => { el.style.width = w; });
  });
}

function animateCounters(scope) {
  scope.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.textContent.replace(/[0-9]/g, "");
    if (reduce) { el.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 1000;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* mascot star-burst */
function wireMascot() {
  const m = document.querySelector(".mascot");
  if (!m) return;
  m.addEventListener("click", (e) => {
    if (reduce) return;
    const s = document.createElement("span");
    s.className = "star-burst";
    s.style.left = (e.clientX - 12) + "px";
    s.style.top = (e.clientY - 12) + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 460);
  });
}

/* ---------- boot ---------- */
(async function () {
  wireMascot();
  const { source, projects, error } = await loadProjects();

  const banner = document.querySelector("[data-banner]");
  if (banner) {
    if (source === "seed" && !CONFIGURED) {
      banner.textContent = "Exibindo dados de demonstração — preencha assets/js/firebase-config.js para ler do Firestore.";
    } else if (error) {
      banner.setAttribute("data-kind", "err");
      banner.textContent = "Não foi possível ler o Firestore; exibindo dados de demonstração.";
    } else {
      banner.remove();
    }
  }

  const page = document.body.dataset.page;
  if (page === "hub") {
    renderHub(document.querySelector("[data-projects]"), projects);
  } else if (page === "project") {
    const id = document.body.dataset.project;
    const project = projects.find((p) => p.id === id) || projects[0];
    if (project) renderProject(project);
  }
})();
