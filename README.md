# Automações · Financeiro Castilho

Painel dos projetos de automação do Financeiro. Site estático (Hallmark · tema *Hum*) com dados
no **Firestore** e deploy via **GitHub Actions → Firebase Hosting**. Cada projeto mostra suas
**fases, tarefas e responsáveis** (Evandro, Fabrício, Mariana, Larissa).

Primeiro projeto: **Conciliação Bancária — Coligada 1 (Banco do Brasil)** — ver
[`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Estrutura

```
index.html                      Hub — grade de projetos
projetos/conciliacao-bb.html    Página do projeto (timeline de fases)
assets/css/hum.css              Design system (tokens + componentes)
assets/js/data.js               Dados semente (fallback + modelo do Firestore)
assets/js/firebase-config.js    Config web do Firebase (placeholders)
assets/js/app.js                Carga (Firestore ou semente) + render
firebase.json / .firebaserc     Hosting + Firestore
firestore.rules                 Leitura pública, escrita bloqueada no cliente
scripts/seed.mjs                Popula o Firestore a partir de data.js (Admin SDK)
.github/workflows/deploy.yml    Deploy automático no push para main
docs/ARQUITETURA.md             As-Is → To-Be, mapa de APIs BB e webservices RM
```

Sem Firebase configurado, a página usa automaticamente os **dados semente** — abre e funciona.

## Rodar localmente

```bash
python -m http.server 8777
# abrir http://localhost:8777
```
(Os módulos ES exigem servidor HTTP; abrir o arquivo direto não funciona.)

## Configurar o Firebase

1. Preencha `assets/js/firebase-config.js` com a config web do seu projeto
   (Console → Configurações → Seus apps → App da Web). Estes valores são públicos;
   a proteção real vem de `firestore.rules`.
2. Popular o banco:
   ```bash
   npm install
   # salve a chave de serviço em scripts/service-account.json (não commitar)
   npm run seed
   ```

## Deploy (GitHub Actions)

No push para `main`, o workflow publica no Firebase Hosting. Configure em
**Settings → Secrets and variables → Actions**:

| Secret | Conteúdo |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase |
| `FIREBASE_PROJECT_ID` | ID do projeto |
| `FIREBASE_WEB_CONFIG` *(opcional)* | `window.FIREBASE_CONFIG = { ... };` (gera o config.js no build) |

Também atualize `.firebaserc` (`SEU_PROJETO`) para os comandos locais do Firebase CLI.
