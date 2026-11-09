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

Las sesiones programadas aparecen tanto en el árbol oficial de **Tareas** como en la pestaña **Programado**. Las sesiones inactivas muestran el icono de reloj oficial en **Tareas**. **Programado → Registros** se agrupa por tarea de forma predeterminada y permite alternar a Por espacio de trabajo, Árbol o Plano:

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

- Compatibilidad de host: serie completa DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificado en `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` y `0.2.2-rc.1`.
- Versión de Node.js: 22.19+ para desarrollo o compilación de código fuente.
- Instalación operativa de DeepSeek Harness Web con comando `dsh` en PowerShell.

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

Reinicie DSH Web y fuerce la recarga del navegador (Ctrl+F5).

## Configuración y opciones del complemento

Acceda a:
> **Barra lateral → Complementos → Detalles de `@michengai/dsh-automation`** (ranura `plugins.bundle.config` del host).

Aquí se proporcionan dos interruptores nativos y un selector de ubicación:

### 1. Entrada en barra lateral (`sidebarEntry`)
- **Predeterminado**: Activado (`true`)
- **Descripción**: Muestra un icono de **Tareas programadas** en la barra de actividad izquierda.
- **Efecto**: Abre el centro de tareas en un contenedor centrado de 960px.

### 2. Ocultar entrada oficial de automatización (`hideOfficialSchedule`)
- **Predeterminado**: Activado (`true`)
- **Descripción**: Oculta la entrada incorporada «Tareas de automatización» (`ui-schedule`) del host para evitar duplicados.

### 3. Mostrar sesiones programadas en el árbol de tareas (`taskTreeSessions`)
- **Predeterminado**: Desactivado (`false`)
- **Descripción**: Controla si las ejecuciones programadas aparecen en el árbol de trabajo principal, manteniendo el área de trabajo limpia.

### 4. Configuración en `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Opcional: directorio para almacenar configuración
    runTimeoutMinutes: 60              # Opcional: tiempo de espera en minutos (predeterminado: 60)
    misfireGraceMinutes: 15            # Opcional: ventana de tolerancia tras omisión (minutos)
    historyLimit: 200                  # Opcional: registros de historial a conservar
    updater: false                     # Opcional: bloqueo de actualizaciones para entornos empresariales
```

## Actualizaciones

El botón de comprobación de actualizaciones dentro del complemento ha sido eliminado. Para actualizar, reinstale la última versión en el mismo perfil con el comando `dsh plugin … add @latest`, reinicie DSH y recargue el navegador. En entornos empresariales restringidos, puede configurar `updater: false` en Cordis para bloquear las solicitudes de actualización (HTTP 403).

## Uso

Abra **Ajustes → Tareas programadas**:

| Objetivo | Acción | Ámbito |
| --- | --- | --- |
| Crear regla | Seleccione **Nueva tarea**, configure nombre, horario, prompt, espacio y permisos | Todo el host |
| Crear desde chat | Describa el horario en una conversación o elija **Crear en chat** | Conversación actual |
| Pausar / reanudar | Cambie el interruptor en la tarjeta de la tarea | Una regla |
| Ejecutar ahora | En el menú de la tarjeta, seleccione **Ejecutar ahora** | Una regla |
| Eliminar | En el menú de la tarjeta, seleccione **Eliminar tarea** (se conserva historial) | Solo definición |
| Ver historial | Abra **Historial de ejecuciones** y filtre por fecha o estado | Todo el host |

## Límites de seguridad

- **Permisos**: Cumplimiento riguroso del servicio `permissionPresets` del host.
- **Preajustes de agente**: Selección directa de los preajustes declarados en el host.
- **Acceso total**: Requiere confirmación de riesgo con advertencia naranja idéntica a Chat.
- **Ejecuciones desatendidas**: Se ejecutan de forma segura sin aprobación interactiva pendiente.

## Licencia

Distribuido bajo la [Licencia Apache 2.0](LICENSE). Consulte [NOTICE](NOTICE) para más detalles.
