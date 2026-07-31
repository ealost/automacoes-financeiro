/* Dados semente — espelham o modelo do Firestore.
 * A página usa isto como fallback quando o Firebase não está configurado/acessível,
 * e como referência de forma dos documentos (collection "projects" + subcollection "tasks").
 *
 * status por tarefa: "todo" | "doing" | "done" | "blocked"
 * responsavel: "Evandro" | "Fabrício" | "Mariana" | "Larissa"
 */
window.SEED = {
  team: [
    { nome: "Evandro",  papel: "Discovery, acessos e deploy",     iniciais: "EV" },
    { nome: "Fabrício", papel: "Integrações (BB API + RM WS)",    iniciais: "FB" },
    { nome: "Mariana",  papel: "Dados e testes/homologação",      iniciais: "MA" },
    { nome: "Larissa",  papel: "Orquestração e regras de negócio", iniciais: "LA" },
  ],

  projects: [
    {
      id: "conciliacao-bb",
      nome: "Conciliação Bancária — Coligada 1 (Banco do Brasil)",
      resumo: "Migração do RPA de tela para automação genuína com n8n, APIs do BB e webservices do RM.",
      area: "Financeiro",
      status: "doing",
      href: "projetos/conciliacao-bb.html",
      sistemas: ["n8n", "BB API", "TOTVS RM", "Firestore"],
      // fases = numbered stages (Narrative Workflow)
      fases: [
        {
          n: "0.0", titulo: "Discovery & Acessos", accent: "var(--p-evandro)",
          desc: "Levantar credenciais das APIs do BB para a conta da Coligada 1, endpoints/licença de webservices do RM e ambiente de homologação.",
          tasks: [
            { titulo: "Habilitar aplicação no portal developers.bb.com.br e obter client_id/secret + app-key", responsavel: "Evandro", status: "doing" },
            { titulo: "Confirmar quais APIs o BB já tem contratadas (Extratos, Pagamentos em Lote/retorno)", responsavel: "Evandro", status: "todo" },
            { titulo: "Levantar versão/licença de webservices do RM (DataServer SOAP / REST RM.Host)", responsavel: "Fabrício", status: "todo" },
            { titulo: "Definir e disponibilizar ambiente de homologação (n8n + acesso RM DEV)", responsavel: "Evandro", status: "todo" },
          ],
        },
        {
          n: "1.0", titulo: "Fundação de Dados", accent: "var(--p-mariana)",
          desc: "Tirar o DE-PARA da planilha de rede e colocá-lo em base consultável/editável; modelar o log de execução.",
          tasks: [
            { titulo: "Migrar planilha DE-PARA (de = extrato BB / para = lançamento RM) para tabela", responsavel: "Mariana", status: "todo" },
            { titulo: "Manter interface simples para o Financeiro incluir novas tarifas", responsavel: "Mariana", status: "todo" },
            { titulo: "Modelar log de execução (data, arquivos, mensagens do RM, resultado)", responsavel: "Mariana", status: "todo" },
          ],
        },
        {
          n: "2.0", titulo: "Integração Banco do Brasil (n8n)", accent: "var(--p-fabricio)",
          desc: "Substituir a navegação no site por chamadas de API: retorno CNAB, extrato e tarifas.",
          tasks: [
            { titulo: "Implementar OAuth2 (client credentials + app-key) e mTLS para produção", responsavel: "Fabrício", status: "todo" },
            { titulo: "Obter retorno de pagamentos (CNAB240) via API — substituir 'Troca de arquivos'", responsavel: "Fabrício", status: "todo" },
            { titulo: "Obter extrato da conta corrente via API Extratos (substituir PDF)", responsavel: "Fabrício", status: "todo" },
            { titulo: "Extrair tarifas do extrato para conciliação", responsavel: "Fabrício", status: "todo" },
          ],
        },
        {
          n: "3.0", titulo: "Integração TOTVS RM", accent: "var(--p-fabricio)",
          desc: "Importar retorno, lançar tarifas em extrato de caixa, contabilizar (evento 22) e gerar o FS004 via serviço.",
          tasks: [
            { titulo: "Importar retorno bancário CNAB240 via processo/DataServer do RM", responsavel: "Fabrício", status: "todo" },
            { titulo: "Lançar tarifas em Extrato de Caixa (conta 000001, CC 1.1.001, depto 1.2.02, classif. 2.3.010102)", responsavel: "Fabrício", status: "todo" },
            { titulo: "Contabilizar com evento contábil 22 via webservice", responsavel: "Fabrício", status: "todo" },
            { titulo: "Gerar relatório FS004 02 (extrato diário de caixa) por serviço", responsavel: "Fabrício", status: "todo" },
          ],
        },
        {
          n: "4.0", titulo: "Orquestração & Regras", accent: "var(--p-larissa)",
          desc: "Fluxo n8n de ponta a ponta: lógica de data D-1/D-3, conciliação × DE-PARA, exceções/retries e e-mail.",
          tasks: [
            { titulo: "Cron Seg–Sex + cálculo de data (D-1 Ter–Sex / D-3 Seg)", responsavel: "Larissa", status: "todo" },
            { titulo: "Conciliar tarifas do extrato contra o DE-PARA (sempre valor positivo no RM)", responsavel: "Larissa", status: "todo" },
            { titulo: "Tratar exceções do PDD (2–3 tentativas, log, e-mail ao Financeiro)", responsavel: "Larissa", status: "todo" },
            { titulo: "Gerar relatório de execução (só tarifas lançadas) + e-mail com 3 anexos", responsavel: "Larissa", status: "todo" },
            { titulo: "Manter conferência humana (dados não batem por motivos internos)", responsavel: "Larissa", status: "todo" },
          ],
        },
        {
          n: "5.0", titulo: "Testes & Homologação", accent: "var(--p-mariana)",
          desc: "Massa de 10 casos (sucesso, erros e exceções) e aprovação do key user.",
          tasks: [
            { titulo: "Montar massa de testes com 10 casos (incl. exceções do PDD)", responsavel: "Mariana", status: "todo" },
            { titulo: "Rodar homologação com key user (Layon / Fabricio Bobek)", responsavel: "Mariana", status: "todo" },
          ],
        },
        {
          n: "6.0", titulo: "Deploy & Monitoramento", accent: "var(--p-evandro)",
          desc: "Produção, agendamento, observabilidade e esta página de acompanhamento.",
          tasks: [
            { titulo: "Publicar workflow n8n em produção com credenciais seguras", responsavel: "Evandro", status: "todo" },
            { titulo: "Configurar deploy da página (GitHub Actions → Firebase Hosting)", responsavel: "Evandro", status: "doing" },
            { titulo: "Monitorar execuções e alertas de falha", responsavel: "Evandro", status: "todo" },
          ],
        },
      ],
    },
  ],
};
