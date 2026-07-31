/* Popula o Firestore com os dados semente de assets/js/data.js.
 *
 * Uso:
 *   1. npm install
 *   2. Baixe a chave de serviço (Firebase Console → Configurações → Contas de serviço → Gerar nova chave)
 *      e salve como scripts/service-account.json  (NÃO commitar — já está no .gitignore)
 *   3. node scripts/seed.mjs
 *
 * Grava cada projeto em /projects/{id} e cada fase em /projects/{id}/fases/{n}.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Reaproveita exatamente o mesmo objeto SEED usado pela página (fonte única).
const code = fs.readFileSync(path.join(root, "assets/js/data.js"), "utf8");
const win = {};
new Function("window", code)(win);
const SEED = win.SEED;

const saPath = path.join(__dirname, "service-account.json");
if (!fs.existsSync(saPath)) {
  console.error("Faltando scripts/service-account.json — veja instruções no topo deste arquivo.");
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  for (const p of SEED.projects) {
    const { fases, ...meta } = p;
    await db.collection("projects").doc(p.id).set(meta, { merge: true });
    for (const f of fases) {
      await db.collection("projects").doc(p.id).collection("fases").doc(f.n).set(f, { merge: true });
    }
    console.log(`✓ ${p.id} (${fases.length} fases)`);
  }
  console.log("Seed concluído.");
}

run().catch((e) => { console.error(e); process.exit(1); });
