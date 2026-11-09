<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Eigenständige Programmieraufgaben nach Zeitplan in DeepSeek Harness automatisieren**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Änderungsprotokoll](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Lizenz: Apache-2.0](https://img.shields.io/badge/Lizenz-Apache--2.0-blue.svg)](LICENSE)
  [![npm Paket](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=npm%20Paket)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![npm Downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=npm%20Downloads)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 oder höher](https://img.shields.io/badge/Node.js-22%20oder%20h%C3%B6her-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation ist ein von der Community gepflegtes Plugin für DeepSeek Harness (DSH) und kein offizielles Produkt von DeepSeek AI.

## Funktionsübersicht

Überlassen Sie DSH wiederkehrende Aufgaben nach Zeitplan. Richten Sie Aufgaben in den Einstellungen ein oder beschreiben Sie Anforderungen in einer Unterhaltung – die Ausführungsergebnisse können Sie jederzeit einsehen.

- **Einmalige oder wiederkehrende Ausführung**: Minutenintervalle, stündlich, täglich, wöchentlich, monatlich oder alle X Tage.
- **Flexible Arbeitsumgebung**: Arbeitsverzeichnis, Modell, Skills und Berechtigungsgrenzen individuell festlegen.
- **Zeitpläne jederzeit anpassen**: Aufgaben erstellen, pausieren, fortsetzen, sofort ausführen oder löschen.
- **Ergebnisse prüfen**: Unterhaltungen nach Aufgabenname und Ausführungszeit im Reiter **Geplant** durchsuchen oder den Verlauf in den Einstellungen filtern.
- **Unabhängige Sitzungen**: Jeder Lauf verwendet die gespeicherten Instruktionen und erbt nicht den vorherigen Chatverlauf.
- **8 integrierte Sprachen**: Deutsch, Englisch, Chinesisch, Japanisch, Spanisch, Französisch, Russisch und Portugiesisch, abgestimmt auf die globale DSH-Spracheinstellung (für nicht-chinesische/englische Sprachen ist DSH `0.2.2-rc.1` oder höher erforderlich).

## Benutzeroberfläche

Geplante Sitzungen erscheinen sowohl im offiziellen **Aufgaben**-Baum als auch im Reiter **Geplant**. Inaktive geplante Sitzungen zeigen das offizielle Uhrensymbol. Die Ansicht **Geplant → Verlauf** gruppiert standardmäßig nach Aufgaben und kann auf Nach Arbeitsbereich, Arbeitsbereichsbaum oder flache Liste umgeschaltet werden. Die Arbeitsbereichsansicht behält Arbeitsbereiche sichtbar und filtert Sitzungen auf geplante Läufe; das Kopfzeilen-Pluszeichen öffnet direkt den Dialog für neue Aufgaben:

![Geplante Seitenleiste](assets/screenshots/workspace-scheduled.png)

Öffnen Sie **Einstellungen → Geplante Aufgaben**, um Regeln zu durchsuchen, neu anzulegen, zu pausieren oder zu prüfen:

![Einstellungen für geplante Aufgaben](assets/screenshots/settings-tasks.png)

Beschreiben Sie die Aufgabe im Chat. DSH übernimmt die Genehmigung gemäß dem ausgewählten Berechtigungsmodus:

![Aufgabe über Chat erstellen](assets/screenshots/chat-create.png)

![Offizielle Genehmigung für automation_create](assets/screenshots/chat-approval.png)

Nach Bestätigung wird die Regel gespeichert und im Chat zusammengefasst:

![Geplante Aufgabe erfolgreich erstellt](assets/screenshots/chat-created.png)

Der Ausführungsverlauf bleibt in den Einstellungen erhalten und kann nach Tag, Woche, Monat, Aufgabe oder Status gefiltert werden:

![Ausführungsverlauf](assets/screenshots/settings-runs.png)

## DSH-Produktökosystem

Für eine Desktop-Umgebung laden Sie [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) herunter. Bestehende [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)-Installationen können Plugins nach Bedarf hinzufügen:

| Plugin | Beschreibung |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Projekte und Sitzungen organisieren, Aufgaben suchen und Dialoge navigieren |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Spezialisierte Agenten für spezifische Aufgaben auswählen und aufrufen |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Lokale Skills finden, aktivieren, erstellen und importieren |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Archivierte Sitzungen durchsuchen, wiederherstellen oder bereinigen |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Aufgaben über Messaging-Plattformen senden und Antworten empfangen |
| [Automation](https://github.com/MichengAI/dsh-automation) | Aufgaben zeitgesteuert ausführen und Ausführungsberichte einsehen |
| [BTW](https://github.com/MichengAI/dsh-btw) | Schnelle Nebenfragen stellen, ohne den Hauptarbeitsablauf zu unterbrechen |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Mit `/simplify` Code im Rahmen von Git-Änderungen optimieren |
| [PUA](https://github.com/MichengAI/dsh-pua) | Agenten bei Fehlern zu neuen Ansätzen leiten und Ergebnisse vor Abschluss prüfen |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Mit `/review` unabhängige Agent-Codeüberprüfungen anfordern |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Benachrichtigungen und Genehmigungen über ein Desktop-Haustier verwalten |

## Voraussetzungen

- Host-Kompatibilität: Volle DeepSeek Harness `0.2.x`-Reihe (`>=0.2.0-rc.1 <0.3.0-0`), verifiziert mit `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` und `0.2.2-rc.1`, und vorwärtskompatibel mit nachfolgenden 0.2.x RC-Releases. Hosts auf `0.1.x` sollten bei Plugin `0.1.66` verbleiben. Sichern Sie Speicher und Sitzungen im Profil vor dem Host-Upgrade; `0.2.0` schreibt V4-Sitzungen, die nach einem Downgrade nicht mehr lesbar sind.
- Offizielle DSH-peerDependencies decken den Generationsbereich `>=0.2.0-rc.1 <0.3.0-0` ab. Entwicklungsabhängigkeiten sind auf `0.2.2-rc.1` festgelegt. Ältere Versionen und inkompatible `0.3.0`-Änderungen werden durch das Versionsgate abgewiesen. `@deepseek-ai/dsh-agent-presets` und `@deepseek-ai/dsh-agent-preset-registry` sind keine Peers, sondern nutzen den Host-Dienst `agentPresets`.
- Andere Versionen liegen außerhalb des deklarierten Bereichs. Strengere Peer-Prüfungen lehnen sie ab.
- Das Bundle überschreibt nicht den offiziellen Connection-Eintrag. Jeder Host behält seine Abhängigkeiten und Konfiguration; Automation registriert seinen RPC-Kanal im eigenen Plugin-Scope.
- Eine lauffähige DeepSeek Harness Web-Installation mit `dsh` in PowerShell.
- Beispiele verwenden das Profil `web`; ersetzen Sie es durch das Zielprofil.
- Node.js 22.19+ für Entwicklung oder Quellcode-Builds. Für npm-Installationen ist kein lokales `npm install` nötig.

## Installation

Die folgenden Befehle nutzen die offizielle npm-Registry.

### Von einem Agenten installieren lassen (empfohlen)

Senden Sie die folgende Aufforderung an einen Agenten mit Terminal-Zugriff (ersetzen Sie `web` durch Ihr Profil):

```text
Installiere das DSH-Plugin @michengai/dsh-automation in mein lokales Web-Profil: dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/. Führe anschließend dsh --profile web --dump-config aus, bestätige das Vorhandensein von dsh-automation und erkläre mir die ersten Schritte.
```

### Installation über npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Starten Sie DSH Web neu und aktualisieren Sie den Browser (Strg+F5). Fixieren Sie bei Bedarf eine Version mit `@0.1.5` statt `@latest`.
- **Reverse-Proxy-Betrieb**: Unterstützt Pfad-Präfixe hinter Proxies (z.B. `/app/dsh/`). API-Aufrufe lösen relativ zu `document.baseURI` auf.

## Plugin-Konfiguration & Schalter

Öffnen Sie:
> **Seitenleiste → Plugins → `@michengai/dsh-automation` Details** (Slot `plugins.bundle.config` des Hosts).

Es stehen zwei native Schalter und eine Anzeigeort-Auswahl zur Verfügung:

### 1. Seitenleisteneintrag (`sidebarEntry`)
- **Standard**: Aktiviert (`true`) / Nahtlose Übernahme bei Neuinstallation
- **Beschreibung**: Zeigt ein **Geplante Aufgaben**-Symbol in der primären Aktivitätsleiste.
- **Wirkung**:
  - **960px zentrierte Ansicht**: Öffnet das Aufgabenzentrum in einem 960px breiten zentrierten Bereich (analog zum Plugin-Manager).
  - **Saubere Deaktivierung**: Beim Ausschalten wird der Slot sauber abgemeldet und aktive Ansichten sicher zurückgesetzt.
  - **Live-Synchronisation**: Der Standard-Einstellungsdialog und die Arbeitsbereichsreiter bleiben synchron verfügbar.

### 2. Offiziellen Automatisierungseintrag ausblenden (`hideOfficialSchedule`)
- **Standard**: Aktiviert (`true`, abgestimmt auf den Seitenleisteneintrag)
- **Beschreibung**: Blendet den integrierten Host-Eintrag «Automatisierungsaufgaben» (`ui-schedule`) aus, um doppelte Symbole zu verhindern.
- **Wirkung**:
  - **Nahtlose Ablösung**: Das integrierte Symbol wird standardmäßig verborgen und durch das Plugin-Symbol ersetzt.
  - **Sichere Bereichsrücksetzung**: Befindet sich der Hauptbereich in der offiziellen Zeitplanansicht, wird er sicher auf die Standardunterhaltung zurückgesetzt.
  - **Flackerfreie Zwischenspeicherung**: Lokale Speicherung verhindert Icon-Flackern bei langsamen Verbindungen.
  - **Rückstandsfreie Wiederherstellung**: Beim Deaktivieren oder Deinstallieren wird der offizielle Eintrag sofort wieder sichtbar.
  - **Upgradesicherheit**: Hatten Benutzer den Seitenleisteneintrag zuvor deaktiviert, bleibt der offizielle Eintrag standardmäßig sichtbar.

### 3. Geplante Sitzungen im Aufgabenbaum anzeigen (`taskTreeSessions`)
- **Standard**: Deaktiviert (`false`, blendet geplante Sitzungen im Aufgabenbaum aus)
- **Beschreibung**: Bestimmt, ob geplante Läufe im primären Aufgabenbaum aufgeführt werden.
- **Wirkung**:
  - **Reduzierung von Unruhe**: Verhindert, dass häufige Automatisierungsläufe den regulären Arbeitsbereich überfüllen.
  - **Verlustfreie Prüfung**: Alle vergangenen Läufe bleiben unter «Geplant → Verlauf» vollständig einsehbar.
  - **Leichtes Protokoll**: Nutzt den `NativeTabRegistry.sessionFilters`-Vertrag ohne invasive Eingriffe und koexistiert sauber mit IM Connect und Archive Manager.

### 4. Konfiguration in `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Optional: Verzeichnis für Konfigurationsdateien
    runTimeoutMinutes: 60              # Optional: Zeitlimit pro Aufgabe in Minuten (Standard: 60, Max: 1440)
    misfireGraceMinutes: 15            # Optional: Toleranzfenster für verpasste Ausführungen (Minuten, Standard: 15)
    historyLimit: 200                  # Optional: Maximale Anzahl an Verlaufseinträgen (Standard: 200)
    updater: false                     # Optional: Update-Sperre für Unternehmensumgebungen (alias: onlineUpdate: false)
```

## Updates

Die Aktualisierungsschaltfläche in den Plugin-Einstellungen wurde entfernt. Zur Aktualisierung installieren Sie einfach die neueste Version im selben Profil via `dsh plugin … add @latest`, starten DSH neu und aktualisieren den Browser. In gesperrten Unternehmensumgebungen kann `updater: false` oder `onlineUpdate: false` in Cordis konfiguriert werden, um Update-Anfragen abzuweisen (HTTP 403).

## Bedienung

Öffnen Sie **Einstellungen → Geplante Aufgaben**:

| Ziel | Aktion | Geltungsbereich |
| --- | --- | --- |
| Regel erstellen | **Neue geplante Aufgabe** wählen, Name, Zeitplan, Prompt, Arbeitsbereich, Modell und Berechtigungen festlegen | Gesamter Host |
| Über Chat erstellen | Zeitplan in einer Unterhaltung beschreiben oder **Im Chat erstellen** wählen | Aktueller Chat |
| Pausieren / Fortsetzen | Schalter auf der Aufgabenkarte umschalten | Einzelne Regel |
| Jetzt ausführen | Im Menü der Karte **Jetzt ausführen** wählen | Einzelne Regel |
| Löschen | Im Menü der Karte **Aufgabe löschen** wählen (Verlauf bleibt erhalten) | Nur Definition |
| Verlauf einsehen | **Ausführungsverlauf** öffnen und nach Datum oder Status filtern | Gesamter Host |

Jeder Lauf verwendet die gespeicherten Instruktionen, das Arbeitsverzeichnis, Modell und Berechtigungsgrenzen. Er übernimmt keine Bestätigungen aus dem Quell-Chat.

`automation_create` und `automation_update` unterstützen dieselben Modelloptionen wie die Benutzeroberfläche (`provider`, `model`, `reasoning_effort`). Wird ein Modell angegeben, müssen `provider` und `model` als Paar nicht-leerer IDs oder beide als `null` (folgt globaler Auswahl) übergeben werden; unvollständige Paare werden abgelehnt.
 `automation_list` gibt standardmäßig nur Metadaten und die `lastRun`-Zusammenfassung (Status, Zeit, `summary` ≤240 Zeichen, Fehler) zurück, ohne den vollständigen `prompt`-Text auszugeben (meldet stattdessen `promptChars`); übergeben Sie `include_prompt: true`, wenn der vollständige Prompt-Wortlaut benötigt wird.

## Sicherheitsgrenzen

| Element | Verhalten |
| --- | --- |
| Berechtigung | Optionen und Standardwerte stammen direkt aus dem `permissionPresets`-Dienst des Hosts. |
| Agent-Voreinstellungen | Auswahl aus dem Host-Verzeichnis `agentPresets`; Karten zeigen die aktuelle Voreinstellung. |
| Werkzeugaufrufe | Folgen den Verfügbarkeits-, Berechtigungs- und Genehmigungsprüfungen des Hosts ohne starre Positivlisten. |
| Vollzugriff | Die offizielle Option `danger-full-access` erfordert dieselbe Risikobestätigung wie der Chat. |
| Genehmigung | Die Erstellung im Chat folgt der Sitzungsrichtlinie. Unbeaufsichtigte Hintergrundläufe bleiben fail-closed (`never`). |
| Wiederholung | Keine automatische Wiederholung nach Start eines Laufs. |
| Host-Neustart | Verbleibende `queued`- oder `running`-Einträge wechseln auf `failed(host_interrupted)`. |
| Gesamtkapazität | Kein globales Parallelitätslimit auf Plugin-Ebene; separate Steuerung pro Aufgabe. |
| Mindestintervall | Ab `0.1.40` werden Minutenintervalle ab 1 Minute akzeptiert. Bei verpassten Terminen wird nur der jüngste fällige Lauf berücksichtigt. |
| Einzelaufgaben-Parallelität | Einstellbare gleichzeitige Läufe pro Aufgabe (positive Ganzzahl, Standard: 1). Bei voller Auslastung werden Termine übersprungen (`skipped(overlap)`). |
| Arbeitsbereichsbegrenzung | Standardmäßig an den Ursprungsarbeitsbereich gebunden. Bereichsübergreifende Aktionen erfordern explizit `cross_workspace: true`. |

Ein Zeitplan speichert künftige Ausführungsabsichten, keine dauerhaft gecachte Berechtigungserteilung.

## Entwicklung

### Installation aus dem Quellcode

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

Starten Sie DSH Web neu und aktualisieren Sie den Browser.

Der aktuelle Quellcode befindet sich in `src` und wird in `lib` kompiliert:

- [src\index.ts](src/index.ts): Host-Plugin, Werkzeuge und RPC.
- [src\service.ts](src/service.ts): Persistente Definitionen, Taktung und Laufsteuerung.
- [src\client\index.ts](src/client/index.ts): Einstellungsseite und Chat-Vorbelegung.
- `tests\*.test.ts`: Domänen-, Wiederholungs-, Service-, Client- und Vertragstests.

Die lokale Installation liest und wendet `cordis.patch.yml` an; kopieren Sie `lib`-Dateien nicht manuell.

Nach Dateiänderungen Tests ausführen, neu kompilieren und aus dem lokalen Verzeichnis neu installieren:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm check
dsh plugin --profile web add .
```

Behalten Sie bei Änderungen am Ausführungscode die At-Most-Once-Dispatch-Richtlinie, die standardmäßige Arbeitsbereichsbegrenzung für Agenten-Tools mit expliziten Schutzmechanismen (cross_workspace / all_workspaces) und die Fail-Closed-Genehmigung bei unbeaufsichtigten Läufen bei.

## Verifikation

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
pnpm test
pnpm build
```

`pnpm check` führt Typecheck, Tests, Host-Kompatibilitätsprüfungen und Build aus. `pnpm test:host` umgeht Test-Doubles und nutzt den offiziellen AgentLoop, Session V3 und den Berechtigungsdienst mit einem lokalen Modelladapter ohne externe Modellaufrufe.

Plugin-übergreifende Seitenleisten-Regressionen werden mit `pnpm test:composition <dsh-im-connect checkout>` geprüft. Das Skript liest die kompilierte `lib/client.js` von IM ein und prüft Registrierungsreihenfolge, verzögerte Benachrichtigungen und Deinstallationsübergaben über Archive, IM, Scheduled und Codex UI.

`pnpm test:matrix` erstellt isolierte temporäre npm-Umgebungen für jede deklarierte Host-Version, um strikte Peer-Installationen, offizielle Abhängigkeiten und echte AgentLoop-Ausführungen zu verifizieren.

## Lizenz

Dieses Projekt steht unter der [Apache-Lizenz 2.0](LICENSE). Weitere Hinweise finden Sie in [NOTICE](NOTICE).
