<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Ejecute tareas de programación independientes de forma programada en DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Registro de cambios](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licencia: Apache-2.0](https://img.shields.io/badge/Licencia-Apache--2.0-blue.svg)](LICENSE)
  [![Paquete npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=paquete%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![Descargas npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=descargas%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 o superior](https://img.shields.io/badge/Node.js-22%20o%20superior-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation es un complemento para DeepSeek Harness (DSH) mantenido por la comunidad y no es un producto oficial de DeepSeek AI.

## Resumen de funciones

Deje que DSH se encargue de las tareas repetitivas de forma programada. Configure tareas en Ajustes o describa los tiempos y requisitos en una conversación, y luego revise los resultados de cada ejecución.

- **Ejecución única o periódica**: intervalos (en minutos), cada hora, diario, semanal, mensual o cada N días.
- **Entorno de trabajo flexible**: configure directorio de trabajo, modelo, habilidades y límites de permisos.
- **Ajuste de programación en cualquier momento**: cree, pause, reanude, ejecute de inmediato o elimine tareas.
- **Revisión de resultados**: consulte las conversaciones por nombre de tarea y hora de ejecución en la pestaña **Programado**, o filtre el historial en Ajustes.
- **Ejecución independiente**: cada ejecución utiliza las instrucciones guardadas y no hereda el contexto de la conversación que la creó.
- **Interfaz en 8 idiomas**: español, inglés, chino, japonés, francés, alemán, ruso y portugués, siguiendo el idioma global de DSH (requiere DSH `0.2.2-rc.1` o superior para idiomas distintos de chino e inglés).

## Vista previa de la interfaz

Las sesiones programadas aparecen tanto en el árbol oficial de **Tareas** como en la pestaña **Programado**. Las sesiones inactivas muestran el icono de reloj oficial en **Tareas**. **Programado → Registros** se agrupa por tarea de forma predeterminada y permite alternar a Por espacio de trabajo, Árbol o Plano. El modo Por espacio de trabajo mantiene visibles los espacios y solo filtra las sesiones programadas; el botón «+» de la cabecera abre directamente la creación de tareas:

![Barra lateral de tareas programadas](assets/screenshots/workspace-scheduled.png)

Abra **Ajustes → Tareas programadas** para buscar, crear, pausar e inspeccionar reglas:

![Ajustes de tareas programadas](assets/screenshots/settings-tasks.png)

Describa el trabajo en el chat. DSH gestionará la aprobación según el modo de permisos seleccionado:

![Creación de tarea desde chat](assets/screenshots/chat-create.png)

![Aprobación oficial para automation_create](assets/screenshots/chat-approval.png)

Tras la aprobación, la regla se guarda y se resume en la conversación:

![Tarea programada creada](assets/screenshots/chat-created.png)

El historial de ejecución se conserva en Ajustes y se puede filtrar por día, semana, mes, tarea o estado:

![Historial de ejecuciones](assets/screenshots/settings-runs.png)

## Ecosistema de productos DSH

Para un entorno de escritorio, descargue [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). En instalaciones existentes de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), instale complementos según sus necesidades:

| Complemento | Funcionalidad principal |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organización de proyectos y sesiones, búsqueda de tareas y navegación entre turnos |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Selección y activación de agentes especialistas según la tarea |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Búsqueda, activación, creación e importación de habilidades locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Búsqueda, restauración o limpieza de conversaciones archivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envío y recepción de tareas a través de plataformas de mensajería |
| [Automation](https://github.com/MichengAI/dsh-automation) | Programación de tareas y revisión de cada ejecución |
| [BTW](https://github.com/MichengAI/dsh-btw) | Consultas laterales rápidas sin interrumpir la tarea principal |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Uso de `/simplify` para mejorar el código dentro de sus cambios de Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guía al agente para probar nuevos enfoques tras fallos e investigar causas antes de finalizar |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Uso de `/review` para solicitar revisión de código independiente por un agente |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Notificaciones de conversación y respuestas a preguntas mediante mascota de escritorio |

## Requisitos previos

- Compatibilidad de host: serie completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificado en `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5`, `0.2.2-rc.1` y `0.2.2-rc.2`, compatible hacia adelante con versiones RC posteriores. Los hosts en `0.1.x` deben permanecer en el complemento `0.1.66`. Realice una copia de seguridad del almacenamiento de automatización y de las sesiones en el perfil antes de actualizar; `0.2.0` escribe sesiones V4, que no se pueden leer tras una degradación.
- Las dependencias peerDependencies oficiales cubren el rango generacional `>=0.2.0-rc.1 <0.3.0-0`. Las dependencias de desarrollo están fijadas en `0.2.2-rc.2`. Las versiones anteriores y cambios incompatibles en `0.3.0` son rechazados por la puerta de versión. `@deepseek-ai/dsh-agent-presets` y `@deepseek-ai/dsh-agent-preset-registry` no son peers, sino que utilizan el servicio `agentPresets` del host.
- Otras versiones quedan fuera del rango declarado; la validación estricta de peers las rechazará.
- El paquete no anula la entrada oficial Connection. Cada host conserva sus dependencias y configuración; la automatización registra su canal RPC en su propio ámbito de complemento.
- Instalación operativa de DeepSeek Harness Web con comando `dsh` en PowerShell.
- Los ejemplos utilizan el perfil `web`; cámbielo según corresponda.
- Node.js 22.19+ para desarrollo o compilación de código fuente. No se requiere ejecutar `npm install` localmente para instalaciones desde npm.

## Instalación

Los siguientes comandos utilizan el registro oficial de npm.

### Solicitar a un agente que lo instale (recomendado)

Envíe el siguiente mensaje a cualquier agente con acceso al terminal (sustituya `web` por su perfil):

```text
Instala el complemento DSH @michengai/dsh-automation en mi perfil web local ejecutando: dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/. Luego ejecuta dsh --profile web --dump-config, confirma que la configuración incluya dsh-automation y explícame cómo recargar DSH y empezar a usarlo.
```

### Instalación directa desde npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Reinicie DSH Web y fuerce la recarga del navegador (Ctrl+F5). Fije una versión con `@0.1.5` en lugar de `@latest` si lo requiere.
- **Despliegue tras proxy inverso**: Admite prefijos de ruta detrás de proxies (ej. `/app/dsh/`). Las llamadas API se resuelven de forma relativa a `document.baseURI`.

## Configuración y opciones del complemento

Acceda a:
> **Barra lateral → Complementos → Detalles de `@michengai/dsh-automation`** (ranura `plugins.bundle.config` del host).

Aquí se proporcionan dos interruptores nativos y un selector de ubicación:

### 1. Entrada en barra lateral (`sidebarEntry`)
- **Predeterminado**: Activado (`true`) / Traspaso fluido en nuevas instalaciones
- **Descripción**: Muestra un icono de **Tareas programadas** en la barra de actividad izquierda.
- **Efecto**:
  - **Vista centrada de 960px**: Abre el centro de tareas en un contenedor centrado y amplio de 960px, superando las limitaciones de espacio de los diálogos modales.
  - **Desregistro limpio**: Al desactivar, anula el registro de la ranura de forma segura y devuelve la vista a un estado neutro si estaba activa.
  - **Sincronización en vivo**: El modal de ajustes estándar y las pestañas del espacio de trabajo permanecen completamente disponibles y sincronizados.

### 2. Ocultar entrada oficial de automatización (`hideOfficialSchedule`)
- **Predeterminado**: Activado (`true`, coordinado con la entrada de la barra lateral)
- **Descripción**: Oculta la entrada incorporada «Tareas de automatización» (`ui-schedule`) del host para evitar duplicados.
- **Efecto**:
  - **Sustitución fluida**: Oculto por defecto mientras se muestra la entrada del complemento, evitando iconos duplicados.
  - **Reinicio inteligente del panel**: Si la vista principal mostraba los horarios oficiales, se restablece de forma segura a la conversación por defecto.
  - **Caché local sin parpadeos**: Dispone de almacenamiento local en el cliente que previene parpadeos de iconos incluso sin conexión.
  - **Restauración sin residuos**: Desactivar o desinstalar restaura la entrada oficial de inmediato.
  - **Seguridad en actualizaciones**: Si el usuario había desactivado `sidebarEntry` previamente, la entrada oficial permanece visible para evitar una barra vacía.

### 3. Mostrar sesiones programadas en el árbol de tareas (`taskTreeSessions`)
- **Predeterminado**: Desactivado (`false`, oculta sesiones programadas en el árbol para mantener el área limpia)
- **Descripción**: Controla si las ejecuciones programadas aparecen en el árbol de trabajo principal.
- **Efecto**:
  - **Aislamiento de ruido**: Las sesiones programadas se filtran del árbol principal, evitando que ejecuciones frecuentes abarroten los espacios habituales.
  - **Revisión sin pérdidas**: Todas las ejecuciones pasadas continúan listadas en «Programado → Registros» y se pueden consultar en cualquier momento.
  - **Protocolo ligero entre complementos**: Basado en el estándar `NativeTabRegistry.sessionFilters`, conviviendo armónicamente con IM Connect y Archive Manager.

### 4. Configuración en `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Opcional: directorio para almacenar configuración (por defecto en perfil activo)
    runTimeoutMinutes: 60              # Opcional: tiempo de espera en minutos (predeterminado: 60, máx: 1440)
    misfireGraceMinutes: 15            # Opcional: ventana de tolerancia tras omisión en minutos (predeterminado: 15)
    historyLimit: 200                  # Opcional: registros de historial a conservar (predeterminado: 200)
```

## Actualizaciones


## Uso

Abra **Ajustes → Tareas programadas**:

| Objetivo | Acción | Ámbito |
| --- | --- | --- |
| Crear regla | Seleccione **Nueva tarea**, configure nombre, horario, prompt, espacio, modelo, habilidades y permisos | Todo el host |
| Crear desde chat | Describa el horario en una conversación o elija **Crear en chat** | Conversación actual |
| Pausar / reanudar | Cambie el interruptor en la tarjeta de la tarea | Una regla |
| Ejecutar ahora | En el menú de la tarjeta, seleccione **Ejecutar ahora** | Una regla |
| Eliminar | En el menú de la tarjeta, seleccione **Eliminar tarea** (se conserva historial) | Solo definición |
| Ver historial | Abra **Historial de ejecuciones** y filtre por día, semana, mes, tarea o estado | Todo el host |

Cada ejecución utiliza el prompt, espacio de trabajo, modelo y límites de permisos guardados. No reutiliza aprobaciones del chat original.

`automation_create` y `automation_update` admiten los mismos controles de modelo que los Ajustes (`provider`, `model`, `reasoning_effort`). Al especificar o modificar un modelo, envíe `provider` y `model` como identificadores no vacíos emparejados o ambos como `null` para seguir la selección global; los pares incompletos serán rechazados. `automation_list` devuelve de forma predeterminada los metadatos y el resumen de `lastRun` (estado, hora, `summary` ≤240 caracteres, error), sin devolver el texto completo de `prompt` (informa `promptChars` en su lugar); pase `include_prompt: true` cuando se requiera el texto completo del prompt.

## Límites de seguridad

| Elemento | Comportamiento |
| --- | --- |
| Permisos | Las opciones y los valores predeterminados provienen directamente del servicio oficial `permissionPresets` del Host, incluidos los ajustes personalizados. |
| Ajuste predeterminado de Agent | Selección en el catálogo oficial `agentPresets` del Host al crear o editar; las tarjetas muestran el ajuste actual y el historial registra el utilizado en cada ejecución. Los ajustes dañados se muestran deshabilitados. |
| Llamadas a herramientas | Siguen estrictamente las comprobaciones de disponibilidad, permisos y aprobaciones del Host, sin listas blancas fijas ni prohibiciones de shells en segundo plano. Los procesos en segundo plano son administrados por el Host. |
| Acceso total | La opción oficial `danger-full-access` requiere la misma confirmación de riesgo y advertencia naranja que el Chat. |
| Aprobaciones | La creación mediante chat sigue la política de la sesión. Acceso total (`never`) procede directamente; Workspace Write / Read Only (`ask`) muestra la tarjeta oficial. Las ejecuciones desatendidas se mantienen en `never` (fail-closed). |
| Reintentos | Sin reintentos automáticos una vez iniciada la ejecución. |
| Reinicio del Host | Las ejecuciones pendientes en `queued` o `running` pasan a `failed(host_interrupted)`. |
| Concurrencia | Diferentes automatizaciones no tienen un límite de concurrencia global a nivel de complemento, incluso dentro del mismo directorio. La configuración obsoleta a nivel de plugin (`maxConcurrentRuns` en la configuración) ya no tiene efecto y es independiente del campo por tarea. |
| Intervalo mínimo | A partir de `0.1.40`, los horarios por intervalo admiten minutos enteros a partir de `1`. No se repiten eventos perdidos individualmente; solo se evalúa la ejecución vencida más reciente dentro de la ventana de recuperación. |
| Concurrencia por tarea | Disponible desde `0.1.40`. Permite configurar ejecuciones concurrentes en el diálogo (entero positivo, predeterminado `1`). Las ejecuciones en cola y activas comparten este límite. Al alcanzarse, los eventos programados se marcan como `skipped(overlap)` y las ejecuciones manuales devuelven un error de límite. Reducir el límite no cancela ejecuciones activas. Las herramientas de Agent aceptan `max_concurrent_runs`, Web RPC acepta `maxConcurrentRuns`; tareas previas usan por defecto `1`. |
| Aislamiento de espacio de trabajo | Vinculado por defecto al espacio de trabajo de la sesión de origen. Las herramientas de Agent pueden especificar o migrar tareas mediante `workspace` (nombre, ID, ruta o nombre del directorio); las operaciones entre espacios (`update` / `run_now` / `delete`) requieren explícitamente `cross_workspace: true` para evitar escapes no autorizados; `automation_list` admite `all_workspaces: true`. |

Una programación representa una intención futura, no una concesión de permisos almacenada en caché.

## Desarrollo

### Instalación desde código fuente

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

Reinicie DSH Web y recargue el navegador.

El código fuente reside en `src` y se compila en `lib`:

- [src\index.ts](src/index.ts): Complemento de host, herramientas y RPC.
- [src\service.ts](src/service.ts): Definiciones persistentes, reloj y admisión de ejecuciones.
- [src\client\index.ts](src/client/index.ts): Página de ajustes y autocompletado en chat.
- `tests\*.test.ts`: Pruebas de dominio, recurrencia, servicio, cliente y contratos.

La instalación local lee y aplica `cordis.patch.yml`; no copie los archivos de `lib` manualmente.

Tras modificar archivos, ejecute pruebas, recompile y reinstale desde el directorio local:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

Mantenga la política de despacho como máximo una vez, el aislamiento predeterminado de espacio de trabajo con protecciones explícitas (cross_workspace / all_workspaces) y el cierre por fallo en ejecuciones desatendidas.

## Verificación

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` ejecuta comprobación de tipos, pruebas unitarias, compatibilidad con host y compilación. `pnpm test:host` utiliza el AgentLoop oficial, Session V3 y el servicio de permisos con un adaptador de modelo local sin realizar llamadas externas. Las interacciones con el navegador y las llamadas a modelos reales requieren pruebas de aceptación independientes.

Las regresiones de la barra lateral entre complementos se verifican con `pnpm test:composition <directorio dsh-im-connect>`. Compile primero el repositorio de IM; el script lee su `lib/client.js`. Ejecuta la lógica de composición y los registros de pestañas de ambos repositorios, cubriendo el orden de registro, las notificaciones diferidas y la transferencia tras la desinstalación en los complementos de archivo, IM, programados y Codex UI. Las ranuras y temporizadores utilizan un entorno simulado, por lo que no instala ningún complemento ni sustituye las pruebas de aceptación de renderizado en escritorio. Esta comprobación requiere un repositorio externo y no está incluida en `pnpm check`; utilice una revisión fija de IM para obtener resultados reproducibles.

`pnpm test:matrix` compila el paquete y crea entornos npm temporales independientes para cada versión declarada del host mediante acceso a la red. Valida la instalación estricta de peers, todas las versiones de dependencias oficiales, el punto de entrada empaquetado, la ejecución real de AgentLoop y las regresiones de servicio. Todas las versiones declaradas pasan con éxito. La enumeración de persistencia en regresiones de servicio utiliza accesorios en memoria para ambos formatos de sesión en frío; no valida la migración en disco de un perfil real. El directorio de evidencias conserva archivos de bloqueo de instalación, registros de prueba y `results.json`. La matriz no modifica las dependencias de desarrollo ni se conecta al perfil del usuario.

## Licencia

Distribuido bajo la [Licencia Apache 2.0](LICENSE).
