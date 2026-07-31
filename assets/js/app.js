/* app.js — carrega projetos (Firestore ou dados semente), renderiza hub/projeto
 * e habilita edição inline na página do projeto (login e-mail/senha).
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, query, orderBy, doc, setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const CFG = window.FIREBASE_CONFIG || {};
const CONFIGURED = CFG.projectId && !String(CFG.projectId).startsWith("SEU_");

let db = null, auth = null;
let PROJECTS = [];
let currentProject = null;
let editMode = false;

/* ---------- firebase init ---------- */
function initFirebase() {
  if (!CONFIGURED || db) return;
  const app = initializeApp(CFG);
  db = getFirestore(app);
  auth = getAuth(app);
}

/* ---------- data source ---------- */
async function loadProjects() {
  if (!CONFIGURED) return { source: "seed", projects: window.SEED.projects };
  try {
    initFirebase();
    const snap = await getDocs(collection(db, "projects"));
    const projects = [];
    for (const d of snap.docs) {
      const p = { id: d.id, ...d.data() };
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

async function saveFase(projectId, fase) {
  if (!db) throw new Error("Firestore não configurado");
  const { id, ...data } = fase;
  await setDoc(doc(db, "projects", projectId, "fases", fase.n), data, { merge: true });
}

/* ---------- helpers ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const STATUS = ["todo", "doing", "done", "blocked"];
const STATUS_LBL = { todo: "A fazer", doing: "Em curso", done: "Concluída", blocked: "Bloqueada" };
const TEAM = (window.SEED.team || []).map((t) => t.nome);
const initials = (nome) => (window.SEED.team.find((t) => t.nome === nome)?.iniciais)
  || esc(nome).slice(0, 2).toUpperCase();
const slug = (n) => String(n).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function allTasks(project) { return (project.fases || []).flatMap((f) => f.tasks || []); }
function progress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100);
}
function whoBadge(nome) {
  return `<span class="who" data-p="${esc(nome)}"><span class="who__badge">${initials(nome)}</span>${esc(nome)}</span>`;
}
function peopleStack(tasks) {
  return [...new Set(tasks.map((t) => t.responsavel))].map((n) =>
    `<span class="who__badge" data-p="${esc(n)}" title="${esc(n)}"
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
function renderProject() {
  const project = currentProject;
  const tasks = allTasks(project);
  const pct = progress(tasks);
  const byStatus = (s) => tasks.filter((t) => t.status === s).length;

  const statsEl = document.querySelector("[data-stats]");
  if (statsEl) {
    statsEl.innerHTML = [
      ["Progresso", pct, "%"], ["Fases", (project.fases || []).length, ""],
      ["Tarefas", tasks.length, ""], ["Concluídas", byStatus("done"), ""],
    ].map(([lbl, num, suf]) => `
      <div class="stat reveal"><div class="stat__num" data-count="${num}">0${suf}</div>
      <div class="stat__lbl">${lbl}</div></div>`).join("");
  }

  const stagesEl = document.querySelector("[data-stages]");
  if (stagesEl) {
    stagesEl.innerHTML = (project.fases || []).map((f, fi) => `
      <div class="stage reveal" style="--stage-c:${f.accent || "var(--color-accent-deep)"}">
        <div class="stage__num">${esc(f.n)}</div>
        <div class="stage__head">
          <h3 class="stage__title">${esc(f.titulo)}</h3>
          <span class="mono">${(f.tasks || []).filter((t) => t.status === "done").length}/${(f.tasks || []).length}</span>
        </div>
        <p class="stage__desc">${esc(f.desc)}</p>
        <ul class="tasks">
          ${(f.tasks || []).map((t, ti) => editMode
            ? editTaskRow(t, fi, ti) : viewTaskRow(t)).join("")}
        </ul>
        ${editMode ? `<button class="btn btn--outline btn--sm" data-add="${fi}" style="margin-top:.6rem">+ tarefa</button>` : ""}
      </div>`).join("");
  }

  animateCounters(document);
  observeReveals(document);
  if (editMode) wireEditing();
}

function viewTaskRow(t) {
  return `<li class="task">
    <span class="task__t ${t.status === "done" ? "is-done" : ""}">${esc(t.titulo)}</span>
    ${whoBadge(t.responsavel)}
    <span class="status" data-s="${esc(t.status)}">${STATUS_LBL[t.status] || t.status}</span>
  </li>`;
}
function editTaskRow(t, fi, ti) {
  return `<li class="task" data-fi="${fi}" data-ti="${ti}">
    <input class="edit-in task__t" data-k="titulo" value="${esc(t.titulo)}" aria-label="Tarefa" />
    <select class="edit-sel" data-k="responsavel" aria-label="Responsável">
      ${TEAM.map((n) => `<option ${n === t.responsavel ? "selected" : ""}>${esc(n)}</option>`).join("")}
    </select>
    <select class="edit-sel" data-k="status" aria-label="Status">
      ${STATUS.map((s) => `<option value="${s}" ${s === t.status ? "selected" : ""}>${STATUS_LBL[s]}</option>`).join("")}
    </select>
    <button class="task-del" data-del title="Remover tarefa" aria-label="Remover tarefa">×</button>
  </li>`;
}

/* ---------- editing ---------- */
function wireEditing() {
  const stagesEl = document.querySelector("[data-stages]");
  if (!stagesEl || stagesEl.dataset.wired) return;
  stagesEl.dataset.wired = "1";

  stagesEl.addEventListener("change", async (e) => {
    const li = e.target.closest("[data-fi]");
    if (!li) return;
    const fi = +li.dataset.fi, ti = +li.dataset.ti, k = e.target.dataset.k;
    if (!k) return;
    const fase = currentProject.fases[fi];
    fase.tasks[ti][k] = e.target.value;
    await persist(fase, e.target);
    if (k === "status" || k === "titulo") renderProject(); // atualiza contagens/risco
  });

  stagesEl.addEventListener("click", async (e) => {
    if (e.target.matches("[data-del]")) {
      const li = e.target.closest("[data-fi]");
      const fase = currentProject.fases[+li.dataset.fi];
      fase.tasks.splice(+li.dataset.ti, 1);
      await persist(fase, e.target);
      renderProject();
    }
    if (e.target.matches("[data-add]")) {
      const fase = currentProject.fases[+e.target.dataset.add];
      fase.tasks = fase.tasks || [];
      fase.tasks.push({ titulo: "Nova tarefa", responsavel: TEAM[0], status: "todo" });
      await persist(fase, e.target);
      renderProject();
    }
  });
}

async function persist(fase, el) {
  setSaveState("saving");
  try {
    await saveFase(currentProject.id, fase);
    setSaveState("saved");
  } catch (err) {
    console.error(err);
    setSaveState("error");
  }
}
function setSaveState(s) {
  const el = document.querySelector("[data-savestate]");
  if (!el) return;
  el.textContent = { saving: "salvando…", saved: "salvo ✓", error: "erro ao salvar" }[s] || "";
  el.dataset.s = s;
}

/* ---------- auth UI ---------- */
function mountAuthBar() {
  if (document.querySelector("[data-authbar]") || document.body.dataset.page !== "project") return;
  const bar = document.createElement("div");
  bar.className = "authbar"; bar.setAttribute("data-authbar", "");
  bar.innerHTML = `
    <span class="mono" data-savestate></span>
    <button class="btn btn--outline btn--sm" data-login>Entrar para editar</button>
    <span class="authbar__user" hidden><span class="mono" data-who></span>
      <button class="btn btn--outline btn--sm" data-logout>Sair</button></span>`;
  document.body.appendChild(bar);

  const modal = document.createElement("div");
  modal.className = "modal"; modal.setAttribute("data-modal", ""); modal.hidden = true;
  modal.innerHTML = `
    <form class="modal__box" data-loginform>
      <h3 style="margin:0 0 .8rem">Entrar</h3>
      <label class="fld"><span>E-mail</span><input type="email" required data-email autocomplete="username"></label>
      <label class="fld"><span>Senha</span><input type="password" required data-pass autocomplete="current-password"></label>
      <p class="loginerr" data-loginerr hidden></p>
      <div style="display:flex;gap:.6rem;justify-content:flex-end;margin-top:1rem">
        <button type="button" class="btn btn--outline btn--sm" data-cancel>Cancelar</button>
        <button type="submit" class="btn btn--sm">Entrar</button>
      </div>
    </form>`;
  document.body.appendChild(modal);

  const open = () => { if (!CONFIGURED) { alert("Configure o Firebase (assets/js/firebase-config.js) para habilitar a edição."); return; } modal.hidden = false; modal.querySelector("[data-email]").focus(); };
  const close = () => { modal.hidden = true; };
  bar.querySelector("[data-login]").addEventListener("click", open);
  modal.querySelector("[data-cancel]").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  bar.querySelector("[data-logout]").addEventListener("click", () => auth && signOut(auth));

  modal.querySelector("[data-loginform]").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = modal.querySelector("[data-loginerr]"); err.hidden = true;
    try {
      await signInWithEmailAndPassword(auth,
        modal.querySelector("[data-email]").value, modal.querySelector("[data-pass]").value);
      close();
    } catch (ex) {
      err.textContent = "E-mail ou senha inválidos."; err.hidden = false;
    }
  });

  if (CONFIGURED) {
    initFirebase();
    onAuthStateChanged(auth, (user) => {
      editMode = !!user;
      bar.querySelector("[data-login]").hidden = !!user;
      const u = bar.querySelector(".authbar__user");
      u.hidden = !user;
      if (user) bar.querySelector("[data-who]").textContent = user.email;
      if (currentProject) renderProject();
    });
  }
}

/* ---------- micro-interactions ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function observeReveals(scope) {
  const els = scope.querySelectorAll(".reveal:not(.is-in)");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en, i) => { if (en.isIntersecting) { setTimeout(() => en.target.classList.add("is-in"), i * 50); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
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
    const suffix = (el.dataset.count.match(/\D+$/) || [""])[0] || (el.textContent.match(/[^0-9]+$/) || [""])[0] || "";
    if (reduce) { el.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
function wireMascot() {
  const m = document.querySelector(".mascot");
  if (!m) return;
  m.addEventListener("click", (e) => {
    if (reduce) return;
    const s = document.createElement("span");
    s.className = "star-burst"; s.style.left = (e.clientX - 12) + "px"; s.style.top = (e.clientY - 12) + "px";
    document.body.appendChild(s); setTimeout(() => s.remove(), 460);
  });
}

/* ---------- boot ---------- */
(async function () {
  wireMascot();
  mountAuthBar();
  const { source, projects, error } = await loadProjects();
  PROJECTS = projects;

  const banner = document.querySelector("[data-banner]");
  if (banner) {
    if (source === "seed" && !CONFIGURED) {
      banner.textContent = "Exibindo dados de demonstração — preencha assets/js/firebase-config.js para ler do Firestore e habilitar a edição.";
    } else if (error) {
      banner.setAttribute("data-kind", "err");
      banner.textContent = "Não foi possível ler o Firestore; exibindo dados de demonstração.";
    } else { banner.remove(); }
  }

  const page = document.body.dataset.page;
  if (page === "hub") {
    renderHub(document.querySelector("[data-projects]"), projects);
  } else if (page === "project") {
    currentProject = projects.find((p) => p.id === document.body.dataset.project) || projects[0];
    if (currentProject) renderProject();
  }
})();
