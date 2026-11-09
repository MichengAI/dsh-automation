<p align="center">
  <img src="assets/branding/dsh-banner.png" alt="DSH Automation" width="100%">
</p>

<div align="center">

  # DSH Automation

  **Exécutez des tâches de programmation autonomes selon un calendrier dans DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Journal des modifications](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licence : Apache-2.0](https://img.shields.io/badge/Licence-Apache--2.0-blue.svg)](LICENSE)
  [![Paquet npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-automation.svg?label=paquet%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![Téléchargements npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-automation.svg?label=t%C3%A9l%C3%A9chargements%20npm)](https://www.npmjs.com/package/@michengai/dsh-automation)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-automation)
  [![Node.js 22 ou supérieur](https://img.shields.io/badge/Node.js-22%20ou%20sup%C3%A9rieur-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
</div>

> DSH Automation est un plugin communautaire pour DeepSeek Harness (DSH), et n'est pas un produit officiel de DeepSeek AI.

## Présentation des fonctionnalités

Confiez à DSH les tâches répétitives récurrentes. Configurez des tâches dans les paramètres ou décrivez vos exigences dans une conversation, puis consultez les résultats de chaque exécution.

- **Exécution unique ou récurrente** : intervalles (en minutes), toutes les heures, tous les jours, toutes les semaines, tous les mois ou tous les X jours.
- **Environnement de travail flexible** : configurez le dossier de travail, le modèle, les compétences et les limites d'autorisations.
- **Ajustement du calendrier à tout moment** : créez, suspendez, reprenez, exécutez immédiatement ou supprimez des tâches.
- **Examen des résultats** : parcourez les conversations par nom de tâche et heure d'exécution dans l'onglet **Planifié**, ou filtrez l'historique dans les paramètres.
- **Sessions indépendantes** : chaque exécution démarre dans une nouvelle session avec les instructions enregistrées, sans hériter du contexte de création.
- **Interface en 8 langues** : français, anglais, chinois, japonais, espagnol, allemand, russe et portugais, s'alignant sur la langue globale de DSH (requiert DSH `0.2.2-rc.1` ou supérieur pour les langues autres que chinois/anglais).

## Aperçu de l'interface

Les sessions planifiées apparaissent à la fois dans l'arborescence officielle des **Tâches** et dans l'onglet **Planifié**. Les sessions inactives affichent l'icône d'horloge officielle. L'affichage **Planifié → Historique** regroupe par défaut les éléments par tâche, avec bascule possible par espace de travail, arborescence ou liste plate :

![Barre latérale planifiée](assets/screenshots/workspace-scheduled.png)

Ouvrez **Paramètres → Tâches planifiées** pour rechercher, créer, suspendre et inspecter vos règles :

![Paramètres des tâches planifiées](assets/screenshots/settings-tasks.png)

Décrivez la tâche dans le chat. DSH traitera l'approbation selon le mode d'autorisation sélectionné :

![Création de tâche via le chat](assets/screenshots/chat-create.png)

![Approbation officielle pour automation_create](assets/screenshots/chat-approval.png)

Après validation, la règle est enregistrée et résumée dans la conversation :

![Tâche planifiée créée](assets/screenshots/chat-created.png)

L'historique d'exécution reste disponible dans les paramètres et peut être filtré par jour, semaine, mois, tâche ou statut :

![Historique des exécutions](assets/screenshots/settings-runs.png)

## Écosystème des produits DSH

Pour un environnement de bureau complet, téléchargez [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Pour une installation existante de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), ajoutez les plugins selon vos besoins :

| Plugin | Ce que vous pouvez faire |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organiser les projets et conversations, rechercher des tâches et naviguer dans les échanges |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Sélectionner et invoquer des agents spécialistes adaptés à vos missions |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Gérer, activer, créer et importer vos compétences locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Rechercher, restaurer ou nettoyer les conversations archivées |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envoyer des tâches et recevoir des réponses via des plateformes de messagerie |
| [Automation](https://github.com/MichengAI/dsh-automation) | Planifier des tâches autonomes et examiner chaque rapport d'exécution |
| [BTW](https://github.com/MichengAI/dsh-btw) | Poser des questions contextuelles rapides sans interrompre la tâche principale |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Utiliser `/simplify` pour nettoyer et optimiser le code de vos modifications Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Guider l'agent pour explorer de nouvelles approches en cas d'échec et vérifier avant clôture |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Utiliser `/review` pour demander une revue de code indépendante par un agent |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Consulter les notifications et répondre aux demandes d'outils via un animal de bureau |

## Prérequis

- Compatibilité hôte : gamme complète DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), validée sur `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` et `0.2.2-rc.1`.
- Node.js 22.19+ pour le développement et la compilation locale.
- Une installation fonctionnelle de DeepSeek Harness Web avec la commande `dsh` accessible dans PowerShell.

## Installation

Les commandes d'installation ci-dessous utilisent le registre npm officiel.

### Demander à un agent de l'installer (recommandé)

Envoyez l'instruction suivante à tout agent disposant des droits d'exécution de terminal (remplacez `web` par votre profil) :

```text
Installe le plugin DSH @michengai/dsh-automation dans mon profil web local en exécutant : dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/. Exécute ensuite dsh --profile web --dump-config, confirme que la configuration contient dsh-automation et explique-moi comment recharger DSH pour l'utiliser.
```

### Installation directe depuis npm

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-automation@latest --registry=https://registry.npmjs.org/
dsh --profile web --dump-config
```

Redémarrez DSH Web et actualisez la page du navigateur (Ctrl+F5).

## Configuration et commutateurs du plugin

Accédez à :
> **Barre latérale → Plugins → Détails de `@michengai/dsh-automation`** (emplacement `plugins.bundle.config` de l'hôte).

Deux commutateurs natifs et un sélecteur d'emplacement sont mis à disposition :

### 1. Entrée dans la barre latérale (`sidebarEntry`)
- **Par défaut** : Activé (`true`)
- **Description** : Affiche une icône dédiée **Tâches planifiées** dans la barre d'activité principale.
- **Effet** : Ouvre le panneau central dans une vue aérée de 960px.

### 2. Masquer l'entrée d'automatisation officielle (`hideOfficialSchedule`)
- **Par défaut** : Activé (`true`)
- **Description** : Masque l'entrée « Tâches d'automatisation » (`ui-schedule`) intégrée de l'hôte pour éviter les doublons.

### 3. Afficher les sessions planifiées dans l'arborescence des tâches (`taskTreeSessions`)
- **Par défaut** : Désactivé (`false`)
- **Description** : Détermine si les sessions planifiées apparaissent dans l'arborescence principale des espaces de travail.

### 4. Configuration `cordis.patch.yml`
```yaml
- id: dsh-automation
  name: '@michengai/dsh-automation'
  config:
    stateDir: D:/Data/dsh-automation   # Facultatif : dossier de stockage des configurations
    runTimeoutMinutes: 60              # Facultatif : délai d'expiration en minutes (défaut : 60)
    misfireGraceMinutes: 15            # Facultatif : tolérance pour les lancements manqués (minutes)
    historyLimit: 200                  # Facultatif : nombre d'enregistrements d'historique conservés
    updater: false                     # Facultatif : verrouillage des mises à jour en entreprise
```

## Mise à jour

Le bouton de mise à jour dans les paramètres du plugin a été supprimé. Pour mettre à jour, réinstallez la dernière version dans le même profil avec la commande `dsh plugin … add @latest`, redémarrez DSH et actualisez le navigateur. En entreprise, `updater: false` permet de bloquer les requêtes de mise à jour avec une réponse HTTP 403.

## Utilisation

Ouvrez **Paramètres → Tâches planifiées** :

| Objectif | Action | Portée |
| --- | --- | --- |
| Créer une règle | Cliquez sur **Nouvelle tâche**, puis réglez le nom, le calendrier, le prompt et les autorisations | Tout l'hôte |
| Créer depuis le chat | Décrivez le calendrier dans une conversation ou cliquez sur **Créer dans le chat** | Conversation en cours |
| Suspendre / reprendre | Utilisez le commutateur sur la carte de la tâche | Une seule règle |
| Exécuter maintenant | Ouvrez le menu de la carte et choisissez **Exécuter maintenant** | Une seule règle |
| Supprimer | Ouvrez le menu de la carte et choisissez **Supprimer la tâche** (historique conservé) | Définition uniquement |
| Consulter l'historique | Ouvrez **Historique des exécutions** et filtrez par date ou statut | Tout l'hôte |

## Limites de sécurité

- **Autorisations** : Respect scrupuleux du service `permissionPresets` de l'hôte.
- **Préréglages d'agent** : Sélection parmi les préréglages déclarés par l'hôte.
- **Accès total** : La sélection de `danger-full-access` requiert une confirmation avec avertissement orange identique au Chat.
- **Exécutions sans surveillance** : Fonctionnement sécurisé sans blocage d'approbation interactive.

## Licence

Distribué sous [Licence Apache 2.0](LICENSE). Consultez [NOTICE](NOTICE) pour de plus amples détails.
