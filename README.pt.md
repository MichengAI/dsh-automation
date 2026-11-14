<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Execute tarefas de programação independentes de forma agendada no DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Notas de versão](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licença: Apache-2.0](https://img.shields.io/badge/Licen%C3%A7a-Apache--2.0-blue.svg)](LICENSE)
  [![Pacote npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=pacote%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![Downloads npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=downloads%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 ou superior](https://img.shields.io/badge/Node.js-22%20ou%20superior-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation é um plugin comunitário para DeepSeek Harness (DSH), não sendo um produto oficial da DeepSeek AI.

## Visão geral dos recursos

Deixe o DSH cuidar de tarefas recorrentes de forma programada. Configure tarefas nos Ajustes ou descreva horários e instruções em uma conversa e revise os relatórios de execução a qualquer momento.

- **Execução única ou recorrente**: intervalos (em minutos), de hora em hora, diariamente, semanalmente, mensalmente ou a cada X dias.
- **Ambiente de execução flexível**: defina diretório de trabalho, modelo, habilidades e limites de permissão.
- **Ajuste de agendamento a qualquer momento**: crie, pause, retome, execute imediatamente ou exclua tarefas.
- **Revisão de resultados**: navegue pelas conversas por nome da tarefa e horário na aba **Agendadas**, ou filtre o histórico nos Ajustes.
- **Sessões isoladas**: cada execução utiliza as instruções salvas e não herda o contexto da conversa que a criou.
- **Interface em 8 idiomas**: português, inglês, chinês, japonês, espanhol, francês, alemão e russo, acompanhando o idioma global do DSH (requer DSH `0.2.2-rc.1` ou superior para idiomas além do chinês/inglês).

## Demonstração da interface

Sessões agendadas aparecem tanto na árvore oficial de **Tarefas** quanto na aba **Agendadas**. Sessões ociosas exibem o ícone oficial de relógio. Em **Agendadas → Registros**, o agrupamento padrão é por tarefa, com opção de alternar para Por espaço de trabalho, Árvore ou Plano. O modo Por espaço de trabalho mantém os espaços visíveis e filtra apenas sessões agendadas; o ícone «+» do cabeçalho abre diretamente a criação de tarefas:

![Barra lateral agendada](assets/screenshots/workspace-scheduled.png)

Acesse **Ajustes → Tarefas agendadas** para pesquisar, criar, pausar e inspecionar regras:

![Ajustes de tarefas agendadas](assets/screenshots/settings-tasks.png)

Descreva o trabalho no chat. O DSH gerenciará a aprovação conforme o modo de permissão escolhido:

![Criação de tarefa via chat](assets/screenshots/chat-create.png)

![Aprovação oficial para automation_create](assets/screenshots/chat-approval.png)

Após a confirmação, a regra é salva e um resumo é exibido na conversa:

![Tarefa agendada criada](assets/screenshots/chat-created.png)

O histórico de execuções fica registrado nos Ajustes e pode ser filtrado por dia, semana, mês, tarefa ou status:

![Histórico de execuções](assets/screenshots/settings-runs.png)

## Ecossistema de produtos DSH

Para um ambiente de desktop, baixe o [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Em instalações existentes do [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), instale plugins conforme necessário:

| Plugin | Principais funções |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organizar projetos e sessões, pesquisar tarefas e navegar no diálogo |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Escolher e invocar agentes especialistas para suas tarefas |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Localizar, habilitar, criar e importar habilidades locais |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Pesquisar, restaurar ou limpar conversas arquivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Enviar tarefas e receber respostas por plataformas de mensagens |
| [Automation](https://github.com/MichengAI/dsh-automation) | Agendar tarefas autônomas e revisar relatórios de execução |
| [BTW](https://github.com/MichengAI/dsh-btw) | Fazer perguntas rápidas sem interromper o fluxo principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Usar `/simplify` para aprimorar o código modificado no Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Incentivar o agente a testar novas abordagens e verificar resultados |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Solicitar revisão independente de código via `/review` |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Ver notificações e aprovações por meio de um mascote de desktop |

## Pré-requisitos

- Compatibilidade com o host: linha completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), validado em `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5`, `0.2.2-rc.1` `0.2.2-rc.2`, e `0.2.2-rc.3`, com suporte garantido a versões RC futuras. Hosts no `0.1.x` devem permanecer na versão `0.1.66` do plugin. Faça backup do armazenamento e das sessões antes de atualizar o host; a versão `0.2.0` grava sessões no formato V4, que se tornam ilegíveis após um downgrade.
- As dependências peerDependencies oficiais abrangem a faixa `>=0.2.0-rc.1 <0.3.0-0`. As dependências de desenvolvimento são fixadas em `0.2.2-rc.3`. Versões legadas e alterações incompatíveis da linha `0.3.0` são barradas. `@deepseek-ai/dsh-agent-presets` e `@deepseek-ai/dsh-agent-preset-registry` não são peers, utilizando o serviço `agentPresets` do host.
- Outras versões situam-se fora do escopo homologado.
- O pacote não sobrescreve a entrada Connection oficial. Cada host mantém suas próprias dependências e opções; a automação registra seus endpoints RPC em escopo próprio.
- Instalação operacional do DeepSeek Harness Web com comando `dsh` no PowerShell.
- Os exemplos utilizam o perfil `web`; adapte para o perfil de destino.
- Node.js 22.19+ para desenvolvimento ou compilação local.

## Instalação

Os comandos abaixo utilizam o registro oficial do npm.

### Solicitar instalação a um agente (recomendado)

Envie a instrução a seguir para qualquer agente com acesso ao terminal (substitua `web` pelo seu perfil):

```text
Instale o plugin DSH @michengai/dsh-automation no meu perfil web local executando: dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/. Depois execute dsh --profile web --dump-config, confirme a presença do dsh-automation e me explique como recarregar o DSH.
```

### Instalação direta pelo npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Reinicie o DSH Web e recarregue o navegador (Ctrl+F5). Fixe uma versão com `@0.1.5` em vez de `@latest` se desejar.
- **Atrás de proxy reverso**: Suporta prefixos de caminho (ex: `/app/dsh/`). As chamadas de API são resolvidas em relação a `document.baseURI`.

## Configurações e opções do plugin

Acesse:
> **Barra lateral → Plugins → Detalhes de `@michengai/dsh-automation`** (slot `plugins.bundle.config` do host).

São fornecidos dois interruptores nativos e um seletor de localização:

### 1. Entrada na barra lateral (`sidebarEntry`)
- **Padrão**: Ativado (`true`) / Transição suave em novas instalações
- **Descrição**: Exibe o ícone **Tarefas agendadas** na barra de atividades principal.
- **Efeito**:
  - **Visualização ampla de 960px**: Abre a central de tarefas em um contêiner centralizado de 960px, eliminando limites de espaço dos diálogos modais.
  - **Desregistro seguro**: Desligar o interruptor remove o slot de forma limpa e reposiciona a visualização caso estivesse aberta.
  - **Sincronização ao vivo**: O diálogo padrão de configurações e as abas do painel lateral continuam sincronizados.

### 2. Ocultar entrada oficial de automação (`hideOfficialSchedule`)
- **Padrão**: Ativado (`true`, coordenado com a entrada da barra lateral)
- **Descrição**: Oculta a entrada nativa «Tarefas de automação» (`ui-schedule`) do host, evitando duplicidades.
- **Efeito**:
  - **Substituição direta**: A entrada oficial é ocultada para destacar a central de tarefas do plugin.
  - **Restauração inteligente**: Se a tela principal exibia o agendador padrão, ela retorna com segurança para a conversa ativa.
  - **Cache local estável**: O armazenamento no cliente elimina cintilação de ícones mesmo com conexões lentas.
  - **Restauração limpa**: Desativar ou desinstalar restaura o ícone nativo sem deixar resíduos.
  - **Compatibilidade com upgrades**: Se o usuário havia desligado `sidebarEntry`, a entrada oficial permanece visível para não esvaziar a barra.

### 3. Exibir sessões agendadas na árvore de tarefas (`taskTreeSessions`)
- **Padrão**: Desativado (`false`, oculta tarefas agendadas na árvore principal)
- **Descrição**: Define se as sessões agendadas aparecem na árvore de trabalho principal.
- **Efeito**:
  - **Isolamento de ruído**: Execuções frequentes não poluem o fluxo diário de tarefas do espaço de trabalho.
  - **Acesso preservado**: Todas as execuções continuam listadas em «Agendadas → Registros».
  - **Protocolo interoperável leve**: Opera pelo contrato `NativeTabRegistry.sessionFilters` sem hacks invasivos.

### 4. Configuração em `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Opcional: diretório de dados (padrão no perfil ativo)
    runTimeoutMinutes: 60              # Opcional: tempo limite da tarefa em minutos (padrão: 60, máx: 1440)
    misfireGraceMinutes: 15            # Opcional: tolerância para execuções perdidas (minutos)
    historyLimit: 200                  # Opcional: total de registros de histórico (padrão: 200)
```

## Atualizações


## Como usar

Abra **Ajustes → Tarefas agendadas**:

| Objetivo | Ação | Escopo |
| --- | --- | --- |
| Criar regra | Clique em **Nova tarefa**, defina nome, horário, prompt, espaço, modelo e permissões | Todo o host |
| Criar via chat | Descreva o horário no chat ou escolha **Criar no chat** | Conversa atual |
| Pausar / Retomar | Use o interruptor no cartão da tarefa | Regra única |
| Executar agora | No menu do cartão, clique em **Executar agora** | Regra única |
| Excluir | No menu do cartão, clique em **Excluir tarefa** (histórico mantido) | Apenas regra |
| Ver histórico | Abra **Histórico de execuções** e filtre por data ou status | Todo o host |

Cada execução utiliza o prompt, diretório, modelo e permissões salvos, sem reaproveitar aprovações da conversa de origem.

`automation_create` e `automation_update` aceitam os mesmos controles de modelo que as configurações (`provider`, `model`, `reasoning_effort`). Ao especificar um modelo, passe `provider` e `model` como um par de identificadores válidos ou ambos como `null` para herdar o padrão global; pares incompletos são rejeitados. `automation_list` retorna por padrão os metadados e o resumo de `lastRun` (status, horário, `summary` ≤240 caracteres, erro), sem retornar o texto completo de `prompt` (informa `promptChars` no lugar); passe `include_prompt: true` quando o texto completo do prompt for necessário.

## Limites de segurança

| Item | Comportamento |
| --- | --- |
| Permissões | As opções e o padrão vêm diretamente do serviço oficial `permissionPresets` do Host, incluindo predefinições personalizadas. |
| Predefinição de Agent | Selecionada a partir do catálogo oficial `agentPresets` do Host ao criar/editar; os cartões exibem a predefinição atual e o histórico registra a predefinição utilizada em cada execução. Predefinições corrompidas aparecem desativadas. |
| Chamadas de ferramentas | Seguem estritamente as verificações de disponibilidade, permissões e aprovação do Host, sem lista de permissões fixa ou proibição de shell em segundo plano. Processos em segundo plano são gerenciados pelo Host. |
| Acesso total | A opção oficial `danger-full-access` exige a mesma confirmação de risco e aviso laranja do Chat. |
| Aprovação | A criação no chat segue a política da sessão. Acesso total (`never`) prossegue diretamente; Workspace Write / Read Only (`ask`) exibe o cartão oficial. Execuções autônomas permanecem em `never` (fail-closed). |
| Repetições | Sem repetições automáticas após o início de uma execução. |
| Reinício do Host | Registros remanescentes em `queued` ou `running` tornam-se `failed(host_interrupted)`. |
| Concorrência global | Diferentes tarefas de automação não possuem limite global de concorrência no nível do plugin, mesmo dentro do mesmo diretório. A configuração obsoleta do plugin (`maxConcurrentRuns` na configuração) não tem mais efeito e difere do campo por tarefa abaixo. |
| Intervalo mínimo | Desde `0.1.40`, agendamentos por intervalo aceitam minutos inteiros a partir de `1`. Execuções perdidas não são reproduzidas individualmente; apenas a ocorrência devida mais recente na janela de recuperação é considerada. |
| Concorrência por tarefa | Disponível desde `0.1.40`. Define execuções simultâneas no diálogo (número inteiro positivo, padrão `1`). Execuções na fila e ativas compartilham esse limite. Quando cheio, agendamentos são marcados como `skipped(overlap)` e execuções manuais retornam erro de limite. Reduzir o limite não cancela execuções existentes. Ferramentas de Agent aceitam `max_concurrent_runs`, Web RPC aceita `maxConcurrentRuns`; tarefas existentes usam por padrão `1`. |
| Isolamento de espaço de trabalho | Vinculado por padrão ao diretório da sessão de origem. Ferramentas de Agent podem especificar ou migrar tarefas via `workspace` (nome, ID, caminho ou nome da pasta); mutações entre diretórios (`update` / `run_now` / `delete`) exigem explicitamente `cross_workspace: true` para evitar acessos não autorizados; `automation_list` oferece suporte a `all_workspaces: true`. |

Um agendamento registra uma intenção futura de execução, não uma concessão contínua de permissões em cache.

## Desenvolvimento

### Instalação a partir do código-fonte

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location D:\Repository\deepseek-harness-plugin
git clone https://github.com/MichengAI/dsh-automation.git
Set-Location .\dsh-automation
pnpm install
pnpm test
pnpm build
dsh plugin --profile web add .
dsh --profile web --dump-config
```

Reinicie o DSH Web e recarregue o navegador.

O código-fonte reside em `src` e é compilado em `lib`:

- [src\index.ts](src/index.ts): Plugin do host, ferramentas e RPC.
- [src\service.ts](src/service.ts): Definições persistentes, relógio e admissão de execuções.
- [src\client\index.ts](src/client/index.ts): Página de configurações e preenchimento de chat.
- `tests\*.test.ts`: Testes de domínio, recorrência, serviço, cliente e contrato do pacote.

A instalação local lê e aplica `cordis.patch.yml`; não copie arquivos de `lib` manualmente.

Após alterar arquivos, execute os testes, recompile e reinstale a partir do diretório local:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

Mantenha a política de despacho no máximo uma vez, o isolamento padrão por espaço de trabalho com proteções explícitas (cross_workspace / all_workspaces) e aprovação fail-closed em execuções autônomas.

## Verificação

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` executa verificação de tipos, testes unitários, testes de compatibilidade e compilação. `pnpm test:host` ignora stubs e usa o AgentLoop oficial, Session V3 e o serviço de permissões com um adaptador de modelo local fixo sem chamadas externas. Interações no navegador e chamadas reais a modelos exigem testes de aceitação separados.

Regressões da barra lateral entre plugins são validadas com `pnpm test:composition <diretório dsh-im-connect>`. Compile o repositório de IM primeiro; o script lê o arquivo `lib/client.js`. Ele executa a lógica de composição e os registros de abas de ambos os repositórios, cobrindo a ordem de registro, notificações adiadas e transferência após a desinstalação entre os plugins de arquivo, IM, agendamento e Codex UI. Slots e temporizadores usam um ambiente simulado, portanto o teste não instala nenhum plugin nem substitui o teste de renderização no Desktop. Essa verificação requer um repositório externo e não está incluída no `pnpm check`; use uma revisão fixa de IM para obter resultados reproduzíveis.

`pnpm test:matrix` compila o pacote e cria ambientes npm temporários separados para cada versão declarada do host usando acesso à rede. Valida a instalação estrita de peers, todas as versões oficiais de dependências, o ponto de entrada empacotado, a execução real de AgentLoop e as regressões de serviço. Todas as versões declaradas passam. A enumeração de persistência nas regressões de serviço usa fixtures em memória para ambos os formatos de sessão fria; ela não valida a migração em disco de um perfil real. O diretório de evidências retém lockfiles de instalação, logs de teste e `results.json`. A matriz não modifica dependências de desenvolvimento nem se conecta ao perfil do usuário.

## Licença

Distribuído sob a [Licença Apache 2.0](LICENSE).
