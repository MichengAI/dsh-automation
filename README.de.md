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

Geplante Sitzungen erscheinen sowohl im offiziellen **Aufgaben**-Baum als auch im Reiter **Geplant**. Inaktive geplante Sitzungen zeigen das offizielle Uhrensymbol. Die Ansicht **Geplant → Verlauf** gruppiert standardmäßig nach Aufgaben und kann auf Arbeitsbereich, Arbeitsbereichsbaum oder flache Liste umgeschaltet werden:

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

- Host-Kompatibilität: DeepSeek Harness `0.2.x`-Reihe (`>=0.2.0-rc.1 <0.3.0-0`), verifiziert mit `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` und `0.2.2-rc.1`.
- Node.js 22.19+ für Entwicklung oder Quellcode-Builds.
- Eine lauffähige DeepSeek Harness Web-Installation mit `dsh` in PowerShell.

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

Starten Sie DSH Web neu und aktualisieren Sie den Browser (Strg+F5).

## Plugin-Konfiguration & Schalter

Öffnen Sie:
> **Seitenleiste → Plugins → `@michengai/dsh-automation` Details** (Slot `plugins.bundle.config` des Hosts).

Es stehen zwei native Schalter und eine Anzeigeort-Auswahl zur Verfügung:

### 1. Seitenleisteneintrag (`sidebarEntry`)
- **Standard**: Aktiviert (`true`)
- **Beschreibung**: Zeigt ein **Geplante Aufgaben**-Symbol in der primären Aktivitätsleiste.
- **Wirkung**: Öffnet das Aufgabenzentrum in einem 960px breiten zentrierten Bereich.

### 2. Offiziellen Automatisierungseintrag ausblenden (`hideOfficialSchedule`)
- **Standard**: Aktiviert (`true`)
- **Beschreibung**: Blendet den integrierten Host-Eintrag «Automatisierungsaufgaben» (`ui-schedule`) aus, um doppelte Symbole zu verhindern.

### 3. Geplante Sitzungen im Aufgabenbaum anzeigen (`taskTreeSessions`)
- **Standard**: Deaktiviert (`false`)
- **Beschreibung**: Bestimmt, ob geplante Läufe im primären Aufgabenbaum aufgeführt werden. Hält Arbeitsbereiche sauber.

### 4. Konfiguration in `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Optional: Verzeichnis für Konfigurationsdateien
    runTimeoutMinutes: 60              # Optional: Zeitlimit pro Aufgabe in Minuten (Standard: 60)
    misfireGraceMinutes: 15            # Optional: Toleranzfenster für verpasste Ausführungen (Minuten)
    historyLimit: 200                  # Optional: Maximale Anzahl an Verlaufseinträgen
    updater: false                     # Optional: Update-Sperre für Unternehmensumgebungen
```

## Updates

Die Aktualisierungsschaltfläche in den Plugin-Einstellungen wurde entfernt. Zur Aktualisierung installieren Sie einfach die neueste Version im selben Profil via `dsh plugin … add @latest`, starten DSH neu und aktualisieren den Browser. In gesperrten Unternehmensumgebungen kann `updater: false` in Cordis konfiguriert werden, um Update-Anfragen abzuweisen (HTTP 403).

## Bedienung

Öffnen Sie **Einstellungen → Geplante Aufgaben**:

| Ziel | Aktion | Geltungsbereich |
| --- | --- | --- |
| Regel erstellen | **Neue geplante Aufgabe** wählen, Name, Zeitplan, Prompt und Berechtigungen festlegen | Gesamter Host |
| Über Chat erstellen | Zeitplan in einer Unterhaltung beschreiben oder **Im Chat erstellen** wählen | Aktueller Chat |
| Pausieren / Fortsetzen | Schalter auf der Aufgabenkarte umschalten | Einzelne Regel |
| Jetzt ausführen | Im Menü der Karte **Jetzt ausführen** wählen | Einzelne Regel |
| Löschen | Im Menü der Karte **Aufgabe löschen** wählen (Verlauf bleibt erhalten) | Nur Definition |
| Verlauf einsehen | **Ausführungsverlauf** öffnen und nach Datum oder Status filtern | Gesamter Host |

## Sicherheitsgrenzen

- **Berechtigungen**: Vollständige Einhaltung des `permissionPresets`-Dienstes des Hosts.
- **Agent-Voreinstellungen**: Direkte Auswahl aus den im Host registrierten Agent-Presets.
- **Vollzugriff**: Erfordert Risikobestätigung mit orangefarbenem Warnhinweis analog zum regulären Chat.
- **Unbeaufsichtigte Ausführungen**: Sichere Ausführung ohne hängende interaktive Abfragen.

## Lizenz

Dieses Projekt steht unter der [Apache-Lizenz 2.0](LICENSE). Weitere Hinweise finden Sie in [NOTICE](NOTICE).
