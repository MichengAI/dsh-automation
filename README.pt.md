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

Sessões agendadas aparecem tanto na árvore oficial de **Tarefas** quanto na aba **Agendadas**. Sessões ociosas exibem o ícone oficial de relógio. Em **Agendadas → Registros**, o agrupamento padrão é por tarefa, com opção de alternar para Por espaço de trabalho, Árvore ou Plano:

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

- Compatibilidade com o host: linha completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), validado em `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` e `0.2.2-rc.1`.
- Node.js 22.19+ para desenvolvimento ou compilação local.
- Instalação operacional do DeepSeek Harness Web com comando `dsh` no PowerShell.

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

Reinicie o DSH Web e recarregue o navegador (Ctrl+F5).

## Configurações e opções do plugin

Acesse:
> **Barra lateral → Plugins → Detalhes de `@michengai/dsh-automation`** (slot `plugins.bundle.config` do host).

São fornecidos dois interruptores nativos e um seletor de localização:

### 1. Entrada na barra lateral (`sidebarEntry`)
- **Padrão**: Ativado (`true`)
- **Descrição**: Exibe o ícone **Tarefas agendadas** na barra de atividades principal.
- **Efeito**: Abre o painel central em uma área ampla e centralizada de 960px.

### 2. Ocultar entrada oficial de automação (`hideOfficialSchedule`)
- **Padrão**: Ativado (`true`)
- **Descrição**: Oculta a entrada nativa «Tarefas de automação» (`ui-schedule`) do host, evitando duplicidades.

### 3. Exibir sessões agendadas na árvore de tarefas (`taskTreeSessions`)
- **Padrão**: Desativado (`false`)
- **Descrição**: Define se as sessões agendadas aparecem na árvore de trabalho principal, mantendo a organização.

### 4. Configuração em `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Opcional: diretório de dados
    runTimeoutMinutes: 60              # Opcional: tempo limite da tarefa em minutos (padrão: 60)
    misfireGraceMinutes: 15            # Opcional: tolerância para execuções perdidas (minutos)
    historyLimit: 200                  # Opcional: total de registros de histórico
    updater: false                     # Opcional: bloqueio de atualizações corporativas
```

## Atualizações

O botão interno de atualização foi removido. Para atualizar, reinstale a versão mais recente com o comando `dsh plugin … add @latest`, reinicie o DSH e recarregue o navegador. Em redes corporativas fechadas, declare `updater: false` no Cordis para rejeitar requisições de atualização (HTTP 403).

## Como usar

Abra **Ajustes → Tarefas agendadas**:

| Objetivo | Ação | Escopo |
| --- | --- | --- |
| Criar regra | Clique em **Nova tarefa**, defina nome, horário, prompt e permissões | Todo o host |
| Criar via chat | Descreva o horário no chat ou escolha **Criar no chat** | Conversa atual |
| Pausar / Retomar | Use o interruptor no cartão da tarefa | Regra única |
| Executar agora | No menu do cartão, clique em **Executar agora** | Regra única |
| Excluir | No menu do cartão, clique em **Excluir tarefa** (histórico mantido) | Apenas regra |
| Ver histórico | Abra **Histórico de execuções** e filtre por data ou status | Todo o host |

## Limites de segurança

- **Permissões**: Conformidade total com o serviço `permissionPresets` do host.
- **Predefinições de agente**: Seleção direta entre os perfis registrados no host.
- **Acesso total**: `danger-full-access` exige confirmação de risco com aviso laranja igual ao Chat.
- **Execuções autônomas**: Execução segura sem bloqueios interativos suspensos.

## Licença

Distribuído sob a [Licença Apache 2.0](LICENSE). Consulte [NOTICE](NOTICE) para mais detalhes.
