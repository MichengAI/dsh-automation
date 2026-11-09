import { zh } from './locales/zh.js';
import { en } from './locales/en.js';
import { ja } from './locales/ja.js';
import { es } from './locales/es.js';
import { fr } from './locales/fr.js';
import { de } from './locales/de.js';
import { ru } from './locales/ru.js';
import { pt } from './locales/pt.js';
/** 本插件独占的界面文案命名空间。 */
export declare const NS = "dsh-automation";
export { zh, en, ja, es, fr, de, ru, pt };
/**
 * 客户端一次注册的全部内置语言词典。
 *
 * 宿主自带 zh / en / ja / es / fr / de / ru / pt 八份语言包，新增或删减语言只改这一处，
 * 避免注册点漏掉某个词典（漏掉时该语言会静默回落到 en）。
 */
export declare const LOCALE_DICTIONARIES: {
    readonly zh: Record<AutomationLocaleKey, string>;
    readonly en: Record<AutomationLocaleKey, string>;
    readonly ja: Record<AutomationLocaleKey, string>;
    readonly es: Record<AutomationLocaleKey, string>;
    readonly fr: Record<AutomationLocaleKey, string>;
    readonly de: Record<AutomationLocaleKey, string>;
    readonly ru: Record<AutomationLocaleKey, string>;
    readonly pt: Record<AutomationLocaleKey, string>;
};
export type AutomationLocaleKey = 'tab' | 'sidebar.tab' | 'sidebar.tabs' | 'sidebar.tasksTab' | 'sidebar.views' | 'sidebar.viewOverview' | 'sidebar.runsTab' | 'sidebar.overviewTab' | 'records.groupReadOnly' | 'records.groupByTask' | 'records.sectionTasks' | 'sidebar.treeUnavailable' | 'sidebar.workspaces' | 'sidebar.search' | 'sidebar.clearSearch' | 'entry.location.title' | 'entry.location.desc' | 'entry.location.both' | 'entry.location.sidebar' | 'entry.location.settings' | 'sidebar.entry.title' | 'sidebar.entry.desc' | 'sidebar.entry.toggle' | 'officialSchedule.entry.title' | 'officialSchedule.entry.desc' | 'officialSchedule.entry.toggle' | 'taskTreeSessions.entry.title' | 'taskTreeSessions.entry.desc' | 'taskTreeSessions.entry.toggle' | 'header.lead' | 'header.githubProject' | 'header.githubFeedback' | 'examples.title' | 'examples.1.title' | 'examples.1.body' | 'examples.1.chip' | 'examples.2.title' | 'examples.2.body' | 'examples.2.chip' | 'examples.3.title' | 'examples.3.body' | 'examples.3.chip' | 'chat.prompt' | 'menu.run' | 'menu.edit' | 'menu.delete' | 'session.taskSettings' | 'history.range.day' | 'history.range.week' | 'history.range.month' | 'history.allTasks' | 'history.allStatus' | 'history.today' | 'history.yesterday' | 'history.date' | 'history.week' | 'history.month' | 'history.nextApprox' | 'time.withinMinute' | 'time.withinHour' | 'time.withinDay' | 'search.placeholder' | 'action.chatCreate' | 'action.create' | 'banner.wake' | 'tabs.mine' | 'tabs.runs' | 'sort.created.asc' | 'sort.created.desc' | 'sort.planned.asc' | 'sort.planned.desc' | 'sort.default.save' | 'sort.default.saved' | 'form.workspace' | 'form.fieldWorkspace' | 'form.fieldModel' | 'form.providerAccount' | 'form.fieldEffort' | 'form.fieldPermission' | 'form.slashHint' | 'form.slashEmpty' | 'form.addWorkspace' | 'form.workspaceRequired' | 'form.workspaceUnavailable' | 'form.addWorkspaceFailed' | 'form.workspacePath' | 'form.workspacePathPlaceholder' | 'form.model' | 'form.modelSelect' | 'form.effort' | 'form.effort.none' | 'form.effort.low' | 'form.effort.medium' | 'form.effort.high' | 'form.error.workspace' | 'modal.title' | 'modal.edit' | 'modal.save' | 'stats.next' | 'stats.noneScheduled' | 'section.refresh' | 'empty.title' | 'empty.body' | 'runs.empty' | 'overview.empty' | 'form.title' | 'form.subtitle' | 'form.name' | 'form.namePlaceholder' | 'form.prompt' | 'form.promptPlaceholder' | 'form.schedule' | 'form.planTime' | 'form.hourly' | 'form.monthly' | 'form.custom' | 'form.intervalHint' | 'form.customHint' | 'form.atTime' | 'form.minutesShort' | 'form.daysShort' | 'form.monthDay' | 'form.skills' | 'form.skillsEmpty' | 'schedule.hourlyAt' | 'schedule.monthlyAt' | 'schedule.customAt' | 'form.once' | 'form.interval' | 'form.daily' | 'form.weekly' | 'form.runAt' | 'form.every' | 'form.minutes' | 'form.time' | 'form.days' | 'form.timeZone' | 'form.maxConcurrentRuns' | 'form.maxConcurrentRunsHint' | 'form.error.maxConcurrentRuns' | 'form.permission' | 'permission.readOnly' | 'permission.workspaceWrite' | 'permission.fullAccess' | 'form.fieldAgentPreset' | 'form.agentPresetUnavailable' | 'form.agentPresetMissing' | 'form.agentPresetRequired' | 'card.agentPreset' | 'presetStandardName' | 'presetStandardDescription' | 'presetPtcName' | 'presetPtcDescription' | 'presetMinimalName' | 'presetMinimalDescription' | 'presetCordisName' | 'presetCordisDescription' | 'form.cancel' | 'form.submit' | 'form.submitting' | 'form.error.name' | 'form.error.prompt' | 'form.error.once' | 'form.error.interval' | 'form.error.weekdays' | 'day.1' | 'day.2' | 'day.3' | 'day.4' | 'day.5' | 'day.6' | 'day.7' | 'status.active' | 'status.paused' | 'status.queued' | 'status.running' | 'status.succeeded' | 'status.failed' | 'status.skipped' | 'status.cancelled' | 'status.interrupted' | 'schedule.onceAt' | 'schedule.everyMinutes' | 'schedule.dailyAt' | 'schedule.weeklyAt' | 'schedule.weekdaySeparator' | 'card.pause' | 'card.resume' | 'card.more' | 'card.confirmDelete' | 'card.confirmDeleteHint' | 'card.confirm' | 'card.cancel' | 'run.trigger.schedule' | 'run.trigger.manual' | 'loading' | 'error.title' | 'error.retry' | 'error.action' | 'error.taskMissing' | 'error.offline' | 'time.minutes' | 'time.hours' | 'time.days' | 'time.months' | 'time.years' | 'time.ago' | 'time.now' | 'time.minuteAgo' | 'time.hourAgo' | 'time.dayAgo' | 'time.inMinute' | 'time.inHour' | 'time.inDay';
