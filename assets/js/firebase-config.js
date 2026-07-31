/* Configuração do Firebase (Web).
 * Como você já tem o projeto criado: pegue estes valores em
 *   Firebase Console → Configurações do projeto → Seus apps → App da Web (SDK setup and configuration).
 *
 * Estes valores são PÚBLICOS por natureza (ficam no cliente). A proteção real dos dados vem
 * das regras do Firestore (ver firestore.rules) — não de esconder esta config.
 *
 * Enquanto os placeholders não forem preenchidos, a página cai automaticamente nos dados
 * semente (assets/js/data.js) e continua funcionando para demonstração.
 */
window.FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};
