# Conciliação Bancária — Coligada 1 (Banco do Brasil)
## Do RPA de tela para automação genuína (n8n + BB API + RM WebService)

Baseado no PDD `CASTILHO_PDD_CONCILIAÇÃO_BANCARIA_COL1_BANCO_BRASIL` (v1.0, Kauana Canovele, 27/08/2024).

---

## 1. As-Is (RPA de tela atual)

Robô que **clica na interface** (navegador + client RM). ~30 min/dia, Seg–Sex, lógica de data
**D-1 (Ter–Sex)** e **D-3 (Seg)**. Três blocos:

| Bloco | Ação (tela) |
|---|---|
| 1. Planilha DE-PARA | Abre pasta de rede, lê planilha (de = como vem no extrato BB, para = como lança no RM), salva no banco transacional |
| 2. Banco do Brasil (site) | Login PJ → Troca de arquivos → baixa retorno CNAB240 (`PROCESSAME`) → baixa extrato PDF → captura tarifas → emite comprovantes PDF |
| 3. RM / TOTVS (client) | Importa retorno bancário (CNAB240) → lança tarifas em *Extratos de caixa* → contabiliza (evento 22) → gera FS004 → e-mail com 3 anexos |

**Restrição do próprio processo:** "os dados não batem por motivos internos" → o fim do fluxo é sempre
**conferência humana**. A automação genuína **mantém** esse ponto (human-in-the-loop).

### Parâmetros fixos de lançamento no RM (Extrato de Caixa)
- Operação: **saque manual** · Conta/caixa: **000001** · Compensado: sim
- Nº documento: últimos 6 dígitos do documento do extrato · Valor: **sempre positivo**
- Histórico: dados da planilha DE-PARA
- Centro de custo: **1.1.001** (Matriz Curitiba) · Departamento: **1.2.02** (Administração)
- Classif. financeira: **2.3.010102** (Despesas bancárias) · Evento contábil: **22** (Extratos bancários)
- Relatório: **FS004 02 — Extrato diário de caixa** (coligada 1 — Construtora Castilho, CNPJ 92.779.503/0001-25)

---

## 2. To-Be (n8n como orquestrador)

Substituir "clicar na tela" por **chamadas de API/webservice**.

```
        ┌─────────────── n8n (orquestrador) ───────────────┐
Cron    │  1. Calcula data (D-1 Ter–Sex / D-3 Seg)          │
Seg–Sex │  2. Lê DE-PARA (Firestore/SQL, não mais planilha) │
   │    │  3. BB API  → retorno CNAB + extrato + tarifas    │
   ▼    │  4. Concilia tarifas × DE-PARA                    │
        │  5. RM WebService → importa retorno + lança       │
        │     tarifas + contabiliza + gera relatório        │
        │  6. Gera relatório de execução + e-mail 3 anexos  │
        │  7. Grava log de execução no banco                │
        └───────────────────────────────────────────────────┘
```

### 2.1 Banco do Brasil — APIs (developers.bb.com.br)

| Passo do As-Is | Substituição por API | Observação |
|---|---|---|
| Baixar retorno CNAB240 em "Troca de arquivos" | **API Pagamentos em Lote (retorno)** | Retorno dos lotes de pagamento; confirmar contratação |
| Baixar extrato PDF | **API Extratos / Conta Corrente** | Extrato programático; captura de tarifas |
| Emitir comprovantes PDF | Avaliar se a API de pagamentos já entrega os dados | Pode dispensar os PDFs |

- **Auth:** OAuth2 (client credentials — `client_id`/`client_secret` + `gw-app-key`).
- **Produção:** exige certificado **mTLS**.
- **A confirmar (Fase 0):** quais dessas APIs já estão **contratadas** para a conta da Coligada 1.

### 2.2 TOTVS RM — WebServices

| Passo do As-Is | Substituição | Observação |
|---|---|---|
| Importar retorno CNAB240 | Processo RM exposto por webservice (`wsProcess`/RM.Net) ou DataServer de retorno bancário | Confirmar licença |
| Lançar tarifas em Extrato de Caixa | **DataServer (SOAP `wsDataServer`)** ou **REST RM.Host** | Usar os parâmetros fixos da seção 1 |
| Contabilizar (evento 22) | Processo/serviço de contabilização | |
| Gerar FS004 02 | Serviço de relatório / RM Reports | |

- **A confirmar (Fase 0):** versão do RM e quais webservices/licenças estão habilitados
  (define o que é API pura vs. eventual RPA residual).

### 2.3 Dados

- **DE-PARA:** sai da planilha de rede e vira base consultável/editável (Firestore ou SQL),
  para o Financeiro incluir novas tarifas sem mexer no fluxo.
- **Log de execução:** data, arquivos usados, mensagens do RM, resultado, anexos gerados.

### 2.4 Exceções (do PDD, mantidas no n8n)

| Ambiente | Erro | Resposta |
|---|---|---|
| Pasta/DE-PARA | Sem acesso / não localizado | log + e-mail financeiro@castilho.com.br |
| RM | Falha de acesso | 2 tentativas + log + e-mail |
| E-mail do robô | Falha de acesso | 3 tentativas + log |
| Banco do Brasil | Falha de acesso | 2 tentativas + log + e-mail |
| Banco de dados | Falha de acesso | log + e-mail |

---

## 3. Fases do projeto e responsáveis

| Fase | Entrega | Responsável |
|---|---|---|
| 0.0 Discovery & Acessos | Credenciais BB API, endpoints/licença RM, homologação | Evandro |
| 1.0 Fundação de Dados | DE-PARA em base + modelo de log | Mariana |
| 2.0 Integração BB (n8n) | OAuth2/mTLS, retorno CNAB, extrato, tarifas | Fabrício |
| 3.0 Integração RM | Importar, lançar, contabilizar, FS004 | Fabrício |
| 4.0 Orquestração & Regras | Data D-1/D-3, conciliação, exceções, e-mail | Larissa |
| 5.0 Testes & Homologação | Massa de 10 casos, aprovação key user | Mariana |
| 6.0 Deploy & Monitoramento | Produção, agendamento, este painel | Evandro |

> A lista viva de tarefas por fase está na página do projeto
> (`projetos/conciliacao-bb.html`) e no Firestore.
