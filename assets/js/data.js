/* Dados semente — espelham o modelo do Firestore.
 * Fallback quando o Firebase não está configurado/acessível e referência de forma
 * dos documentos (collection "projects" + subcollection "fases").
 *
 * status por tarefa: "todo" | "doing" | "done" | "blocked"
 * responsavel: "Evandro" | "Fabrício" | "Mariana" | "Larissa"
 *
 * Cada trilha é um PROJETO separado (fluxos diferentes de API e de n8n).
 */
window.SEED = {
  team: [
    { nome: "Evandro",  papel: "Discovery, acessos e deploy",     iniciais: "EV" },
    { nome: "Fabrício", papel: "Integrações (BB API + RM WS)",    iniciais: "FB" },
    { nome: "Mariana",  papel: "Dados e testes/homologação",      iniciais: "MA" },
    { nome: "Larissa",  papel: "Orquestração e regras de negócio", iniciais: "LA" },
  ],

  projects: [
    /* ============================================ PAGAMENTOS EM LOTE — ENVIO */
    {
      id: "pag-lote-envio",
      nome: "Pagamentos em Lote — Envio",
      resumo: "Envio de borderôs do RM ao banco via API Pagamentos em Lote, com aprovação por lote (start manual).",
      descricao: "Rotina de start manual: pega o borderô do RM, formata, envia ao banco, lê o retorno do processamento e leva para aprovação por lote. Reprovar exclui o borderô; aprovar efetiva o pagamento. O painel operacional de autorização será um portal à parte (usuários do Financeiro via AD).",
      area: "Financeiro",
      status: "todo",
      href: "projetos/projeto.html?id=pag-lote-envio",
      sistemas: ["n8n", "BB API (Pag. Lote)", "TOTVS RM"],
      fluxo: {
        asis: [
          "Gera borderô no RM",
          "Envia o arquivo pelo site do BB",
          "Confere e aprova manualmente",
          "Sem trilha de aprovação estruturada",
        ],
        tobe: [
          "Pega borderô do RM (webservice)",
          "Formata para o layout da API Pag. Lote",
          "Envia o lote ao banco",
          "Lê o retorno do processamento",
          "Aprovação por lote (painel/portal futuro)",
          "Aprovar efetiva o pagamento / reprovar exclui o borderô",
        ],
      },
      fases: [
        { n: "0.0", titulo: "Discovery & Acessos", accent: "var(--p-evandro)",
          desc: "Confirmar contratação da API Pagamentos em Lote (envio), credenciais/mTLS e ambiente de homologação.",
          tasks: [
            { titulo: "Confirmar API Pagamentos em Lote (envio) contratada para a conta", responsavel: "Evandro", status: "todo" },
            { titulo: "DECISÃO PENDENTE: onde o borderô é criado/excluído (RM x sistema novo)", responsavel: "Evandro", status: "blocked" },
            { titulo: "Obter credenciais OAuth2 + app-key e certificado mTLS", responsavel: "Evandro", status: "todo" },
          ] },
        { n: "1.0", titulo: "Extração do borderô (RM)", accent: "var(--p-fabricio)",
          desc: "Obter o borderô do RM por webservice/DataServer e mapear campos e lotes.",
          tasks: [
            { titulo: "Obter borderô via webservice/DataServer do RM", responsavel: "Fabrício", status: "todo" },
            { titulo: "Mapear campos e granularidade por lote", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "2.0", titulo: "Formatação & Envio", accent: "var(--p-fabricio)",
          desc: "Montar o layout da API, enviar o lote e capturar o protocolo de envio.",
          tasks: [
            { titulo: "Formatar borderô no layout da API Pagamentos em Lote", responsavel: "Fabrício", status: "todo" },
            { titulo: "Enviar lote ao banco e capturar protocolo", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "3.0", titulo: "Retorno do processamento & Aprovação", accent: "var(--p-larissa)",
          desc: "Ler o status do processamento e aplicar a regra de aprovação/reprovação por lote (painel/portal futuro).",
          tasks: [
            { titulo: "Ler retorno do processamento do banco (por lote)", responsavel: "Larissa", status: "todo" },
            { titulo: "Regra: reprovar exclui o borderô (granularidade por lote)", responsavel: "Larissa", status: "todo" },
            { titulo: "Regra: aprovar efetiva o pagamento", responsavel: "Larissa", status: "todo" },
            { titulo: "Especificar painel de autorização (portal futuro, usuários AD)", responsavel: "Larissa", status: "todo" },
          ] },
        { n: "4.0", titulo: "Orquestração n8n", accent: "var(--p-larissa)",
          desc: "Fluxo n8n com start manual, encadeamento e tratamento de exceções.",
          tasks: [
            { titulo: "Rotina de envio com start manual", responsavel: "Larissa", status: "todo" },
            { titulo: "Exceções e tentativas (retries)", responsavel: "Larissa", status: "todo" },
          ] },
        { n: "5.0", titulo: "Logs & Auditoria", accent: "var(--p-mariana)",
          desc: "Registrar as conciliações internas do envio.",
          tasks: [
            { titulo: "Log: lançamentos × borderô criado", responsavel: "Mariana", status: "todo" },
            { titulo: "Log: borderô × pagamentos aprovados", responsavel: "Mariana", status: "todo" },
          ] },
        { n: "6.0", titulo: "Testes & Homologação", accent: "var(--p-mariana)",
          desc: "Massa de casos (sucesso, erros e exceções) e aprovação do key user.",
          tasks: [
            { titulo: "Montar massa de testes", responsavel: "Mariana", status: "todo" },
            { titulo: "Homologação com key user", responsavel: "Mariana", status: "todo" },
          ] },
      ],
    },

    /* ============================================ PAGAMENTOS EM LOTE — RETORNO */
    {
      id: "pag-lote-retorno",
      nome: "Pagamentos em Lote — Retorno",
      resumo: "Importa o retorno CNAB240 dos pagamentos no RM (arquivo ou webservice) e faz a baixa.",
      descricao: "Captura o arquivo de retorno CNAB240 dos lotes de pagamento, importa no RM (por arquivo ou webservice) e realiza a baixa dos títulos.",
      area: "Financeiro",
      status: "todo",
      href: "projetos/projeto.html?id=pag-lote-retorno",
      sistemas: ["n8n", "BB API (Pag. Lote)", "TOTVS RM"],
      fluxo: {
        asis: [
          "Baixa o retorno em Troca de arquivos (site BB)",
          "Importa manualmente no RM",
          "Faz a baixa manual",
        ],
        tobe: [
          "Captura o CNAB240 via API",
          "Importa no RM (arquivo ou webservice)",
          "Baixa dos títulos",
          "Log de importação",
        ],
      },
      fases: [
        { n: "0.0", titulo: "Discovery & Acessos", accent: "var(--p-evandro)",
          desc: "Definir a forma de importação no RM e o acesso ao retorno.",
          tasks: [
            { titulo: "DECISÃO PENDENTE: importar no RM por arquivo ou por webservice", responsavel: "Evandro", status: "blocked" },
            { titulo: "Confirmar acesso à API de retorno (Pagamentos em Lote)", responsavel: "Evandro", status: "todo" },
          ] },
        { n: "1.0", titulo: "Captura do retorno CNAB240", accent: "var(--p-fabricio)",
          desc: "Obter o arquivo de retorno dos lotes via API.",
          tasks: [
            { titulo: "Obter retorno CNAB240 via API Pagamentos em Lote", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "2.0", titulo: "Importação no RM & Baixa", accent: "var(--p-fabricio)",
          desc: "Importar o CNAB240 no RM e realizar a baixa dos títulos.",
          tasks: [
            { titulo: "Importar CNAB240 no RM (arquivo/webservice)", responsavel: "Fabrício", status: "todo" },
            { titulo: "Baixa dos títulos e captura da mensagem de importação", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "3.0", titulo: "Orquestração n8n", accent: "var(--p-larissa)",
          desc: "Fluxo n8n com tratamento de exceções e log.",
          tasks: [
            { titulo: "Rotina de retorno no n8n", responsavel: "Larissa", status: "todo" },
            { titulo: "Exceções, tentativas e log", responsavel: "Larissa", status: "todo" },
          ] },
        { n: "4.0", titulo: "Testes & Homologação", accent: "var(--p-mariana)",
          desc: "Massa de casos e homologação.",
          tasks: [
            { titulo: "Montar massa de testes e homologar", responsavel: "Mariana", status: "todo" },
          ] },
      ],
    },

    /* ============================================ EXTRATOS — RETORNO */
    {
      id: "extratos-retorno",
      nome: "Extratos — Retorno",
      resumo: "Captura o extrato via API, normaliza histórico (tarifas e rentabilidade de saldo) por DE-PARA e lança no RM.",
      descricao: "Captura o extrato de conta corrente pela API do BB, normaliza o histórico via procv na planilha DE-PARA (tarifas e rentabilidade de saldo) e faz o lançamento/conciliação no RM. Mantém a conferência humana no fim, porque os dados não batem por motivos internos.",
      area: "Financeiro",
      status: "todo",
      href: "projetos/projeto.html?id=extratos-retorno",
      sistemas: ["n8n", "BB API (Extratos)", "TOTVS RM", "Firestore"],
      fluxo: {
        asis: [
          "Baixa o extrato PDF no site do BB",
          "Captura as tarifas manualmente",
          "Lança no RM (extrato de caixa)",
          "Gera FS004 e envia e-mail",
        ],
        tobe: [
          "Captura o extrato via API",
          "Normaliza histórico por DE-PARA (tarifas + rentabilidade de saldo)",
          "Lança no RM (contabilização evt. 22)",
          "Gera FS004 + e-mail + conferência humana",
        ],
      },
      fases: [
        { n: "0.0", titulo: "Discovery & Acessos", accent: "var(--p-evandro)",
          desc: "Confirmar a API de Extratos e o ambiente de homologação.",
          tasks: [
            { titulo: "Confirmar API Extratos contratada para a conta", responsavel: "Evandro", status: "todo" },
            { titulo: "Definir ambiente de homologação (n8n + RM DEV)", responsavel: "Evandro", status: "todo" },
          ] },
        { n: "1.0", titulo: "Fundação DE-PARA", accent: "var(--p-mariana)",
          desc: "Migrar a planilha DE-PARA para base consultável e cobrir tarifas e rentabilidade de saldo.",
          tasks: [
            { titulo: "Migrar planilha DE-PARA para base (de = extrato / para = RM)", responsavel: "Mariana", status: "todo" },
            { titulo: "Cobrir normalização de tarifas e rentabilidade de saldo (mesmo procv)", responsavel: "Mariana", status: "todo" },
            { titulo: "Interface para o Financeiro incluir novos históricos/tarifas", responsavel: "Mariana", status: "todo" },
          ] },
        { n: "2.0", titulo: "Captura do extrato (BB API)", accent: "var(--p-fabricio)",
          desc: "Obter o extrato de conta corrente pela API, com OAuth2/mTLS.",
          tasks: [
            { titulo: "Implementar OAuth2 + app-key + mTLS", responsavel: "Fabrício", status: "todo" },
            { titulo: "Obter extrato de conta corrente via API Extratos", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "3.0", titulo: "Normalização & Conciliação", accent: "var(--p-larissa)",
          desc: "Aplicar o procv do DE-PARA e identificar tarifas e rentabilidade (sempre valor positivo no RM).",
          tasks: [
            { titulo: "Aplicar procv DE-PARA para normalizar histórico", responsavel: "Larissa", status: "todo" },
            { titulo: "Identificar tarifas e rentabilidade de saldo", responsavel: "Larissa", status: "todo" },
          ] },
        { n: "4.0", titulo: "Lançamento no RM", accent: "var(--p-fabricio)",
          desc: "Lançar em extrato de caixa com os parâmetros fixos, contabilizar e gerar o FS004.",
          tasks: [
            { titulo: "Lançar em Extrato de Caixa (conta 000001, CC 1.1.001, depto 1.2.02, classif. 2.3.010102)", responsavel: "Fabrício", status: "todo" },
            { titulo: "Contabilizar com evento contábil 22", responsavel: "Fabrício", status: "todo" },
            { titulo: "Gerar relatório FS004 02 (extrato diário de caixa)", responsavel: "Fabrício", status: "todo" },
          ] },
        { n: "5.0", titulo: "Orquestração n8n & Conferência", accent: "var(--p-larissa)",
          desc: "Rotina com lógica de data, e-mail e conferência humana.",
          tasks: [
            { titulo: "Rotina com cálculo de data (D-1 Ter–Sex / D-3 Seg)", responsavel: "Larissa", status: "todo" },
            { titulo: "E-mail de finalização com anexos (BB + RM + execução)", responsavel: "Larissa", status: "todo" },
            { titulo: "Manter conferência humana (dados não batem por motivos internos)", responsavel: "Larissa", status: "todo" },
          ] },
        { n: "6.0", titulo: "Testes & Homologação", accent: "var(--p-mariana)",
          desc: "Massa de 10 casos e homologação do key user.",
          tasks: [
            { titulo: "Montar massa de testes (incl. exceções) e homologar", responsavel: "Mariana", status: "todo" },
          ] },
      ],
    },
  ],
};
