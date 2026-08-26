window.__ModuleLoader__.load({ id: "@michengai/dsh-automation", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react8 = require("react");

// src/client/AutomationView.tsx
var import_react4 = require("react");

// src/client/helpers.ts
var AutomationFormError = class extends Error {
  constructor(key) {
    super(key);
    this.key = key;
  }
};
var SKILL_GESTURE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function skillGestureToken(skill) {
  const raw = SKILL_GESTURE_NAME.test(skill.name) ? skill.name : skill.id;
  return `/${raw}`;
}
function insertSkillGesture(prompt, token, caret) {
  const normalized = token.startsWith("/") ? token : `/${token}`;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(prompt)) {
    return { text: prompt, caret: Math.min(Math.max(caret, 0), prompt.length) };
  }
  const at = Math.min(Math.max(caret, 0), prompt.length);
  const prefix = prompt.slice(0, at);
  const suffix = prompt.slice(at);
  const lead = prefix.length > 0 && !/\s$/.test(prefix) ? " " : "";
  const inserted = `${lead}${normalized} `;
  return { text: prefix + inserted + suffix, caret: prefix.length + inserted.length };
}
function localDateTimeValue(date = /* @__PURE__ */ new Date()) {
  const future = new Date(date.getTime() + 60 * 60 * 1e3);
  future.setMinutes(0, 0, 0);
  const offset = future.getTimezoneOffset() * 6e4;
  return new Date(future.getTime() - offset).toISOString().slice(0, 16);
}
function defaultFormState(now = /* @__PURE__ */ new Date(), workspaces = [], defaultModel, defaultPermission = "") {
  return {
    name: "",
    prompt: "",
    scheduleKind: "daily",
    onceAt: localDateTimeValue(now),
    everyMinutes: "60",
    intervalAnchor: "",
    time: "09:00",
    weekdays: [1, 2, 3, 4, 5],
    hourlyMinute: "00",
    monthDay: "1",
    customDays: "2",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    permission: defaultPermission,
    workspaceId: workspaces[0]?.id ?? "",
    modelKey: defaultModel === void 0 || defaultModel === null ? "default" : `${defaultModel.provider}::${defaultModel.model}`,
    reasoningEffort: defaultModel?.reasoning?.defaultEffort ?? "none",
    skills: []
  };
}
function buildCreateInput(form, workspaces, models, now = /* @__PURE__ */ new Date(), options = {}) {
  const name2 = form.name.trim();
  const prompt = form.prompt.trim();
  if (name2 === "") throw new AutomationFormError("form.error.name");
  if (prompt === "") throw new AutomationFormError("form.error.prompt");
  const workspace = workspaces.find((item) => item.id === form.workspaceId);
  if (workspace === void 0) throw new AutomationFormError("form.error.workspace");
  let schedule;
  switch (form.scheduleKind) {
    case "once": {
      const at = new Date(form.onceAt);
      if (!Number.isFinite(at.getTime()) || options.allowPastOnce !== true && at.getTime() <= now.getTime()) {
        throw new AutomationFormError("form.error.once");
      }
      schedule = { kind: "once", at: at.toISOString(), timeZone: form.timeZone };
      break;
    }
    case "interval": {
      const everyMinutes = Number(form.everyMinutes);
      if (!Number.isInteger(everyMinutes) || everyMinutes < 5 || everyMinutes > 43200) {
        throw new AutomationFormError("form.error.interval");
      }
      schedule = {
        kind: "interval",
        everyMinutes,
        anchor: form.intervalAnchor.trim() || now.toISOString(),
        timeZone: form.timeZone
      };
      break;
    }
    case "daily":
      schedule = { kind: "daily", time: form.time, timeZone: form.timeZone };
      break;
    case "weekly":
      if (form.weekdays.length === 0) throw new AutomationFormError("form.error.weekdays");
      schedule = { kind: "weekly", time: form.time, weekdays: [...form.weekdays].sort((a, b) => a - b), timeZone: form.timeZone };
      break;
    case "hourly": {
      const minute = Number(form.hourlyMinute);
      if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new AutomationFormError("form.error.interval");
      schedule = { kind: "hourly", minute, timeZone: form.timeZone };
      break;
    }
    case "monthly": {
      const day = Number(form.monthDay);
      if (!Number.isInteger(day) || day < 1 || day > 31) throw new AutomationFormError("form.error.interval");
      schedule = { kind: "monthly", day, time: form.time, timeZone: form.timeZone };
      break;
    }
    case "custom": {
      const everyDays = Number(form.customDays);
      if (!Number.isInteger(everyDays) || everyDays < 1) throw new AutomationFormError("form.error.interval");
      schedule = { kind: "custom", everyDays, time: form.time, timeZone: form.timeZone };
      break;
    }
  }
  const selected = models.find((item) => `${item.provider}::${item.model}` === form.modelKey);
  return {
    name: name2,
    prompt,
    schedule,
    timeZone: form.timeZone,
    permission: form.permission,
    workspaceId: workspace.id,
    cwd: workspace.path,
    ...selected === void 0 ? { provider: null, model: null } : { provider: selected.provider, model: selected.model },
    reasoningEffort: form.reasoningEffort === "none" ? null : form.reasoningEffort
  };
}
function formatSchedule(schedule, t) {
  switch (schedule.kind) {
    case "once":
      return t("schedule.onceAt", { time: new Date(schedule.at).toLocaleString() });
    case "interval":
      return t("schedule.everyMinutes", { count: schedule.everyMinutes });
    case "daily":
      return t("schedule.dailyAt", { time: schedule.time });
    case "weekly": {
      const days = schedule.weekdays.map((day) => t(`day.${day}`)).join("\u3001");
      return t("schedule.weeklyAt", { days, time: schedule.time });
    }
    case "hourly":
      return t("schedule.hourlyAt", { minute: String(schedule.minute).padStart(2, "0") });
    case "monthly":
      return t("schedule.monthlyAt", { day: schedule.day, time: schedule.time });
    case "custom":
      return t("schedule.customAt", { count: schedule.everyDays, time: schedule.time });
  }
}
function formatWithin(iso, now, t) {
  const delta = Date.parse(iso) - now.getTime();
  if (!Number.isFinite(delta) || delta <= 0) return t("time.now");
  const minutes = Math.max(1, Math.ceil(delta / 6e4));
  if (minutes < 60) return t("time.withinMinute", { count: minutes });
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return t("time.withinHour", { count: hours });
  return t("time.withinDay", { count: Math.ceil(hours / 24) });
}
function formatDuration(startedAt, finishedAt) {
  if (startedAt === void 0 || finishedAt === void 0) return void 0;
  const seconds = (Date.parse(finishedAt) - Date.parse(startedAt)) / 1e3;
  if (!Number.isFinite(seconds) || seconds < 0) return void 0;
  return `${seconds.toFixed(1)}s`;
}
function clockTime(iso) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return iso;
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
var HISTORY_STATUS_OPTIONS = [
  "succeeded",
  "failed",
  "interrupted",
  "running",
  "queued",
  "skipped",
  "cancelled"
];
function sortStamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function sortAutomations(items, key, direction) {
  const factor = direction === "asc" ? 1 : -1;
  return items.slice().sort((left, right) => {
    if (key === "planned") {
      const leftNext = left.nextRunAt;
      const rightNext = right.nextRunAt;
      if (leftNext === void 0 || rightNext === void 0) {
        if (leftNext === void 0 && rightNext === void 0) {
          return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
        }
        return leftNext === void 0 ? 1 : -1;
      }
      const primary2 = sortStamp(leftNext) - sortStamp(rightNext);
      if (primary2 !== 0) return primary2 * factor;
      return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
    }
    const primary = sortStamp(left.createdAt) - sortStamp(right.createdAt);
    if (primary !== 0) return primary * factor;
    return left.id.localeCompare(right.id);
  });
}
function groupHistory(runs, range, now, t) {
  const buckets = /* @__PURE__ */ new Map();
  for (const run of runs) {
    const at = new Date(run.finishedAt ?? run.startedAt ?? run.scheduledFor);
    if (Number.isNaN(at.getTime())) continue;
    let key;
    if (range === "month") {
      key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
    } else if (range === "week") {
      const start = startOfWeek(at);
      key = localDayKey(start);
    } else {
      key = localDayKey(at);
    }
    const existing = buckets.get(key) ?? [];
    existing.push(run);
    buckets.set(key, existing);
  }
  return [...buckets.entries()].map(([key, items]) => ({
    key,
    label: items[0] === void 0 ? key : range === "month" ? t("history.month", { month: key.replace("-", "/") }) : range === "week" ? t("history.week", { date: key.slice(5).replace("-", "/") }) : key === localDayKey(now) ? t("history.today") : key === localDayKey(new Date(now.getTime() - 864e5)) ? t("history.yesterday") : t("history.date", { date: key.slice(5).replace("-", "/") }),
    items
  }));
}
function localDayKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function startOfWeek(value) {
  const next = new Date(value);
  const day = next.getDay();
  const offset = day === 0 ? 6 : day - 1;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - offset);
  return next;
}
function formFromAutomation(item, workspaces = [], defaultModel, defaultPermission = item.permission) {
  const base = defaultFormState(/* @__PURE__ */ new Date(), workspaces, defaultModel, defaultPermission);
  const schedule = item.schedule;
  const modelKey = item.provider && item.model ? `${item.provider}::${item.model}` : "default";
  const common = {
    ...base,
    name: item.name,
    prompt: item.prompt,
    permission: item.permission,
    workspaceId: item.workspaceId ?? base.workspaceId,
    modelKey,
    reasoningEffort: item.reasoningEffort ?? "none",
    timeZone: item.timeZone || schedule.timeZone || base.timeZone
  };
  switch (schedule.kind) {
    case "once":
      return { ...common, scheduleKind: "once", onceAt: toLocalInput(schedule.at) };
    case "interval":
      return {
        ...common,
        scheduleKind: "interval",
        everyMinutes: String(schedule.everyMinutes),
        intervalAnchor: schedule.anchor ?? ""
      };
    case "hourly":
      return { ...common, scheduleKind: "hourly", hourlyMinute: String(schedule.minute).padStart(2, "0") };
    case "daily":
      return { ...common, scheduleKind: "daily", time: schedule.time };
    case "weekly":
      return { ...common, scheduleKind: "weekly", time: schedule.time, weekdays: [...schedule.weekdays] };
    case "monthly":
      return { ...common, scheduleKind: "monthly", time: schedule.time, monthDay: String(schedule.day) };
    case "custom":
      return { ...common, scheduleKind: "custom", time: schedule.time, customDays: String(schedule.everyDays) };
  }
}
function toLocalInput(iso) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return localDateTimeValue();
  const offset = value.getTimezoneOffset() * 6e4;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

// src/client/icons.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function IconFrame({ children, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props, children });
}
function PlusIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5v14M5 12h14" }) });
}
function RefreshIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(IconFrame, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M19 7v5h-5" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.1 15.5A7.5 7.5 0 1 1 19 12" })
  ] });
}
function PlayIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4.6 3.4 11.7 8l-7.1 4.6V3.4Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "1.6", strokeLinejoin: "round" }) });
}
function TrashIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M14.478 4.841 14.214 10.115c-.104 2.072-.147 2.896-.827 3.846a3.53 3.53 0 0 1-1.044.993c-.519.333-1.101.478-1.784.546-.671.067-1.509.066-2.559.066s-1.887.001-2.558-.066c-.683-.068-1.266-.213-1.784-.546a3.53 3.53 0 0 1-1.044-.993c-.681-.95-.724-1.774-.828-3.846L1.522 4.841l1.368-.068.263 5.273c.109 2.176.171 2.556.573 3.117a2.16 2.16 0 0 0 .673.64c.263.169.603.277 1.179.334.587.059 1.345.06 2.422.06s1.834-.001 2.422-.06c.575-.057.916-.165 1.179-.335.262-.168.49-.386.672-.64.402-.56.464-.94.573-3.116l.263-5.273 1.369.068ZM5.43 6.228h1.37v5.163H5.43V6.228Zm3.77 0h1.37v5.163H9.2V6.228ZM8.536.434c.644 0 1.116-.007 1.56.137.14.045.276.101.406.168.416.212.745.552 1.2 1.007l.796.795h2.876v1.37H.626V2.541h2.876l.796-.795c.456-.455.784-.795 1.2-1.007.13-.067.266-.123.405-.168C6.348.427 6.82.434 7.464.434h1.072Zm-1.072 1.37c-.732 0-.948.008-1.138.07a2.2 2.2 0 0 0-.206.085c-.156.08-.296.204-.678.583h5.117c-.382-.379-.522-.503-.679-.583a2.2 2.2 0 0 0-.205-.085c-.191-.062-.406-.07-1.138-.07H7.464Z" }) });
}
function ShieldIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(IconFrame, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3.8 19 6v5.1c0 4.3-2.6 7.4-7 9.1-4.4-1.7-7-4.8-7-9.1V6l7-2.2Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m9.4 12 1.7 1.7 3.7-4" })
  ] });
}
function MoreIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(IconFrame, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "6", cy: "12", r: "1.2", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "1.2", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "18", cy: "12", r: "1.2", fill: "currentColor" })
  ] });
}
function InfoIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(IconFrame, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8.25" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 10.4V16" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7.6h.01" })
  ] });
}
function ClockIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(IconFrame, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8.25" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7.6v4.6l3 1.8" })
  ] });
}
function ChatIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.5 6.5h13v9.2H9.2L5.5 18.8V6.5Z" }) });
}
function FolderIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 7.2h6.1l1.7 1.8H20V18H4V7.2Z" }) });
}
function SparkleIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3.6 13.3 8.7 18.4 10 13.3 11.3 12 16.4 10.7 11.3 5.6 10 10.7 8.7 12 3.6Z" }) });
}
function FillIcon({ children, width = 16, height = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width, height, fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children });
}
function CloseOutlineIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FillIcon, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M14.1168 13.197L13.197 14.1167L1.8833 2.80303L2.80309 1.88324L14.1168 13.197Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M13.197 1.88326L14.1168 2.80305L2.80309 14.1168L1.8833 13.197L13.197 1.88326Z" })
  ] });
}
function CheckOutlineIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M15.0498 3.92579L8.49512 12.3818C8.25774 12.6881 8.04517 12.9645 7.84668 13.1689C7.63957 13.3823 7.38732 13.5841 7.04492 13.6719C6.86373 13.7183 6.6757 13.7346 6.48926 13.7197C6.13666 13.6915 5.8528 13.5355 5.6123 13.3604C5.38201 13.1926 5.12573 12.9567 4.83984 12.6953L1.03125 9.21289L1.96875 8.1875L5.77734 11.6699C6.08684 11.9529 6.27773 12.1249 6.43066 12.2363C6.50183 12.2882 6.54699 12.3135 6.57324 12.3252C6.58525 12.3305 6.59269 12.3322 6.5957 12.333C6.59802 12.3336 6.59961 12.334 6.59961 12.334C6.63317 12.3367 6.66758 12.3335 6.7002 12.3252C6.7002 12.3252 6.70211 12.3251 6.7041 12.3242C6.70698 12.3229 6.71348 12.319 6.72461 12.3115C6.74849 12.2956 6.78843 12.2642 6.84961 12.2012C6.98138 12.0654 7.13957 11.8628 7.39648 11.5313L13.9502 3.07422L15.0498 3.92579Z" }) });
}
function SearchOutlineIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FillIcon, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M11.894845 6.647401C11.894845 3.725463 9.534486 1.356779 6.623219 1.35657C3.711786 1.35657 1.351635 3.725338 1.351635 6.647401C1.351843 9.569296 3.711911 11.938273 6.623219 11.938273C9.534361 11.938064 11.894637 9.569171 11.894845 6.647401ZM13.245462 6.647401C13.245254 10.317935 10.280401 13.293613 6.623219 13.293821C2.965871 13.293821 0.000204 10.31806 0 6.647401C0 2.976574 2.965746 0 6.623219 0C10.280526 0.000205 13.245462 2.9767 13.245462 6.647401Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M16.000417 15.041079L15.044449 16.000433L11.530434 12.473588L12.486298 11.514234L16.000417 15.041079Z" })
  ] });
}
function SlidersIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M2.2 3.4h6.05a1.85 1.85 0 0 0 3.5 0H13.8v1.3H11.75a1.85 1.85 0 0 0-3.5 0H2.2V3.4Zm8.6 1.15A.75.75 0 1 1 10.05 4.55.75.75 0 0 1 10.8 4.55ZM2.2 7.35h2.35a1.85 1.85 0 0 0 3.5 0H13.8v1.3H8.05a1.85 1.85 0 0 0-3.5 0H2.2V7.35Zm4.1 1.15A.75.75 0 1 1 5.55 8.5a.75.75 0 0 1 .75-.75ZM2.2 11.3h7.35a1.85 1.85 0 0 0 3.5 0H13.8v1.3h-.75a1.85 1.85 0 0 0-3.5 0H2.2v-1.3Zm9.9 1.15a.75.75 0 1 1-.75-.75.75.75 0 0 1 .75.75Z" }) });
}
function FolderClosedIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", transform: "translate(1.5 2.429)", d: "M5.05582 0.518756L4.50669 0.86654L5.05582 0.518756ZM13 9.4837L13.65 9.4837L13.65 3.53962L13 3.53962L12.35 3.53962L12.35 9.4837L13 9.4837ZM11.3264 1.86603L11.3264 1.21603L6.52313 1.21603L6.52313 1.86603L6.52313 2.51603L11.3264 2.51603L11.3264 1.86603ZM5.58054 1.34727L6.12968 0.999489L5.60495 0.170972L5.05582 0.518756L4.50669 0.86654L5.03141 1.69506L5.58054 1.34727ZM4.11323 1.23058e-13L4.11323 -0.65L1.67359 -0.65L1.67359 5.00699e-14L1.67359 0.65L4.11323 0.65L4.11323 1.23058e-13ZM0 1.67359L-0.65 1.67359L-0.65 9.4837L0 9.4837L0.65 9.4837L0.65 1.67359L0 1.67359ZM11.3264 11.1573L11.3264 10.5073L1.67359 10.5073L1.67359 11.1573L1.67359 11.8073L11.3264 11.8073L11.3264 11.1573ZM0 9.4837L-0.65 9.4837C-0.65 10.767 0.390308 11.8073 1.67359 11.8073L1.67359 11.1573L1.67359 10.5073C1.10828 10.5073 0.65 10.049 0.65 9.4837L0 9.4837ZM1.67359 5.00699e-14L1.67359 -0.65C0.390307 -0.65 -0.65 0.390309 -0.65 1.67359L0 1.67359L0.65 1.67359C0.65 1.10828 1.10828 0.65 1.67359 0.65L1.67359 5.00699e-14ZM5.05582 0.518756L5.60495 0.170972C5.28121 -0.340193 4.71829 -0.65 4.11323 -0.65L4.11323 1.23058e-13L4.11323 0.65C4.27282 0.65 4.4213 0.731715 4.50669 0.86654L5.05582 0.518756ZM6.52313 1.86603L6.52313 1.21603C6.36354 1.21603 6.21507 1.13431 6.12968 0.999489L5.58054 1.34727L5.03141 1.69506C5.35515 2.20622 5.91808 2.51603 6.52313 2.51603L6.52313 1.86603ZM13 3.53962L13.65 3.53962C13.65 2.25634 12.6097 1.21603 11.3264 1.21603L11.3264 1.86603L11.3264 2.51603C11.8917 2.51603 12.35 2.97431 12.35 3.53962L13 3.53962ZM13 9.4837L12.35 9.4837C12.35 10.049 11.8917 10.5073 11.3264 10.5073L11.3264 11.1573L11.3264 11.8073C12.6097 11.8073 13.65 10.767 13.65 9.4837L13 9.4837Z" }) });
}
function FolderOpenIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FillIcon, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", opacity: "0.2", d: "M13.6602 7.75525C13.9618 7.7556 14.1815 8.04179 14.1045 8.33337L13.0508 12.3031C12.9304 12.7567 12.5191 13.0725 12.0498 13.0726H2.91701C2.23744 13.0725 1.7417 12.4287 1.91603 11.7719L2.77834 8.52478C2.89898 8.07146 3.31018 7.75532 3.77931 7.75525H13.6602ZM5.1963 2.95154C5.34985 2.95159 5.49377 3.02803 5.57912 3.15564L6.0508 3.86365C6.39205 4.37553 6.96685 4.68385 7.58205 4.68396H12.1699C12.7416 4.68396 13.2049 5.14754 13.2051 5.71912V6.37439H3.77931C3.02267 6.37444 2.33067 6.72671 1.88283 7.29333V3.98669C1.88299 3.4152 2.34649 2.95168 2.91798 2.95154H5.1963Z" })
  ] });
}
function ChevronIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 14 14", width: props.width || 14, height: props.height || 14, fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M4.25 2.828v8.344c0 .49.592.735.939.389l4.172-4.172a.55.55 0 0 0 0-.778L5.189 2.439c-.347-.347-.939-.101-.939.389Z" }) });
}
function EllipsisIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FillIcon, { ...props, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M4.55146 8.00001C4.55146 8.63513 4.03659 9.15001 3.40146 9.15001C2.76634 9.15001 2.25146 8.63513 2.25146 8.00001C2.25146 7.36488 2.76634 6.85001 3.40146 6.85001C4.03659 6.85001 4.55146 7.36488 4.55146 8.00001Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M9.1476 8.00001C9.1476 8.63513 8.63273 9.15001 7.9976 9.15001C7.36248 9.15001 6.8476 8.63513 6.8476 8.00001C6.8476 7.36488 7.36248 6.85001 7.9976 6.85001C8.63273 6.85001 9.1476 7.36488 9.1476 8.00001Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M13.7486 8.00001C13.7486 8.63513 13.2338 9.15001 12.5986 9.15001C11.9635 9.15001 11.4486 8.63513 11.4486 8.00001C11.4486 7.36488 11.9635 6.85001 12.5986 6.85001C13.2338 6.85001 13.7486 7.36488 13.7486 8.00001Z" })
  ] });
}
function PencilIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M9.941 1.349a2.54 2.54 0 0 1 2.473 0c.292.171.555.442.897.784.341.341.612.604.783.896a2.54 2.54 0 0 1 0 2.473c-.171.292-.442.555-.784.896L6.659 13.05c-.378.378-.652.661-.994.86-.341.199-.722.298-1.238.44l-1.183.326c-.469.13-.899.25-1.243.292-.349.043-.821.033-1.19-.336-.369-.369-.379-.841-.336-1.19.042-.344.163-.774.292-1.243l.326-1.183c.143-.516.242-.897.44-1.238.199-.342.482-.615.86-.994l6.652-6.651c.341-.342.604-.613.896-.784Zm1.759 1.222a1.16 1.16 0 0 0-1.045 0c-.095.056-.206.158-.61.562L9.456 3.721l2.265 2.265.589-.588c.404-.403.507-.515.562-.61a1.16 1.16 0 0 0 0-1.045c-.056-.095-.158-.206-.562-.61-.404-.404-.515-.507-.61-.562ZM3.394 9.784c-.429.429-.551.56-.637.706-.085.147-.138.318-.3.903l-.326 1.183c-.129.468-.209.766-.242.978.212-.033.51-.112.979-.241l1.183-.327c.585-.161.756-.214.902-.3.147-.085.277-.208.706-.636l5.062-5.063-2.265-2.265-5.062 5.062Z" }) });
}
function BranchIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillIcon, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", fillRule: "evenodd", clipRule: "evenodd", d: "M13.076 1.372c1.008 0 1.826.819 1.826 1.827s-.818 1.826-1.826 1.826c-.78 0-1.444-.488-1.706-1.175H4.355c.439.415.804.915 1.062 1.485l1.69 3.733a4.83 4.83 0 0 0 4.312 2.97c.29-.626.923-1.061 1.658-1.061 1.008 0 1.826.818 1.826 1.826s-.818 1.826-1.826 1.826c-.823 0-1.519-.545-1.747-1.293a6.34 6.34 0 0 1-5.406-3.731L4.232 5.871A3.83 3.83 0 0 0 1.098 3.85V2.549h10.272c.263-.687.927-1.177 1.706-1.177Zm0 10.904a.525.525 0 1 0 0 1.052.525.525 0 0 0 0-1.052Zm0-9.603a.526.526 0 1 0 0 1.053.526.526 0 0 0 0-1.053Z" }) });
}
function ArchiveIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 20 20", width: props.width || 16, height: props.height || 16, fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", fillRule: "evenodd", clipRule: "evenodd", d: "M15.866 2.06a2.526 2.526 0 0 1 2.525 2.525v.902c0 .54-.172 1.04-.461 1.45l.009.085v5.866c0 .746 0 1.35-.039 1.837-.035.434-.106.825-.262 1.189l-.072.154a3.03 3.03 0 0 1-1.262 1.366l-.236.132c-.408.208-.848.294-1.344.334-.488.04-1.091.04-1.837.04H7.111c-.746 0-1.35 0-1.837-.04-.434-.035-.825-.105-1.189-.261l-.154-.073a3.03 3.03 0 0 1-1.366-1.262l-.132-.235a2.53 2.53 0 0 1-.335-1.344c-.04-.487-.039-1.091-.039-1.837V7.022c0-.029.005-.057.008-.086A2.48 2.48 0 0 1 1.609 5.487v-.902A2.526 2.526 0 0 1 4.134 2.06h11.732Zm.632 5.87a2.48 2.48 0 0 1-.632.083H4.134a2.48 2.48 0 0 1-.634-.083v4.959c0 .77 0 1.304.034 1.72.034.406.095.635.182.806l.076.137c.191.311.465.565.792.731l.141.061c.156.055.361.096.666.121.415.034.95.035 1.72.035h5.775c.77 0 1.305 0 1.72-.035.407-.033.636-.095.807-.182l.138-.077c.311-.191.565-.464.731-.791l.06-.142c.056-.155.097-.36.122-.665.034-.415.034-.95.034-1.72V7.93ZM4.134 3.5a1.086 1.086 0 0 0-1.085 1.085v.902c0 .599.486 1.085 1.085 1.085h11.732c.599 0 1.085-.486 1.085-1.085v-.902A1.086 1.086 0 0 0 15.866 3.5H4.134Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M12.796 12.566v-1.483H7.205v1.483h5.591Z" })
  ] });
}
var RUNNING_CELLS = [
  [0, 0],
  [4, 0],
  [8, 0],
  [8, 4],
  [8, 8],
  [4, 8],
  [0, 8],
  [0, 4]
];
function RunningStateDot() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "dsh-st-run-dot", width: 10, height: 10, viewBox: "0 0 10 10", shapeRendering: "crispEdges", "aria-hidden": "true", children: RUNNING_CELLS.map(([x, y], index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "rect",
    {
      className: "dsh-st-run-dot-cell",
      x,
      y,
      width: "2",
      height: "2",
      style: { animationDelay: `${(index - RUNNING_CELLS.length) * 125}ms` }
    },
    `${x}-${y}`
  )) });
}

// src/client/create-modal.tsx
var import_react2 = require("react");

// src/client/permissions.ts
var BUILT_IN_PERMISSION_LABELS = /* @__PURE__ */ new Map([
  ["read-only", ["permission.readOnly", "Read Only"]],
  ["workspace-write", ["permission.workspaceWrite", "Workspace Write"]],
  ["danger-full-access", ["permission.fullAccess", "Full access"]]
]);
function permissionLabel(option, t) {
  const builtIn = BUILT_IN_PERMISSION_LABELS.get(option.value);
  if (builtIn !== void 0 && (option.name === option.value || option.name === builtIn[1])) {
    return t(builtIn[0]);
  }
  return option.name || option.value;
}

// src/client/create-modal-logic.ts
function shouldConfirmFullAccess(current, next) {
  return current !== next && next === "danger-full-access";
}

// src/client/menu.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime2 = require("react/jsx-runtime");
var MenuHostContext = (0, import_react.createContext)(null);
function useMenuOpen() {
  const [open, setOpen] = (0, import_react.useState)(false);
  const root = (0, import_react.useRef)(null);
  const menu = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const close = (event) => {
      const target = event.target;
      if (root.current !== null && root.current.contains(target)) return;
      if (menu.current !== null && menu.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);
  return { open, setOpen, root, menu };
}
function flyoutStyle(anchor, host, up, end) {
  const box = anchor.getBoundingClientRect();
  const frame = host.getBoundingClientRect();
  const gap = 6;
  return {
    position: "absolute",
    zIndex: 1200,
    top: up === true ? "auto" : `${box.bottom - frame.top + gap}px`,
    bottom: up === true ? `${frame.bottom - box.top + gap}px` : "auto",
    left: end === true ? "auto" : `${box.left - frame.left}px`,
    right: end === true ? `${frame.right - box.right}px` : "auto"
  };
}
function MenuPopup({
  open,
  anchor,
  menuRef,
  up,
  end,
  className,
  ariaLabel,
  children,
  onClick
}) {
  const host = (0, import_react.useContext)(MenuHostContext);
  const [style, setStyle] = (0, import_react.useState)({});
  (0, import_react.useLayoutEffect)(() => {
    if (!open || anchor.current === null || host === null) return;
    const update = () => {
      if (anchor.current !== null) setStyle(flyoutStyle(anchor.current, host, up, end));
    };
    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [open, anchor, host, up, end]);
  if (!open) return null;
  const node = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      ref: menuRef,
      className: `${className}${host !== null ? " is-float" : ""}`,
      role: "menu",
      "aria-label": ariaLabel,
      style: host !== null ? style : void 0,
      onMouseDown: (event) => event.stopPropagation(),
      onClick: (event) => {
        event.stopPropagation();
        onClick?.();
      },
      children
    }
  );
  if (host !== null) return (0, import_react_dom.createPortal)(node, host);
  return node;
}
function MenuHostProvider({
  host,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuHostContext.Provider, { value: host, children });
}
function MenuRow({
  icon,
  label,
  hint,
  active,
  chevron,
  kv,
  onClick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: `dsh-st-menu-row${active === true ? " is-on" : ""}${kv === true ? " is-kv" : ""}`, onClick, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsh-st-menu-row-main", children: [
      icon,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: label })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsh-st-menu-row-side", children: [
      hint,
      active === true && chevron !== true && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "dsh-st-tick" }),
      chevron === true && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", { className: "dsh-st-next" })
    ] })
  ] });
}
function MenuSelect({
  value,
  options,
  onChange,
  wide,
  pill,
  up,
  icon
}) {
  const menu = useMenuOpen();
  const current = options.find((item) => item.value === value)?.label ?? value;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `dsh-st-select${wide === true ? " is-wide" : ""}${pill === true ? " is-pill" : ""}${menu.open ? " is-open" : ""}`, ref: menu.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        className: "dsh-st-select-btn",
        onMouseDown: (event) => event.stopPropagation(),
        onClick: () => menu.setOpen((value2) => !value2),
        children: [
          icon,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: current }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", {})
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      MenuPopup,
      {
        open: menu.open,
        anchor: menu.root,
        menuRef: menu.menu,
        up,
        end: up,
        className: `dsh-st-select-menu${pill === true ? " is-composer" : ""}${up === true ? " is-up" : ""}${up === true ? " is-end" : ""}`,
        children: options.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          MenuRow,
          {
            icon: item.icon,
            label: item.label,
            active: item.value === value,
            onClick: () => {
              onChange(item.value);
              menu.setOpen(false);
            }
          },
          item.value
        ))
      }
    )
  ] });
}
function MenuPanel({
  label,
  children,
  ghost,
  up,
  persist
}) {
  const menu = useMenuOpen();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `dsh-st-select${ghost === true ? " is-pill" : ""}${menu.open ? " is-open" : ""}`, ref: menu.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "button",
      {
        type: "button",
        className: "dsh-st-chip-btn",
        onMouseDown: (event) => event.stopPropagation(),
        onClick: () => menu.setOpen((value) => !value),
        children: [
          label,
          ghost === true && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", {})
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      MenuPopup,
      {
        open: menu.open,
        anchor: menu.root,
        menuRef: menu.menu,
        up,
        className: `dsh-st-select-menu is-composer${up === true ? " is-up" : ""}`,
        onClick: () => {
          if (persist !== true) menu.setOpen(false);
        },
        children
      }
    )
  ] });
}
function useMenuState() {
  return useMenuOpen();
}

// src/client/create-modal.tsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime3 = require("react/jsx-runtime");
var WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
var KINDS = ["once", "interval", "hourly", "daily", "weekly", "monthly", "custom"];
var HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
var MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
function CreateModal({
  t,
  permissionT,
  modelT,
  busy,
  workspaces,
  models,
  modelFailures,
  defaultModel,
  skills,
  permissions,
  defaultPermission,
  draft,
  editing,
  onClose,
  onSubmit
}) {
  const [form, setForm] = (0, import_react2.useState)(() => ({ ...defaultFormState(/* @__PURE__ */ new Date(), workspaces, defaultModel, defaultPermission), ...draft }));
  const [validationError, setValidationError] = (0, import_react2.useState)();
  const [confirmingPermission, setConfirmingPermission] = (0, import_react2.useState)();
  const [fullAccessAcknowledged, setFullAccessAcknowledged] = (0, import_react2.useState)(false);
  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setValidationError(void 0);
  };
  const choosePermission = (permission) => {
    if (shouldConfirmFullAccess(form.permission, permission)) {
      setFullAccessAcknowledged(false);
      setConfirmingPermission(permission);
      return;
    }
    update({ permission });
  };
  const cancelFullAccessConfirmation = () => {
    setFullAccessAcknowledged(false);
    setConfirmingPermission(void 0);
  };
  const confirmFullAccess = () => {
    if (!fullAccessAcknowledged || confirmingPermission === void 0) return;
    update({ permission: confirmingPermission });
    cancelFullAccessConfirmation();
  };
  (0, import_react2.useEffect)(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      if (document.querySelector(".dsh-st-model-select-menu") !== null) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await onSubmit(form);
    } catch (caught) {
      if (caught instanceof AutomationFormError) {
        setValidationError(t(caught.key));
        return;
      }
      setValidationError(caught instanceof Error ? caught.message : t("error.action"));
    }
  };
  const datePart = form.onceAt.slice(0, 10);
  const timePart = form.onceAt.slice(11, 16) || "09:00";
  const today = localDateValue(/* @__PURE__ */ new Date());
  const minOnceTime = datePart === today ? localTimeValue(/* @__PURE__ */ new Date()) : void 0;
  const [menuHost, setMenuHost] = (0, import_react2.useState)(null);
  const workspace = workspaces.find((item) => item.id === form.workspaceId);
  const promptRef = (0, import_react2.useRef)(null);
  const caretRef = (0, import_react2.useRef)(0);
  const rememberCaret = () => {
    const el = promptRef.current;
    if (el !== null) caretRef.current = el.selectionStart;
  };
  const insertSkill = (skill) => {
    const next = insertSkillGesture(form.prompt, skillGestureToken(skill), caretRef.current);
    update({ prompt: next.text });
    queueMicrotask(() => {
      const el = promptRef.current;
      if (el === null) return;
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
      caretRef.current = next.caret;
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-mask", role: "presentation", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MenuHostProvider, { host: menuHost, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("form", { className: "dsh-st-modal", onClick: (event) => event.stopPropagation(), onSubmit: handleSubmit, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-modal-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: editing === true ? t("modal.edit") : t("modal.title") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: t("form.subtitle") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dsh-st-icon", onClick: onClose, "aria-label": t("form.cancel"), children: "\xD7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dsh-st-field", children: [
        t("form.name"),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { value: form.name, placeholder: t("form.namePlaceholder"), onChange: (event) => update({ name: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-field", children: [
        t("form.planTime"),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-inline", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            MenuSelect,
            {
              value: form.scheduleKind,
              options: KINDS.map((kind) => ({ value: kind, label: t(`form.${kind}`) })),
              onChange: (value) => update({ scheduleKind: value })
            }
          ),
          form.scheduleKind === "once" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "date", min: today, value: datePart, onChange: (event) => update({ onceAt: clampOnceAt(`${event.target.value}T${timePart}`) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TimeSelect, { value: timePart, ...minOnceTime === void 0 ? {} : { minTime: minOnceTime }, onChange: (value) => update({ onceAt: clampOnceAt(`${datePart}T${value}`) }) })
          ] }),
          form.scheduleKind === "interval" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "is-narrow", type: "number", min: 5, value: form.everyMinutes, onChange: (event) => update({ everyMinutes: event.target.value }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.minutesShort") })
          ] }),
          form.scheduleKind === "hourly" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuSelect, { value: form.hourlyMinute, options: MINUTES.map((item) => ({ value: item, label: item })), onChange: (value) => update({ hourlyMinute: value }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.minutesShort") })
          ] }),
          (form.scheduleKind === "daily" || form.scheduleKind === "weekly") && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TimeSelect, { value: form.time, onChange: (value) => update({ time: value }) }),
          form.scheduleKind === "monthly" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              MenuSelect,
              {
                value: form.monthDay,
                options: Array.from({ length: 31 }, (_, index) => {
                  const day = String(index + 1);
                  return { value: day, label: t("form.monthDay", { day }) };
                }),
                onChange: (value) => update({ monthDay: value })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TimeSelect, { value: form.time, onChange: (value) => update({ time: value }) })
          ] }),
          form.scheduleKind === "custom" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "is-narrow", type: "number", min: 1, value: form.customDays, onChange: (event) => update({ customDays: event.target.value }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.daysShort") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(TimeSelect, { value: form.time, onChange: (value) => update({ time: value }) })
          ] })
        ] })
      ] }),
      form.scheduleKind === "weekly" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-weekdays", children: WEEKDAYS.map((day) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: form.weekdays.includes(day) ? "is-on" : "",
          onClick: () => update({
            weekdays: form.weekdays.includes(day) ? form.weekdays.filter((value) => value !== day) : [...form.weekdays, day]
          }),
          children: t(`day.${day}`)
        },
        day
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t("form.prompt") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-prompt-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("textarea", { ref: promptRef, value: form.prompt, placeholder: t("form.promptPlaceholder"), onChange: (event) => {
            rememberCaret();
            update({ prompt: event.target.value });
          }, onSelect: rememberCaret, onClick: rememberCaret, onKeyUp: rememberCaret }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-composer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-composer-left", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MenuPanel, { ghost: true, up: true, label: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { width: 14, height: 14 }),
                workspace?.title || t("form.workspace")
              ] }), children: [
                workspaces.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-select-empty", children: t("form.error.workspace") }),
                workspaces.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  MenuRow,
                  {
                    icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FolderIcon, { width: 14, height: 14 }),
                    label: item.title,
                    active: item.id === form.workspaceId,
                    onClick: () => update({ workspaceId: item.id })
                  },
                  item.id
                ))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MenuPanel, { ghost: true, up: true, label: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SparkleIcon, { width: 14, height: 14 }),
                t("form.skills")
              ] }), children: [
                skills.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-select-empty", children: t("form.skillsEmpty") }),
                skills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  MenuRow,
                  {
                    icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SparkleIcon, { width: 14, height: 14 }),
                    label: item.name,
                    onClick: () => insertSkill(item)
                  },
                  item.id
                ))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                MenuSelect,
                {
                  pill: true,
                  up: true,
                  icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShieldIcon, { width: 14, height: 14 }),
                  value: form.permission,
                  options: permissions.map((option) => ({
                    value: option.value,
                    label: permissionLabel(option, t),
                    icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShieldIcon, { width: 14, height: 14 })
                  })),
                  onChange: choosePermission
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-composer-right", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              ModelPicker,
              {
                modelT,
                models,
                failures: modelFailures,
                modelKey: form.modelKey,
                reasoningEffort: form.reasoningEffort,
                onSelection: (modelKey, reasoningEffort) => update({ modelKey, reasoningEffort })
              }
            ) })
          ] })
        ] })
      ] }),
      validationError !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dsh-st-error", children: validationError }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-modal-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dsh-st-btn", onClick: onClose, disabled: busy, children: t("form.cancel") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "submit", className: "dsh-st-btn dsh-st-btn--primary", disabled: busy, children: t("modal.save") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-flyout-root", ref: setMenuHost }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      import_dsh_client_ui_primitives.RiskConfirmation,
      {
        open: confirmingPermission !== void 0,
        title: permissionT("confirm.title"),
        description: permissionT("confirm.description"),
        acknowledgeLabel: permissionT("confirm.acknowledge"),
        cancelLabel: permissionT("confirm.cancel"),
        confirmLabel: permissionT("confirm.enable"),
        acknowledged: fullAccessAcknowledged,
        onAcknowledgedChange: setFullAccessAcknowledged,
        onCancel: cancelFullAccessConfirmation,
        onConfirm: confirmFullAccess
      }
    )
  ] }) });
}
function ModelPicker({
  modelT,
  models,
  failures,
  modelKey,
  reasoningEffort,
  onSelection
}) {
  const menu = useMenuState();
  const [pane, setPane] = (0, import_react2.useState)("root");
  const selected = models.find((item) => `${item.provider}::${item.model}` === modelKey);
  const reasoning = selected?.reasoning;
  const effectiveEffort = reasoningEffort === "none" ? reasoning?.defaultEffort : reasoningEffort;
  const effortLabel = reasoning === void 0 ? void 0 : effectiveEffort === void 0 ? modelT("effort.providerDefault") : reasoning.efforts.find((item) => item.id === effectiveEffort)?.name ?? effectiveEffort;
  const trigger = selected?.label ?? modelT("trigger.fallback");
  const modelGroups = Array.from(models.reduce((groups, item) => {
    const group = groups.get(item.provider) ?? { label: item.providerLabel, models: [] };
    group.models.push(item);
    groups.set(item.provider, group);
    return groups;
  }, /* @__PURE__ */ new Map()));
  (0, import_react2.useEffect)(() => {
    if (!menu.open) return;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (pane !== "root") setPane("root");
      else menu.setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [menu.open, menu.setOpen, pane]);
  const selectModel = (item) => {
    onSelection(
      `${item.provider}::${item.model}`,
      item.reasoning?.defaultEffort ?? "none"
    );
    menu.setOpen(false);
    setPane("root");
  };
  const selectEffort = (effort) => {
    onSelection(modelKey, effort);
    menu.setOpen(false);
    setPane("root");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `dsh-st-model-select${menu.open ? " is-open" : ""}`, ref: menu.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "button",
      {
        type: "button",
        className: "dsh-st-model-select-trigger",
        "aria-label": selected === void 0 ? modelT("trigger.selectAria") : effortLabel === void 0 ? modelT("trigger.aria", { model: selected.label }) : modelT("trigger.ariaEffort", { model: selected.label, effort: effortLabel }),
        onMouseDown: (event) => event.stopPropagation(),
        onClick: () => {
          if (menu.open) {
            menu.setOpen(false);
            return;
          }
          setPane("root");
          menu.setOpen(true);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: trigger }),
          effortLabel !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-trigger-effort", children: effortLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: `dsh-st-model-trigger-chevron${menu.open ? " is-open" : ""}` })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MenuPopup, { open: menu.open, anchor: menu.root, menuRef: menu.menu, up: true, end: true, className: "dsh-st-model-select-menu is-up is-end", ariaLabel: modelT("menu.aria"), children: [
      pane === "root" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          MenuRow,
          {
            kv: true,
            label: modelT("menu.model"),
            hint: selected?.label ?? modelT("trigger.fallback"),
            chevron: true,
            onClick: () => setPane("model")
          }
        ),
        reasoning !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          MenuRow,
          {
            kv: true,
            label: modelT("menu.effort"),
            hint: effortLabel ?? modelT("effort.providerDefault"),
            chevron: true,
            onClick: () => setPane("effort")
          }
        )
      ] }),
      pane === "model" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        failures.map((failure) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-model-warning", children: modelT("warning.groupLoad", { name: failure.providerLabel, message: failure.message }) }, failure.provider)),
        modelGroups.map(([provider, group]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { role: "group", "aria-label": group.label, className: "dsh-st-model-group", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-model-group-title", children: group.label }),
          group.models.map((item) => {
            const value = `${item.provider}::${item.model}`;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "button",
              {
                type: "button",
                role: "menuitemradio",
                "aria-checked": value === modelKey,
                className: "dsh-st-model-option",
                title: item.label,
                onClick: () => selectModel(item),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dsh-st-model-option-copy", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-name", children: item.label }),
                    item.description !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-description", children: item.description })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-check", children: value === modelKey && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives.IconCheckOutline16, {}) })
                ]
              },
              value
            );
          })
        ] }, provider)),
        modelGroups.length === 0 && failures.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-model-empty", children: modelT("empty.models") })
      ] }),
      pane === "effort" && reasoning !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        reasoning.defaultEffort === void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            role: "menuitemradio",
            "aria-checked": reasoningEffort === "none",
            className: "dsh-st-model-option",
            onClick: () => selectEffort("none"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-option-copy", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-name", children: modelT("effort.providerDefault") }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-check", children: reasoningEffort === "none" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives.IconCheckOutline16, {}) })
            ]
          }
        ),
        reasoning.efforts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            role: "menuitemradio",
            "aria-checked": effectiveEffort === item.id,
            className: "dsh-st-model-option",
            onClick: () => selectEffort(item.id),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dsh-st-model-option-copy", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-name", children: item.name }),
                item.description !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-description", children: item.description })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-model-check", children: effectiveEffort === item.id && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives.IconCheckOutline16, {}) })
            ]
          },
          item.id
        )),
        reasoning.efforts.length === 0 && reasoning.defaultEffort !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-model-empty", children: modelT("empty.efforts") })
      ] })
    ] })
  ] });
}
function TimeSelect({
  value,
  onChange,
  minTime
}) {
  const hour = value.slice(0, 2) || "09";
  const minute = value.slice(3, 5) || "00";
  const minHour = minTime?.slice(0, 2);
  const minMinute = minTime?.slice(3, 5);
  const hours = HOURS.filter((item) => minHour === void 0 || item >= minHour);
  const minutes = MINUTES.filter((item) => minHour === void 0 || hour > minHour || minMinute === void 0 || item >= minMinute);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-time", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuSelect, { value: hour, options: hours.map((item) => ({ value: item, label: item })), onChange: (next) => onChange(`${next}:${minute}`) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-time-sep", children: ":" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuSelect, { value: minute, options: minutes.map((item) => ({ value: item, label: item })), onChange: (next) => onChange(`${hour}:${next}`) })
  ] });
}
function localDateValue(now) {
  const offset = now.getTimezoneOffset() * 6e4;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
function localTimeValue(now) {
  const offset = now.getTimezoneOffset() * 6e4;
  return new Date(now.getTime() - offset).toISOString().slice(11, 16);
}
function clampOnceAt(value) {
  const selected = new Date(value);
  const now = /* @__PURE__ */ new Date();
  if (!Number.isFinite(selected.getTime()) || selected.getTime() > now.getTime()) return value;
  const next = new Date(now.getTime() + 6e4);
  next.setSeconds(0, 0);
  const offset = next.getTimezoneOffset() * 6e4;
  return new Date(next.getTime() - offset).toISOString().slice(0, 16);
}

// src/client/delete-confirmation.tsx
var import_react3 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function DeleteConfirmation({
  target,
  t,
  busy,
  onCancel,
  onConfirm
}) {
  (0, import_react3.useEffect)(() => {
    if (target === void 0 || busy) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel, target]);
  if (target === void 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-mask", onMouseDown: (event) => event.stopPropagation(), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "section",
    {
      className: "dsh-st-confirm-modal",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-labelledby": "dsh-st-confirm-delete-title",
      "aria-describedby": "dsh-st-confirm-delete-description",
      onMouseDown: (event) => event.stopPropagation(),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { id: "dsh-st-confirm-delete-title", children: t("card.confirmDelete") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsh-st-confirm-target", children: target.name }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { id: "dsh-st-confirm-delete-description", children: t("card.confirmDeleteHint") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-modal-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-st-btn", autoFocus: true, disabled: busy, onClick: onCancel, children: t("card.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-st-btn dsh-st-btn--danger", disabled: busy, onClick: onConfirm, children: t("card.confirm") })
        ] })
      ]
    }
  ) });
}

// src/client/prefill.ts
var pending = null;
var listeners = /* @__PURE__ */ new Set();
function setChatPrefill(text) {
  pending = text;
  for (const listener of [...listeners]) listener(pending);
}
function takeChatPrefill() {
  const value = pending;
  pending = null;
  return value;
}
function peekChatPrefill() {
  return pending;
}
function subscribeChatPrefill(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function applyPrefillToDom(text) {
  const seat = document.querySelector("[data-composer-seat] textarea");
  if (!(seat instanceof HTMLTextAreaElement)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  descriptor?.set?.call(seat, text);
  seat.dispatchEvent(new InputEvent("input", { bubbles: true }));
  seat.focus();
  return true;
}

// src/client/protocol.ts
function unwrapRpcResult(value) {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    throw new Error("\u81EA\u52A8\u5316\u4E3B\u673A\u8FD4\u56DE\u4E86\u65E0\u6548\u54CD\u5E94\u3002");
  }
  const result = value;
  if (result.ok === true && "value" in result) return result.value;
  if (result.ok === false && "error" in result) {
    const error = result.error;
    throw new Error(error?.message ?? "\u81EA\u52A8\u5316\u8BF7\u6C42\u5931\u8D25\u3002");
  }
  throw new Error("\u81EA\u52A8\u5316\u4E3B\u673A\u8FD4\u56DE\u4E86\u65E0\u6548\u54CD\u5E94\u3002");
}

// src/client/runtime.ts
var CHANNEL = "/dsh-automation";
var POLL_INTERVAL_MS = 15e3;
function isTransportError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}
function createAutomationRuntime(rpc) {
  let state = { phase: "idle" };
  let refreshPromise;
  let pollTimer;
  const listeners2 = /* @__PURE__ */ new Set();
  const publish = (next) => {
    state = next;
    for (const listener of [...listeners2]) listener();
  };
  const source = {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners2.add(listener);
      if (listeners2.size === 1) {
        queueMicrotask(() => {
          if (listeners2.size > 0) void refresh().catch(() => void 0);
        });
        pollTimer = setInterval(() => {
          void refresh().catch(() => void 0);
        }, POLL_INTERVAL_MS);
      }
      return () => {
        listeners2.delete(listener);
        if (listeners2.size === 0 && pollTimer !== void 0) {
          clearInterval(pollTimer);
          pollTimer = void 0;
        }
      };
    }
  };
  const refresh = async () => {
    if (refreshPromise !== void 0) return refreshPromise;
    const previous = state.snapshot;
    publish(previous === void 0 ? { phase: "loading" } : {
      phase: "loading",
      snapshot: previous,
      ...state.refreshedAt === void 0 ? {} : { refreshedAt: state.refreshedAt }
    });
    refreshPromise = (async () => {
      try {
        const response = await rpc.call(CHANNEL, "snapshot", { sessionId: "settings" });
        const snapshot = unwrapRpcResult(response);
        publish({ phase: "ready", snapshot, refreshedAt: Date.now() });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        publish(previous === void 0 ? { phase: "error", error: message } : {
          phase: "error",
          snapshot: previous,
          error: message,
          ...state.refreshedAt === void 0 ? {} : { refreshedAt: state.refreshedAt }
        });
        throw error;
      } finally {
        refreshPromise = void 0;
      }
    })();
    return refreshPromise;
  };
  const callRpc = async (endpoint, payload) => {
    try {
      return await rpc.call(CHANNEL, endpoint, payload);
    } catch (error) {
      if (!isTransportError(error)) throw error;
      return await rpc.call(CHANNEL, endpoint, payload);
    }
  };
  const mutateThenRefresh = async (endpoint, payload, patch) => {
    unwrapRpcResult(await callRpc(endpoint, payload));
    if (patch !== void 0 && state.snapshot !== void 0) {
      publish({ phase: "ready", snapshot: patch(state.snapshot), refreshedAt: Date.now() });
    }
    const pendingBeforeRefresh = refreshPromise;
    if (pendingBeforeRefresh !== void 0) await pendingBeforeRefresh.catch(() => void 0);
    try {
      await refresh();
    } catch {
    }
  };
  return {
    source,
    refresh,
    async createAutomation(input) {
      const payload = { sessionId: "settings", input };
      await mutateThenRefresh("create", payload);
    },
    async mutateAutomation(automationId, mutation) {
      const payload = { sessionId: "settings", automationId, mutation };
      await mutateThenRefresh("mutate", payload, mutation === "delete" ? (snapshot) => ({
        ...snapshot,
        automations: snapshot.automations.filter((item) => item.id !== automationId)
      }) : void 0);
    },
    async updateAutomation(automationId, input) {
      const payload = { sessionId: "settings", automationId, input };
      await mutateThenRefresh("update", payload);
    },
    async runNow(automationId) {
      const payload = { sessionId: "settings", automationId };
      await mutateThenRefresh("run-now", payload);
    },
    async markRunRead(runId) {
      const payload = { sessionId: "settings", runId };
      await mutateThenRefresh("mark-read", payload);
    },
    async adoptSession(sessionId) {
      unwrapRpcResult(await rpc.call(CHANNEL, "adopt-session", { sessionId }));
    },
    async forgetSession(sessionId) {
      await mutateThenRefresh("forget-session", { sessionId }, (snapshot) => ({
        ...snapshot,
        runs: snapshot.runs.map((run) => {
          if (run.sessionId !== sessionId) return run;
          const { sessionId: _ignored, ...rest } = run;
          return rest;
        })
      }));
    },
    async forgetAutomationSessions(automationId) {
      await mutateThenRefresh("forget-automation-sessions", { automationId }, (snapshot) => ({
        ...snapshot,
        runs: snapshot.runs.map((run) => {
          if (run.automationId !== automationId) return run;
          const { sessionId: _ignored, ...rest } = run;
          return rest;
        })
      }));
    }
  };
}

// src/client/AutomationView.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var EXAMPLES = [
  { name: "\u6BCF\u65E5\u56DE\u5F52\u68C0\u67E5", scheduleKind: "daily", time: "09:00", weekdays: [1, 2, 3, 4, 5] },
  { name: "\u6BCF\u5468\u4F9D\u8D56\u5DE1\u68C0", scheduleKind: "weekly", time: "10:00", weekdays: [1] },
  { name: "\u5DE5\u4F5C\u65E5\u65E9\u62A5", scheduleKind: "weekly", time: "08:00", weekdays: [1, 2, 3, 4, 5] }
];
function AutomationView({ t, permissionT, modelT, runtime, closeSettings }) {
  const state = (0, import_react4.useSyncExternalStore)(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot);
  const [tab, setTab] = (0, import_react4.useState)("mine");
  const [query, setQuery] = (0, import_react4.useState)("");
  const [creating, setCreating] = (0, import_react4.useState)(false);
  const [editingId, setEditingId] = (0, import_react4.useState)();
  const [deleteTarget, setDeleteTarget] = (0, import_react4.useState)();
  const [draft, setDraft] = (0, import_react4.useState)();
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)();
  const [historyRange, setHistoryRange] = (0, import_react4.useState)("day");
  const [historyTask, setHistoryTask] = (0, import_react4.useState)("all");
  const [historyStatus, setHistoryStatus] = (0, import_react4.useState)("all");
  const [sortKey, setSortKey] = (0, import_react4.useState)("created");
  const [sortDirection, setSortDirection] = (0, import_react4.useState)("desc");
  const now = (0, import_react4.useMemo)(() => new Date(state.snapshot?.serverNow ?? Date.now()), [state.snapshot?.serverNow, state.refreshedAt]);
  const snapshot = state.snapshot;
  const workspaces = snapshot?.workspaces ?? [];
  const models = snapshot?.models ?? [];
  const permissions = snapshot?.permissions ?? [];
  const defaultPermission = snapshot?.defaultPermission ?? "";
  const automations = sortAutomations(
    (snapshot?.automations ?? []).filter((item) => query.trim() === "" || `${item.name} ${item.prompt}`.toLowerCase().includes(query.trim().toLowerCase())),
    sortKey,
    sortDirection
  );
  const runs = (snapshot?.runs ?? []).filter((run) => {
    if (historyTask !== "all" && run.automationId !== historyTask) return false;
    if (historyStatus !== "all" && run.status !== historyStatus) return false;
    return true;
  });
  const groups = groupHistory(runs, historyRange, now, t);
  const runAction = async (action) => {
    setBusy(true);
    setError(void 0);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof AutomationFormError ? t(caught.key) : isTransportError(caught) ? t("error.offline") : caught instanceof Error ? caught.message : t("error.action"));
    } finally {
      setBusy(false);
    }
  };
  const closeModal = () => {
    setCreating(false);
    setDraft(void 0);
    setEditingId(void 0);
  };
  const openCreate = (partial) => {
    if (defaultPermission === "" || permissions.length === 0) return;
    setEditingId(void 0);
    setDraft(partial);
    setCreating(true);
  };
  const openEdit = (item) => {
    setEditingId(item.id);
    setDraft(formFromAutomation(item, workspaces, snapshot?.defaultModel ?? null, snapshot?.defaultPermission ?? item.permission));
    setCreating(true);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "dsh-st-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h1", { children: t("tab") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("header.lead") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { className: "dsh-st-search", value: query, placeholder: t("search.placeholder"), onChange: (event) => setQuery(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "dsh-st-btn", onClick: () => {
          setChatPrefill(t("chat.prompt"));
          closeSettings?.();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChatIcon, {}),
          t("action.chatCreate")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "dsh-st-btn dsh-st-btn--primary", disabled: defaultPermission === "" || permissions.length === 0, onClick: () => openCreate(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PlusIcon, {}),
          t("action.create")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-st-icon", onClick: () => {
          void runtime.refresh();
        }, "aria-label": t("section.refresh"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RefreshIcon, {}) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-banner", role: "note", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(InfoIcon, {}),
      t("banner.wake")
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "dsh-st-examples", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-examples-head", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { children: t("examples.title") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-example-row", children: EXAMPLES.map((example, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "button",
        {
          type: "button",
          className: "dsh-st-example",
          disabled: defaultPermission === "" || permissions.length === 0,
          onClick: () => openCreate({
            name: t(`examples.${index + 1}.title`),
            prompt: t(`examples.${index + 1}.body`),
            scheduleKind: example.scheduleKind,
            time: example.time,
            weekdays: example.weekdays
          }),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: t(`examples.${index + 1}.title`) }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t(`examples.${index + 1}.body`) }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsh-st-chip", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ClockIcon, {}),
              t(`examples.${index + 1}.chip`)
            ] })
          ]
        },
        example.name
      )) })
    ] }),
    error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "dsh-st-error", children: error }),
    (state.phase === "idle" || state.phase === "loading" && snapshot === void 0) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "dsh-st-muted", children: t("loading") }),
    state.phase === "error" && snapshot === void 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("error.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: state.error }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-st-btn dsh-st-btn--primary", onClick: () => {
        void runtime.refresh();
      }, children: t("error.retry") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-tabs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: tab === "mine" ? "is-on" : "", onClick: () => setTab("mine"), children: t("tabs.mine") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: tab === "runs" ? "is-on" : "", onClick: () => setTab("runs"), children: t("tabs.runs") }),
      tab === "mine" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        SortMenu,
        {
          t,
          sortKey,
          sortDirection,
          onSelect: (key, direction) => {
            setSortKey(key);
            setSortDirection(direction);
          }
        }
      ),
      tab === "runs" && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-filters", children: [
        ["day", "week", "month"].map((range) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: historyRange === range ? "is-on" : "", onClick: () => setHistoryRange(range), children: t(`history.range.${range}`) }, range)),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          DropdownMenu,
          {
            ariaLabel: t("history.allTasks"),
            options: [
              { key: "all", label: t("history.allTasks"), selected: historyTask === "all", onSelect: () => setHistoryTask("all") },
              ...(snapshot?.automations ?? []).map((item) => ({
                key: item.id,
                label: item.name,
                selected: historyTask === item.id,
                onSelect: () => setHistoryTask(item.id)
              }))
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          DropdownMenu,
          {
            ariaLabel: t("history.allStatus"),
            options: [
              { key: "all", label: t("history.allStatus"), selected: historyStatus === "all", onSelect: () => setHistoryStatus("all") },
              ...HISTORY_STATUS_OPTIONS.map((status) => ({
                key: status,
                label: t(`status.${status}`),
                selected: historyStatus === status,
                onSelect: () => setHistoryStatus(status)
              }))
            ]
          }
        )
      ] })
    ] }),
    tab === "mine" && (automations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("empty.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: t("empty.body") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-grid", children: automations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      TaskCard,
      {
        item,
        t,
        now,
        busy,
        onEdit: () => openEdit(item),
        onToggle: () => {
          void runAction(() => runtime.mutateAutomation(item.id, item.status === "active" ? "pause" : "resume"));
        },
        onRun: () => {
          void runAction(() => runtime.runNow(item.id));
        },
        onDelete: () => setDeleteTarget(item)
      },
      item.id
    )) })),
    tab === "runs" && (groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-empty", children: t("runs.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-timeline", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "dsh-st-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: group.label }),
      group.items.map((run) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RunRow, { run, t }, run.id))
    ] }, group.key)) })),
    creating && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      CreateModal,
      {
        t,
        permissionT,
        modelT,
        busy,
        workspaces,
        models,
        modelFailures: snapshot?.modelFailures ?? [],
        defaultModel: snapshot?.defaultModel ?? null,
        skills: snapshot?.skills ?? [],
        permissions,
        defaultPermission,
        editing: editingId !== void 0,
        ...draft === void 0 ? {} : { draft },
        onClose: closeModal,
        onSubmit: async (form) => {
          const input = buildCreateInput(form, workspaces, models, /* @__PURE__ */ new Date(), {
            allowPastOnce: editingId !== void 0
          });
          await runAction(async () => {
            if (editingId === void 0) await runtime.createAutomation(input);
            else await runtime.updateAutomation(editingId, input);
            closeModal();
          });
        }
      },
      editingId ?? "create"
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      DeleteConfirmation,
      {
        target: deleteTarget,
        t,
        busy,
        onCancel: () => setDeleteTarget(void 0),
        onConfirm: () => {
          const target = deleteTarget;
          if (target === void 0) return;
          void runAction(async () => {
            await runtime.mutateAutomation(target.id, "delete");
            setDeleteTarget(void 0);
          });
        }
      }
    )
  ] });
}
function TaskCard({
  item,
  t,
  now,
  busy,
  onEdit,
  onToggle,
  onRun,
  onDelete
}) {
  const [menu, setMenu] = (0, import_react4.useState)(false);
  const root = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    if (!menu) return;
    const close = (event) => {
      if (root.current !== null && !root.current.contains(event.target)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [menu]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("article", { className: "dsh-st-card", ref: root, onClick: onEdit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-card-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: `dsh-st-switch ${item.status === "active" ? "is-on" : ""}`, role: "switch", "aria-checked": item.status === "active", disabled: busy, onClick: (event) => {
        event.stopPropagation();
        onToggle();
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsh-st-more", onClick: (event) => {
        event.stopPropagation();
        setMenu((value) => !value);
      }, "aria-label": t("card.more"), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(MoreIcon, {}) }),
      menu && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-menu", onClick: (event) => event.stopPropagation(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", disabled: busy, onClick: () => {
          setMenu(false);
          onRun();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PlayIcon, { width: 16, height: 16 }),
          t("menu.run")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", disabled: busy, onClick: () => {
          setMenu(false);
          onEdit();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PencilIcon, { width: 16, height: 16 }),
          t("menu.edit")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "is-danger", disabled: busy, onClick: () => {
          setMenu(false);
          onDelete();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TrashIcon, { width: 16, height: 16 }),
          t("menu.delete")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: item.name }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: item.prompt }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsh-st-card-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsh-st-chip", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ClockIcon, {}),
        formatSchedule(item.schedule, t)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: item.nextRunAt === void 0 ? t("stats.noneScheduled") : t("history.nextApprox", { when: formatWithin(item.nextRunAt, now, t) }) })
    ] })
  ] });
}
function SortMenu({
  t,
  sortKey,
  sortDirection,
  onSelect
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    DropdownMenu,
    {
      className: "dsh-st-sort",
      ariaLabel: t("sort.by"),
      options: [
        { key: "created-desc", label: t("sort.created.desc"), selected: sortKey === "created" && sortDirection === "desc", onSelect: () => onSelect("created", "desc") },
        { key: "created-asc", label: t("sort.created.asc"), selected: sortKey === "created" && sortDirection === "asc", onSelect: () => onSelect("created", "asc") },
        { key: "planned-asc", label: t("sort.planned.asc"), selected: sortKey === "planned" && sortDirection === "asc", onSelect: () => onSelect("planned", "asc") },
        { key: "planned-desc", label: t("sort.planned.desc"), selected: sortKey === "planned" && sortDirection === "desc", onSelect: () => onSelect("planned", "desc") }
      ]
    }
  );
}
function DropdownMenu({
  ariaLabel,
  className,
  options
}) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  const root = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    if (!open) return;
    const close = (event) => {
      if (root.current !== null && !root.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  const selectedLabel = options.find((option) => option.selected)?.label ?? options[0]?.label ?? ariaLabel;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: `dsh-st-dropdown${className === void 0 ? "" : ` ${className}`}`, ref: root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: `dsh-st-dropdown-btn${open ? " is-open" : ""}`, "aria-label": ariaLabel, "aria-expanded": open, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsh-st-dropdown-label", children: selectedLabel }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChevronIcon, { width: 10, height: 10, className: "dsh-st-dropdown-chevron" })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsh-st-dropdown-menu", children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      DropdownRow,
      {
        label: option.label,
        selected: option.selected,
        onSelect: () => {
          setOpen(false);
          option.onSelect();
        }
      },
      option.key
    )) })
  ] });
}
function DropdownRow({
  label,
  selected,
  onSelect
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", "aria-pressed": selected, className: selected ? "is-selected" : void 0, onClick: onSelect, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: label }),
    selected ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CheckOutlineIcon, { width: 16, height: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsh-st-sort-tick" })
  ] });
}
function RunRow({ run, t }) {
  const duration = formatDuration(run.startedAt, run.finishedAt);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("article", { className: `dsh-st-run is-${run.status}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: run.automationName }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: clockTime(run.startedAt ?? run.scheduledFor) }),
      duration !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: duration }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: t("history.trigger") })
    ] })
  ] });
}

// src/client/locales.ts
var NS = "dsh-automation";
var en = {
  tab: "Scheduled tasks",
  "sidebar.tab": "Scheduled",
  "sidebar.tabs": "Workspace views",
  "sidebar.tasksTab": "Tasks",
  "sidebar.channelsTab": "Channels",
  "sidebar.empty": "No scheduled runs yet.",
  "sidebar.tasksEmpty": "No web tasks yet.",
  "sidebar.ungrouped": "Ungrouped",
  "sidebar.section": "Scheduled",
  "sidebar.workspaces": "Workspaces",
  "sidebar.search": "Search",
  "sidebar.searchSessions": "Search sessions...",
  "sidebar.clearSearch": "Clear search",
  "sidebar.filter": "Filter",
  "sidebar.groupBy": "Group by",
  "sidebar.groupWorkspace": "By workspace",
  "sidebar.groupList": "Single list",
  "sidebar.sortBy": "Sort by",
  "sidebar.sortManual": "Manual",
  "sidebar.sortTime": "Recently updated",
  "header.lead": "Plan automatic tasks, or trigger them by hand. Describe the recurring work in any chat to create it quickly.",
  "examples.title": "Recommended examples",
  "examples.1.title": "Daily regression check",
  "examples.1.body": "Create a scheduled task that runs every day and inspects new test failures.",
  "examples.1.chip": "Every day 09:00",
  "examples.2.title": "Weekly dependency review",
  "examples.2.body": "Create a scheduled task that runs every Monday and reports outdated or risky dependencies.",
  "examples.2.chip": "Monday 10:00",
  "examples.3.title": "Weekday morning briefing",
  "examples.3.body": "Create a scheduled task that runs on weekdays and summarizes overnight changes.",
  "examples.3.chip": "Weekdays 08:00",
  "chat.hint": "In any conversation, describe the recurring work and ask the Agent to call automation_create.",
  "chat.prompt": "I want to create a scheduled task that runs every [interval] and does [the actual task]",
  "menu.run": "Run task",
  "menu.edit": "Edit task",
  "menu.delete": "Delete task",
  "session.rename": "Rename",
  "session.fork": "Fork session",
  "session.archive": "Archive session",
  "session.idle": "Idle",
  "session.runningStatus": "Running",
  "session.delete": "Remove from Scheduled",
  "session.deleteFolder": "Remove folder",
  "session.confirmDeleteFolder": "Remove this folder from Scheduled?",
  "session.confirmDeleteFolderHint": 'This only unlists {count} session(s) in "{name}" from Scheduled. Host sessions are not deleted and they stay hidden from Tasks.',
  "session.confirmDeleteFolderAction": "Remove from Scheduled",
  "history.range.day": "By day",
  "history.range.week": "By week",
  "history.range.month": "By month",
  "history.allTasks": "All tasks",
  "history.allStatus": "All statuses",
  "history.today": "Today",
  "history.yesterday": "Yesterday",
  "history.date": "{date}",
  "history.week": "Week of {date}",
  "history.month": "{month}",
  "history.trigger": "Scheduled",
  "history.nextApprox": "Next run in about {when}",
  "time.withinMinute": "about {count} minutes",
  "time.withinHour": "about {count} hours",
  "time.withinDay": "about {count} days",
  "search.placeholder": "Search scheduled tasks...",
  "action.chatCreate": "Create in chat",
  "action.create": "New scheduled task",
  "banner.wake": "Scheduled tasks run only while this computer stays awake.",
  "tabs.mine": "My tasks",
  "tabs.runs": "Run history",
  "sort.by": "Sort",
  "sort.created.asc": "Created time ascending",
  "sort.created.desc": "Created time descending",
  "sort.planned.asc": "Planned time ascending",
  "sort.planned.desc": "Planned time descending",
  "form.workspace": "Workspace",
  "form.workspacePath": "Folder path",
  "form.workspacePathPlaceholder": "D:\\work\\project",
  "form.model": "Model",
  "form.modelSelect": "Select model",
  "form.effort": "Reasoning",
  "form.effort.none": "Default",
  "form.effort.low": "Low",
  "form.effort.medium": "Medium",
  "form.effort.high": "High",
  "form.error.workspace": "Select a workspace.",
  "modal.title": "New scheduled task",
  "modal.edit": "Edit scheduled task",
  "modal.save": "Save",
  "header.eyebrow": "Unattended coding work",
  "header.title": "Automations",
  "header.subtitle": "Schedule standalone, auditable Agent runs for this workspace.",
  "header.create": "New automation",
  "header.closeCreate": "Hide form",
  "scope.workspace": "Workspace",
  "scope.folder": "Working directory",
  "stats.total": "All",
  "stats.active": "Active",
  "stats.next": "Next run",
  "stats.attention": "Needs attention",
  "stats.noneScheduled": "None scheduled",
  "stats.noAttention": "All clear",
  "section.automations": "Workspace automations",
  "section.automationsHint": "Each trigger starts a fresh DSH Session and keeps its own audit record.",
  "section.runs": "Recent runs",
  "section.runsHint": "Latest outcomes for this workspace.",
  "section.refresh": "Refresh",
  "empty.title": "Let recurring coding work run itself",
  "empty.body": "Save a self-contained task, a schedule, and a permission boundary. Every run starts in a new Session.",
  "empty.action": "Create the first automation",
  "runs.empty": "No runs yet. Run one now, or wait for the next scheduled occurrence.",
  "form.title": "Create automation",
  "form.subtitle": "Write a complete, standalone task. Scheduled runs do not inherit this conversation.",
  "form.name": "Name",
  "form.namePlaceholder": "Daily regression triage",
  "form.prompt": "Task prompt",
  "form.promptPlaceholder": "Inspect new test failures, locate the regression, and propose a verified minimal fix\u2026",
  "form.schedule": "Schedule",
  "form.planTime": "Schedule",
  "form.hourly": "Hourly",
  "form.monthly": "Monthly",
  "form.custom": "Custom",
  "form.minutesShort": "min",
  "form.daysShort": "days",
  "form.monthDay": "Day {day} of month",
  "form.skills": "Skills",
  "form.skillsEmpty": "No skills available",
  "schedule.hourlyAt": "Every hour at :{minute}",
  "schedule.monthlyAt": "Monthly on day {day} \xB7 {time}",
  "schedule.customAt": "Every {count} days \xB7 {time}",
  "form.once": "Does not repeat",
  "form.interval": "Interval",
  "form.daily": "Daily",
  "form.weekly": "Weekly",
  "form.runAt": "Run at",
  "form.every": "Every",
  "form.minutes": "minutes",
  "form.time": "Time",
  "form.days": "Weekdays",
  "form.timeZone": "Time zone",
  "form.permission": "Permission boundary",
  "permission.readOnly": "Read Only",
  "permission.workspaceWrite": "Workspace Write",
  "permission.fullAccess": "Full access",
  "form.cancel": "Cancel",
  "form.submit": "Create automation",
  "form.submitting": "Creating\u2026",
  "form.error.name": "Enter a name.",
  "form.error.prompt": "Enter a complete, standalone task prompt.",
  "form.error.once": "Choose a valid future date and time.",
  "form.error.interval": "The interval must be between 5 and 43,200 minutes.",
  "form.error.weekdays": "Select at least one weekday.",
  "day.1": "Mon",
  "day.2": "Tue",
  "day.3": "Wed",
  "day.4": "Thu",
  "day.5": "Fri",
  "day.6": "Sat",
  "day.7": "Sun",
  "status.active": "Active",
  "status.paused": "Paused",
  "status.queued": "Queued",
  "status.running": "Running",
  "status.succeeded": "Succeeded",
  "status.failed": "Failed",
  "status.skipped": "Skipped",
  "status.cancelled": "Cancelled",
  "status.interrupted": "Interrupted",
  "card.nextRun": "Next",
  "card.lastRun": "Last",
  "card.never": "Not yet run",
  "schedule.onceAt": "Once \xB7 {time}",
  "schedule.everyMinutes": "Every {count} minutes",
  "schedule.dailyAt": "Daily \xB7 {time}",
  "schedule.weeklyAt": "{days} \xB7 {time}",
  "card.pause": "Pause",
  "card.resume": "Resume",
  "card.runNow": "Run now",
  "card.more": "More actions",
  "card.delete": "Delete",
  "card.confirmDelete": "Delete this automation?",
  "card.confirmDeleteHint": "Run history is kept for audit.",
  "card.confirm": "Delete",
  "card.cancel": "Cancel",
  "run.trigger.schedule": "Scheduled",
  "run.trigger.manual": "Manual",
  "run.trigger.catch-up": "Catch-up",
  "run.openSession": "Session {id}",
  "run.markRead": "Mark reviewed",
  loading: "Loading automations\u2026",
  "error.title": "Automations could not be loaded",
  "error.retry": "Try again",
  "error.action": "The action failed. Please try again.",
  "error.offline": "Could not reach the local automation service. Check that DSH is still running and try again.",
  "time.now": "now",
  "time.minuteAgo": "{count}m ago",
  "time.hourAgo": "{count}h ago",
  "time.dayAgo": "{count}d ago",
  "time.inMinute": "in {count}m",
  "time.inHour": "in {count}h",
  "time.inDay": "in {count}d"
};
var zh = {
  tab: "\u5B9A\u65F6\u4EFB\u52A1",
  "sidebar.tab": "\u5B9A\u65F6",
  "sidebar.tabs": "\u5DE5\u4F5C\u533A\u5206\u7C7B",
  "sidebar.tasksTab": "\u4EFB\u52A1",
  "sidebar.channelsTab": "\u9891\u9053",
  "sidebar.empty": "\u8FD8\u6CA1\u6709\u5B9A\u65F6\u4EFB\u52A1\u6267\u884C\u8BB0\u5F55\u3002",
  "sidebar.tasksEmpty": "\u6682\u65E0\u7F51\u9875\u4EFB\u52A1",
  "sidebar.ungrouped": "\u672A\u5206\u7EC4",
  "sidebar.section": "\u5B9A\u65F6\u4EFB\u52A1",
  "sidebar.workspaces": "\u5DE5\u4F5C\u533A",
  "sidebar.search": "\u641C\u7D22",
  "sidebar.searchSessions": "\u641C\u7D22\u4F1A\u8BDD...",
  "sidebar.clearSearch": "\u6E05\u9664\u641C\u7D22",
  "sidebar.filter": "\u7B5B\u9009",
  "sidebar.groupBy": "\u5206\u7EC4\u65B9\u5F0F",
  "sidebar.groupWorkspace": "\u6309\u5DE5\u4F5C\u533A",
  "sidebar.groupList": "\u5355\u5217\u8868",
  "sidebar.sortBy": "\u6392\u5E8F\u65B9\u5F0F",
  "sidebar.sortManual": "\u624B\u52A8\u6392\u5E8F",
  "sidebar.sortTime": "\u6700\u8FD1\u66F4\u65B0",
  "header.lead": "\u6309\u8BA1\u5212\u81EA\u52A8\u6267\u884C\u4EFB\u52A1\uFF0C\u4E5F\u53EF\u968F\u65F6\u624B\u52A8\u89E6\u53D1\u3002\u5728\u4EFB\u610F\u5BF9\u8BDD\u4E2D\u63CF\u8FF0\u4F60\u60F3\u5B9A\u671F\u505A\u7684\u4E8B\uFF0C\u5373\u53EF\u5FEB\u901F\u521B\u5EFA",
  "examples.title": "\u63A8\u8350\u6848\u4F8B",
  "examples.1.title": "\u6BCF\u65E5\u56DE\u5F52\u68C0\u67E5",
  "examples.1.body": "\u6211\u8981\u521B\u5EFA\u4E00\u4E2A\u5B9A\u65F6\u4EFB\u52A1\uFF0C\u6BCF\u3010\u5929\u3011\u6267\u884C\u3010\u68C0\u67E5\u65B0\u589E\u6D4B\u8BD5\u5931\u8D25\u5E76\u7ED9\u51FA\u6700\u5C0F\u4FEE\u590D\u3011\u3002",
  "examples.1.chip": "\u6BCF\u5929 09:00",
  "examples.2.title": "\u6BCF\u5468\u4F9D\u8D56\u5DE1\u68C0",
  "examples.2.body": "\u6211\u8981\u521B\u5EFA\u4E00\u4E2A\u5B9A\u65F6\u4EFB\u52A1\uFF0C\u6BCF\u3010\u5468\u4E00\u3011\u6267\u884C\u3010\u68C0\u67E5\u8FC7\u671F\u6216\u6709\u98CE\u9669\u7684\u4F9D\u8D56\u5E76\u7ED9\u51FA\u5904\u7406\u5EFA\u8BAE\u3011\u3002",
  "examples.2.chip": "\u6BCF\u5468\u4E00 10:00",
  "examples.3.title": "\u5DE5\u4F5C\u65E5\u65E9\u62A5",
  "examples.3.body": "\u6211\u8981\u521B\u5EFA\u4E00\u4E2A\u5B9A\u65F6\u4EFB\u52A1\uFF0C\u6BCF\u3010\u5DE5\u4F5C\u65E5\u3011\u6267\u884C\u3010\u6C47\u603B\u6628\u591C\u4ED3\u5E93\u53D8\u66F4\u5E76\u7ED9\u51FA\u4ECA\u65E5\u5173\u6CE8\u70B9\u3011\u3002",
  "examples.3.chip": "\u5DE5\u4F5C\u65E5 08:00",
  "chat.hint": "\u5728\u4EFB\u610F\u5BF9\u8BDD\u4E2D\u63CF\u8FF0\u4F60\u60F3\u5B9A\u671F\u505A\u7684\u4E8B\uFF0C\u5E76\u8BA9 Agent \u8C03\u7528 automation_create\u3002",
  "chat.prompt": "\u6211\u8981\u521B\u5EFA\u4E00\u4E2A\u5B9A\u65F6\u4EFB\u52A1\uFF0C\u6BCF\u3010\u65F6\u95F4\u95F4\u9694\u3011\u6267\u884C\u3010\u5177\u4F53\u4EFB\u52A1\u3011",
  "menu.run": "\u6267\u884C\u4EFB\u52A1",
  "menu.edit": "\u7F16\u8F91\u4EFB\u52A1",
  "menu.delete": "\u5220\u9664\u4EFB\u52A1",
  "session.rename": "\u91CD\u547D\u540D",
  "session.fork": "\u5206\u53C9\u4F1A\u8BDD",
  "session.archive": "\u5F52\u6863\u4F1A\u8BDD",
  "session.idle": "\u7A7A\u95F2",
  "session.runningStatus": "\u8FD0\u884C\u4E2D",
  "session.delete": "\u4ECE\u5B9A\u65F6\u9875\u79FB\u9664",
  "session.deleteFolder": "\u4ECE\u5B9A\u65F6\u9875\u79FB\u9664\u6587\u4EF6\u5939",
  "session.confirmDeleteFolder": "\u4ECE\u5B9A\u65F6\u9875\u79FB\u9664\u8FD9\u4E2A\u6587\u4EF6\u5939\uFF1F",
  "session.confirmDeleteFolderHint": "\u53EA\u4F1A\u628A\u300C{name}\u300D\u4E0B\u7684 {count} \u6761\u4F1A\u8BDD\u4ECE\u5B9A\u65F6\u9875\u6458\u6389\uFF0C\u4E0D\u4F1A\u5220\u9664\u5BBF\u4E3B Session\u3002\u4EFB\u52A1\u9875\u672C\u6765\u4E5F\u4E0D\u5C55\u793A\u8FD9\u4E9B\u81EA\u52A8\u5316\u4F1A\u8BDD\u3002",
  "session.confirmDeleteFolderAction": "\u4ECE\u5B9A\u65F6\u9875\u79FB\u9664",
  "history.range.day": "\u6309\u5929",
  "history.range.week": "\u6309\u5468",
  "history.range.month": "\u6309\u6708",
  "history.allTasks": "\u5168\u90E8\u4EFB\u52A1",
  "history.allStatus": "\u5168\u90E8\u72B6\u6001",
  "history.today": "\u4ECA\u5929",
  "history.yesterday": "\u6628\u5929",
  "history.date": "{date}",
  "history.week": "{date} \u5F53\u5468",
  "history.month": "{month}",
  "history.trigger": "\u5B9A\u65F6\u89E6\u53D1",
  "history.nextApprox": "\u4E0B\u6B21\u6267\u884C \u5927\u7EA6 {when}",
  "time.withinMinute": "{count} \u5206\u949F\u5185",
  "time.withinHour": "{count} \u5C0F\u65F6\u5185",
  "time.withinDay": "{count} \u5929\u5185",
  "search.placeholder": "\u641C\u7D22\u5B9A\u65F6\u4EFB\u52A1...",
  "action.chatCreate": "\u901A\u8FC7\u5BF9\u8BDD\u521B\u5EFA",
  "action.create": "\u65B0\u5EFA\u5B9A\u65F6\u4EFB\u52A1",
  "banner.wake": "\u5B9A\u65F6\u4EFB\u52A1\u4EC5\u5728\u7535\u8111\u4FDD\u6301\u5524\u9192\u65F6\u8FD0\u884C",
  "tabs.mine": "\u6211\u7684\u5B9A\u65F6\u4EFB\u52A1",
  "tabs.runs": "\u6267\u884C\u8BB0\u5F55",
  "sort.by": "\u6392\u5E8F",
  "sort.created.asc": "\u6309\u521B\u5EFA\u65F6\u95F4\u5347\u5E8F",
  "sort.created.desc": "\u6309\u521B\u5EFA\u65F6\u95F4\u5012\u5E8F",
  "sort.planned.asc": "\u6309\u8BA1\u5212\u65F6\u95F4\u5347\u5E8F",
  "sort.planned.desc": "\u6309\u8BA1\u5212\u65F6\u95F4\u5012\u5E8F",
  "form.workspace": "\u5DE5\u4F5C\u76EE\u5F55",
  "form.workspacePath": "\u76EE\u5F55\u8DEF\u5F84",
  "form.workspacePathPlaceholder": "D:\\work\\project",
  "form.model": "\u6A21\u578B",
  "form.modelSelect": "\u9009\u62E9\u6A21\u578B",
  "form.effort": "\u63A8\u7406\u7B49\u7EA7",
  "form.effort.none": "\u9ED8\u8BA4",
  "form.effort.low": "Low",
  "form.effort.medium": "Medium",
  "form.effort.high": "High",
  "form.error.workspace": "\u8BF7\u9009\u62E9\u5DE5\u4F5C\u533A\u3002",
  "modal.title": "\u65B0\u5EFA\u5B9A\u65F6\u4EFB\u52A1",
  "modal.edit": "\u7F16\u8F91\u5B9A\u65F6\u4EFB\u52A1",
  "modal.save": "\u4FDD\u5B58",
  "header.eyebrow": "\u81EA\u4E3B\u7F16\u7801\u4EFB\u52A1",
  "header.title": "\u81EA\u52A8\u5316",
  "header.subtitle": "\u4E3A\u5F53\u524D\u5DE5\u4F5C\u533A\u5B89\u6392\u72EC\u7ACB\u3001\u53EF\u5BA1\u8BA1\u7684 Agent \u8FD0\u884C\u3002",
  "header.create": "\u65B0\u5EFA\u81EA\u52A8\u5316",
  "header.closeCreate": "\u6536\u8D77\u8868\u5355",
  "scope.workspace": "\u5DE5\u4F5C\u533A",
  "scope.folder": "\u5DE5\u4F5C\u76EE\u5F55",
  "stats.total": "\u5168\u90E8",
  "stats.active": "\u5DF2\u542F\u7528",
  "stats.next": "\u4E0B\u6B21\u8FD0\u884C",
  "stats.attention": "\u9700\u8981\u5173\u6CE8",
  "stats.noneScheduled": "\u6682\u65E0\u8BA1\u5212",
  "stats.noAttention": "\u4E00\u5207\u6B63\u5E38",
  "section.automations": "\u5DE5\u4F5C\u533A\u81EA\u52A8\u5316",
  "section.automationsHint": "\u6BCF\u6B21\u89E6\u53D1\u90FD\u4F1A\u521B\u5EFA\u4E00\u4E2A\u5168\u65B0\u7684 DSH Session\uFF0C\u5E76\u4FDD\u7559\u72EC\u7ACB\u5BA1\u8BA1\u8BB0\u5F55\u3002",
  "section.runs": "\u6700\u8FD1\u8FD0\u884C",
  "section.runsHint": "\u5F53\u524D\u5DE5\u4F5C\u533A\u6700\u8FD1\u7684\u6267\u884C\u72B6\u6001\u3002",
  "section.refresh": "\u5237\u65B0",
  "empty.title": "\u8BA9\u91CD\u590D\u7684\u7F16\u7801\u5DE5\u4F5C\u81EA\u52A8\u8FD0\u884C",
  "empty.body": "\u8BBE\u7F6E\u4E00\u4E2A\u76EE\u6807\u660E\u786E\u7684\u4EFB\u52A1\u3001\u8FD0\u884C\u65F6\u95F4\u548C\u6743\u9650\u8FB9\u754C\u3002\u6BCF\u6B21\u8FD0\u884C\u90FD\u4ECE\u5168\u65B0 Session \u5F00\u59CB\u3002",
  "empty.action": "\u521B\u5EFA\u7B2C\u4E00\u4E2A\u81EA\u52A8\u5316",
  "runs.empty": "\u8FD8\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55\u3002\u4F60\u53EF\u4EE5\u7ACB\u5373\u8FD0\u884C\u4E00\u6B21\uFF0C\u6216\u7B49\u5F85\u8BA1\u5212\u89E6\u53D1\u3002",
  "form.title": "\u521B\u5EFA\u81EA\u52A8\u5316",
  "form.subtitle": "\u8BF7\u5199\u5B8C\u6574\u3001\u72EC\u7ACB\u7684\u4EFB\u52A1\u8BF4\u660E\uFF1A\u5B9A\u65F6\u8FD0\u884C\u4E0D\u4F1A\u7EE7\u627F\u5F53\u524D\u5BF9\u8BDD\u3002",
  "form.name": "\u540D\u79F0",
  "form.namePlaceholder": "\u6BCF\u65E5\u56DE\u5F52\u6D4B\u8BD5\u5206\u8BCA",
  "form.prompt": "\u4EFB\u52A1\u6307\u4EE4",
  "form.promptPlaceholder": "\u68C0\u67E5\u65B0\u589E\u6D4B\u8BD5\u5931\u8D25\uFF0C\u5B9A\u4F4D\u56DE\u5F52\u539F\u56E0\uFF0C\u5E76\u7ED9\u51FA\u7ECF\u8FC7\u9A8C\u8BC1\u7684\u6700\u5C0F\u4FEE\u590D\u65B9\u6848\u2026\u2026",
  "form.schedule": "\u8FD0\u884C\u8BA1\u5212",
  "form.planTime": "\u8BA1\u5212\u65F6\u95F4",
  "form.hourly": "\u6BCF\u5C0F\u65F6",
  "form.monthly": "\u6BCF\u6708",
  "form.custom": "\u81EA\u5B9A\u4E49",
  "form.minutesShort": "\u5206",
  "form.daysShort": "\u5929",
  "form.monthDay": "\u6BCF\u6708\u7B2C {day} \u5929",
  "form.skills": "\u6280\u80FD",
  "form.skillsEmpty": "\u6682\u65E0\u53EF\u7528\u6280\u80FD",
  "schedule.hourlyAt": "\u6BCF\u5C0F\u65F6 :{minute}",
  "schedule.monthlyAt": "\u6BCF\u6708 {day} \u65E5 \xB7 {time}",
  "schedule.customAt": "\u6BCF {count} \u5929 \xB7 {time}",
  "form.once": "\u4E0D\u91CD\u590D",
  "form.interval": "\u95F4\u9694",
  "form.daily": "\u6BCF\u5929",
  "form.weekly": "\u6BCF\u5468",
  "form.runAt": "\u8FD0\u884C\u65F6\u95F4",
  "form.every": "\u6BCF\u9694",
  "form.minutes": "\u5206\u949F",
  "form.time": "\u65F6\u95F4",
  "form.days": "\u661F\u671F",
  "form.timeZone": "\u65F6\u533A",
  "form.permission": "\u6743\u9650\u8FB9\u754C",
  "permission.readOnly": "\u53EA\u8BFB",
  "permission.workspaceWrite": "\u5DE5\u4F5C\u533A\u5199\u5165",
  "permission.fullAccess": "\u5B8C\u5168\u8BBF\u95EE",
  "form.cancel": "\u53D6\u6D88",
  "form.submit": "\u521B\u5EFA\u81EA\u52A8\u5316",
  "form.submitting": "\u521B\u5EFA\u4E2D\u2026",
  "form.error.name": "\u8BF7\u8F93\u5165\u540D\u79F0\u3002",
  "form.error.prompt": "\u8BF7\u8F93\u5165\u5B8C\u6574\u3001\u72EC\u7ACB\u7684\u4EFB\u52A1\u6307\u4EE4\u3002",
  "form.error.once": "\u8BF7\u9009\u62E9\u6709\u6548\u7684\u672A\u6765\u65E5\u671F\u548C\u65F6\u95F4\u3002",
  "form.error.interval": "\u8FD0\u884C\u95F4\u9694\u5FC5\u987B\u5728 5 \u5230 43,200 \u5206\u949F\u4E4B\u95F4\u3002",
  "form.error.weekdays": "\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u5929\u3002",
  "day.1": "\u5468\u4E00",
  "day.2": "\u5468\u4E8C",
  "day.3": "\u5468\u4E09",
  "day.4": "\u5468\u56DB",
  "day.5": "\u5468\u4E94",
  "day.6": "\u5468\u516D",
  "day.7": "\u5468\u65E5",
  "status.active": "\u5DF2\u542F\u7528",
  "status.paused": "\u5DF2\u6682\u505C",
  "status.queued": "\u6392\u961F\u4E2D",
  "status.running": "\u8FD0\u884C\u4E2D",
  "status.succeeded": "\u5DF2\u5B8C\u6210",
  "status.failed": "\u5931\u8D25",
  "status.skipped": "\u5DF2\u8DF3\u8FC7",
  "status.cancelled": "\u5DF2\u53D6\u6D88",
  "status.interrupted": "\u5DF2\u4E2D\u65AD",
  "card.nextRun": "\u4E0B\u6B21",
  "card.lastRun": "\u6700\u8FD1",
  "card.never": "\u5C1A\u672A\u8FD0\u884C",
  "schedule.onceAt": "\u5355\u6B21 \xB7 {time}",
  "schedule.everyMinutes": "\u6BCF {count} \u5206\u949F",
  "schedule.dailyAt": "\u6BCF\u5929 \xB7 {time}",
  "schedule.weeklyAt": "{days} \xB7 {time}",
  "card.pause": "\u6682\u505C",
  "card.resume": "\u6062\u590D",
  "card.runNow": "\u7ACB\u5373\u8FD0\u884C",
  "card.more": "\u66F4\u591A\u64CD\u4F5C",
  "card.delete": "\u5220\u9664",
  "card.confirmDelete": "\u786E\u8BA4\u5220\u9664\u8FD9\u4E2A\u81EA\u52A8\u5316\uFF1F",
  "card.confirmDeleteHint": "\u8FD0\u884C\u5386\u53F2\u4F1A\u4FDD\u7559\u7528\u4E8E\u5BA1\u8BA1\u3002",
  "card.confirm": "\u786E\u8BA4\u5220\u9664",
  "card.cancel": "\u53D6\u6D88",
  "run.trigger.schedule": "\u5B9A\u65F6",
  "run.trigger.manual": "\u624B\u52A8",
  "run.trigger.catch-up": "\u8865\u507F\u8FD0\u884C",
  "run.openSession": "Session {id}",
  "run.markRead": "\u6807\u8BB0\u5DF2\u5904\u7406",
  loading: "\u6B63\u5728\u52A0\u8F7D\u81EA\u52A8\u5316\u2026",
  "error.title": "\u65E0\u6CD5\u52A0\u8F7D\u81EA\u52A8\u5316",
  "error.retry": "\u91CD\u8BD5",
  "error.action": "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
  "error.offline": "\u65E0\u6CD5\u8FDE\u63A5\u672C\u673A\u81EA\u52A8\u5316\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4 DSH \u4ECD\u5728\u8FD0\u884C\u540E\u91CD\u8BD5\u3002",
  "time.now": "\u521A\u521A",
  "time.minuteAgo": "{count} \u5206\u949F\u524D",
  "time.hourAgo": "{count} \u5C0F\u65F6\u524D",
  "time.dayAgo": "{count} \u5929\u524D",
  "time.inMinute": "{count} \u5206\u949F\u540E",
  "time.inHour": "{count} \u5C0F\u65F6\u540E",
  "time.inDay": "{count} \u5929\u540E"
};

// src/client/native-tabs.ts
var NATIVE_TABS_KEY = "__dshNativeTabs";
function createNativeTabRegistry(officialTree) {
  const tabs = /* @__PURE__ */ new Map();
  const sessionFilters = [];
  const listeners2 = /* @__PURE__ */ new Set();
  let cachedTabs = [];
  const rebuild = () => {
    cachedTabs = [...tabs.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
  };
  const emit = () => {
    for (const listener of listeners2) listener();
  };
  return {
    version: 1,
    officialTree,
    sessionFilters,
    getTabs() {
      return cachedTabs;
    },
    subscribe(listener) {
      listeners2.add(listener);
      return () => {
        listeners2.delete(listener);
      };
    },
    insert(tab) {
      if (tab.id === "") return () => void 0;
      const existed = tabs.get(tab.id);
      tabs.set(tab.id, tab);
      if (existed !== tab) {
        rebuild();
        emit();
      }
      return () => {
        tabs.delete(tab.id);
        rebuild();
        emit();
      };
    },
    addSessionFilter(filter) {
      sessionFilters.push(filter);
      emit();
      return () => {
        const index = sessionFilters.indexOf(filter);
        if (index >= 0) sessionFilters.splice(index, 1);
        emit();
      };
    }
  };
}
function getNativeTabRegistry(target) {
  if (target === void 0 || target === null || typeof target !== "object" && typeof target !== "function") return void 0;
  const registry = target[NATIVE_TABS_KEY];
  if (registry === void 0 || registry === null || typeof registry !== "object") return void 0;
  return typeof registry.insert === "function" ? registry : void 0;
}
function attachNativeTabRegistry(target, registry) {
  try {
    target[NATIVE_TABS_KEY] = registry;
  } catch {
  }
  return registry;
}
function findNativeTabRegistry(entry) {
  const record = entry;
  return getNativeTabRegistry(entry) ?? getNativeTabRegistry(record?.component);
}
function isForeignSidebarHost(component) {
  if (component === void 0 || component === null) return false;
  const flags = component;
  if (flags.__dshNativeTabHost === true) return true;
  if (flags.__imConnectWrapped === true) return true;
  return getNativeTabRegistry(component) !== void 0;
}

// src/client/native-session-list.tsx
var import_react6 = require("react");
var import_react_dom2 = require("react-dom");

// src/client/native-session-menu.ts
function resolveEventElement(target) {
  if (target == null || typeof target !== "object") return null;
  const node = target;
  if (node.nodeType === 3 || node.nodeType === 8) {
    return node.parentElement ?? null;
  }
  return node;
}
function shouldCloseNativeSessionMenu(target, keepInside) {
  const el = resolveEventElement(target);
  if (el == null) return true;
  return !keepInside.some((root) => {
    if (root == null || typeof root !== "object") return false;
    if (root === el) return true;
    const box = root;
    return typeof box.contains === "function" && box.contains(el);
  });
}
function pointerPoint(event) {
  const x = Number(event?.clientX);
  const y = Number(event?.clientY);
  return {
    x: Number.isFinite(x) ? x : 8,
    y: Number.isFinite(y) ? y : 8
  };
}
function clampMenuPoint(x, y, width, height, viewport) {
  const pad = 8;
  const vw = viewport.width || width + pad * 2;
  const vh = viewport.height || height + pad * 2;
  return {
    x: Math.max(pad, Math.min(x, Math.max(pad, vw - width - pad))),
    y: Math.max(pad, Math.min(y, Math.max(pad, vh - height - pad)))
  };
}
function nextOpenSessionMenu(current, clicked, point) {
  if (current?.id === clicked) return null;
  return { id: clicked, x: point.x, y: point.y };
}
function nativeSessionMenuStyle(point, size = { width: 218, height: 176 }, viewport = { width: 1e3, height: 800 }) {
  const pos = clampMenuPoint(point.x, point.y, size.width, size.height, viewport);
  return {
    position: "fixed",
    zIndex: 4e3,
    left: `${Math.round(pos.x)}px`,
    top: `${Math.round(pos.y)}px`
  };
}
function nativeSessionHoverStyle(row, card, viewport) {
  const pad = 8;
  const left = row.right + pad;
  const top = row.top + card.height > viewport.height - pad ? Math.max(pad, viewport.height - card.height - pad) : Math.max(pad, row.top);
  return {
    position: "fixed",
    zIndex: 4100,
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`
  };
}
function relativeTime(value, t, now = Date.now()) {
  const ts = Date.parse(value || "");
  if (!Number.isFinite(ts)) return "";
  const delta = Math.max(0, now - ts);
  const min = Math.floor(delta / 6e4);
  if (min < 1) return t("time.now");
  if (min < 60) return t("time.minuteAgo", { count: min });
  const hour = Math.floor(min / 60);
  if (hour < 24) return t("time.hourAgo", { count: hour });
  return t("time.dayAgo", { count: Math.floor(hour / 24) });
}

// src/run-title.ts
function formatRunStamp(iso) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return iso;
  const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  const time = `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

// src/client/schedule-rail-model.ts
var AUTOMATION_SESSION_PREFIX = "dsh-automation-session-";
var NATIVE_SIDEBAR_TAB_KEY = "dsh-automation.sidebar-tab";
function groupScheduledSessions(automations, runs) {
  const nameById = /* @__PURE__ */ new Map();
  for (const item of automations) nameById.set(item.id, item.name);
  for (const run of runs) {
    const stored = (run.automationName || "").trim();
    if (stored !== "" && stored !== run.automationId && !nameById.has(run.automationId)) {
      nameById.set(run.automationId, stored);
    }
  }
  const ids = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of automations) {
    if (seen.has(item.id)) continue;
    ids.push(item.id);
    seen.add(item.id);
  }
  for (const run of runs) {
    if (run.sessionId === void 0 || run.sessionId === "" || seen.has(run.automationId)) continue;
    ids.push(run.automationId);
    seen.add(run.automationId);
  }
  return ids.map((id) => {
    const name2 = nameById.get(id) ?? id;
    return {
      id,
      name: name2,
      sessions: runs.filter((run) => run.automationId === id && run.sessionId !== void 0 && run.sessionId !== "").slice().sort((left, right) => Date.parse(right.startedAt ?? right.scheduledFor) - Date.parse(left.startedAt ?? left.scheduledFor)).map((run) => ({
        id: run.sessionId,
        running: run.status === "running" || run.status === "queued",
        label: formatRunStamp(run.startedAt ?? run.scheduledFor) + " - " + name2
      }))
    };
  }).filter((group) => group.sessions.length > 0);
}
function keepScheduledSessionLink(sessionId, archived, presentIds) {
  if (sessionId === void 0 || sessionId === "") return false;
  if (archived.has(sessionId)) return false;
  if (presentIds === void 0) return true;
  return presentIds.has(sessionId);
}
function collectScheduledSessionIds(runs) {
  const ids = /* @__PURE__ */ new Set();
  for (const run of runs ?? []) {
    const id = run.sessionId;
    if (typeof id === "string" && id !== "") ids.add(id);
  }
  return ids;
}
var AUTOMATION_TITLE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
function isAutomationSidebarSession(id, item, scheduledIds = /* @__PURE__ */ new Set()) {
  if (id.startsWith(AUTOMATION_SESSION_PREFIX) || scheduledIds.has(id)) return true;
  const title = String(item?.title ?? item?.displayTitle ?? "");
  return AUTOMATION_TITLE_RE.test(title);
}
function isNativeTaskSession(item, scheduledIds = /* @__PURE__ */ new Set()) {
  if (item === void 0 || item.blank === true) return false;
  if (item.origin === "im" || item.origin === "subagent") return false;
  const id = item.id ?? "";
  if (id.startsWith("im:")) return false;
  if (isAutomationSidebarSession(id, item, scheduledIds)) return false;
  return true;
}
function groupNativeTaskSessions(sessions, workspaces, ungroupedLabel, scheduledIds = /* @__PURE__ */ new Set()) {
  const byId = sessions.byId ?? {};
  const archived = new Set(workspaces?.archivedSessionIds ?? []);
  const assigned = /* @__PURE__ */ new Set();
  const groups = [];
  for (const workspace of workspaces?.items ?? []) {
    const items = (workspace.sessionIds ?? []).map((id) => byId[id]).filter((item) => item !== void 0 && item.id !== void 0 && isNativeTaskSession(item, scheduledIds) && !archived.has(item.id));
    for (const item of items) {
      if (item.id !== void 0) assigned.add(item.id);
    }
    if (items.length > 0) {
      groups.push({
        id: workspace.workspaceId ?? workspace.id ?? workspace.path ?? workspace.title ?? "workspace",
        label: workspace.title || workspace.path || ungroupedLabel,
        sessions: items
      });
    }
  }
  const ungrouped = (sessions.ids ?? []).map((id) => byId[id]).filter((item) => item !== void 0 && item.id !== void 0 && !assigned.has(item.id) && isNativeTaskSession(item, scheduledIds) && !archived.has(item.id));
  if (ungrouped.length > 0) groups.push({ id: "", label: ungroupedLabel, sessions: ungrouped });
  return groups;
}
function readNativeSidebarTab(raw) {
  if (raw === "channels" || raw === "schedule" || raw === "tasks") return raw;
  return "tasks";
}
function shouldFollowSessionTab(previousCurrent, current) {
  const prev = previousCurrent ?? "";
  const next = current ?? "";
  return next !== "" && prev !== next;
}
function ownedSidebarTabIds(input) {
  const ids = ["tasks"];
  for (const id of input.extraTabIds) {
    if (id === "" || id === "tasks" || id === "schedule" || ids.includes(id)) continue;
    ids.push(id);
  }
  if (input.channelsReady && !ids.includes("channels")) ids.push("channels");
  ids.push("schedule");
  return ids;
}
function resolveVisibleSidebarTab(input) {
  if (input.extraTabIds.includes(input.tab)) return input.tab;
  if (input.tab === "channels" && !input.channelsReady) return "tasks";
  return input.tab;
}
function tabForSessionId(sessionId, scheduledIds) {
  if (sessionId === void 0 || sessionId === null || sessionId === "") return void 0;
  if (scheduledIds !== void 0 ? scheduledIds.has(sessionId) : sessionId.startsWith(AUTOMATION_SESSION_PREFIX)) return "schedule";
  if (sessionId.startsWith("im:")) return "channels";
  return void 0;
}
function occupantLooksLikeCodexUi(value) {
  return /dsh-codex-ui|michengai-codex-ui|michengai\.codexUi|codex-ui/i.test(String(value ?? ""));
}
function slotOccupantName(item) {
  const record = item;
  return String(
    record?.options?.locale ?? record?.options?.id ?? record?.options?.name ?? record?.options?.registrant ?? record?.component?.displayName ?? record?.component?.name ?? record?.id ?? record?.name ?? ""
  );
}
function hasCodexUiSidebar(entries) {
  return (entries ?? []).some((item) => occupantLooksLikeCodexUi(slotOccupantName(item)));
}
var taskFilterCache = /* @__PURE__ */ new WeakMap();
var workspaceFilterCache = /* @__PURE__ */ new WeakMap();
function scheduledCacheKey(scheduledIds) {
  if (scheduledIds.size === 0) return "";
  return [...scheduledIds].sort().join("\0");
}
function filterTaskSessionState(state, scheduledIds = /* @__PURE__ */ new Set()) {
  const src = state ?? { ids: [], byId: {}, current: null };
  const key = scheduledCacheKey(scheduledIds);
  if (typeof src === "object" && src !== null) {
    const hit = taskFilterCache.get(src);
    if (hit !== void 0 && hit.key === key) return hit.result;
  }
  const ids = (src.ids ?? []).filter((id) => {
    const value = String(id);
    return !value.startsWith("im:") && !isAutomationSidebarSession(value, src.byId?.[value], scheduledIds);
  });
  const unchanged = ids.length === (src.ids ?? []).length;
  const result = unchanged ? src : { ...src, ids, byId: Object.fromEntries(ids.map((id) => [id, src.byId?.[id]]).filter((entry) => entry[1] !== void 0)) };
  if (typeof src === "object" && src !== null) taskFilterCache.set(src, { key, result });
  return result;
}
function openScheduledSession(id, openRuntime, openHost) {
  if (id === "") return false;
  const attempts = id.startsWith(AUTOMATION_SESSION_PREFIX) || id.startsWith("im:") ? [openRuntime, openHost] : [openHost, openRuntime];
  for (const attempt of attempts) {
    if (typeof attempt !== "function") continue;
    try {
      attempt(id);
      return true;
    } catch {
    }
  }
  return false;
}
async function ensureOpenScheduledSession(input) {
  const id = input.id.trim();
  if (id === "") return false;
  await input.adopt?.(id).catch(() => void 0);
  const listed = () => input.listed?.(id) === true;
  if (!listed() && input.refresh !== void 0) {
    await input.refresh().catch(() => void 0);
  }
  if (openScheduledSession(id, input.openRuntime, input.openHost)) return true;
  if (input.refresh !== void 0) {
    await input.refresh().catch(() => void 0);
  }
  return openScheduledSession(id, input.openRuntime, input.openHost);
}
function isHiddenSidebarSessionId(id, scheduledIds = /* @__PURE__ */ new Set()) {
  return id.startsWith("im:") || isAutomationSidebarSession(id, void 0, scheduledIds);
}
function filterWorkspaceListState(state, scheduledIds = /* @__PURE__ */ new Set()) {
  const src = state ?? { items: [], archivedSessionIds: [] };
  const key = scheduledCacheKey(scheduledIds);
  if (typeof src === "object" && src !== null) {
    const hit = workspaceFilterCache.get(src);
    if (hit !== void 0 && hit.key === key) return hit.result;
  }
  let changed = false;
  const items = (src.items ?? []).map((workspace) => {
    const sessionIds = (workspace.sessionIds ?? []).filter((sid) => !isHiddenSidebarSessionId(String(sid), scheduledIds));
    if (sessionIds.length !== (workspace.sessionIds ?? []).length) {
      changed = true;
      return { ...workspace, sessionIds };
    }
    return workspace;
  });
  const result = changed ? { ...src, items } : src;
  if (typeof src === "object" && src !== null) workspaceFilterCache.set(src, { key, result });
  return result;
}
function wrapperFlags(component) {
  if (component === void 0 || component === null || typeof component !== "function" && typeof component !== "object") return {};
  return component;
}
function isOwnAutomationWrapper(component) {
  return wrapperFlags(component).__dshAutomationWrapped === true;
}
function resolveOfficialTreeComponent(component) {
  const seen = /* @__PURE__ */ new Set();
  let current = component;
  while (current !== void 0 && current !== null && !seen.has(current)) {
    seen.add(current);
    const flags = wrapperFlags(current);
    const next = flags.__dshAutomationOriginal ?? flags.__imConnectOriginal;
    if (next !== void 0 && next !== current) {
      current = next;
      continue;
    }
    if (flags.__dshAutomationWrapped === true || flags.__imConnectWrapped === true) return void 0;
    return current;
  }
  return void 0;
}
function isAutomationWorkspaceWrapper(item) {
  const record = item;
  const id = String(record?.options?.id ?? "");
  const name2 = String(record?.component?.displayName ?? record?.component?.name ?? "");
  return id === "dsh-automation-native-switcher" || id === "dsh-automation-wrap-bump" || name2 === "AutomationNativeWorkspaceShell" || name2 === "AutomationWrapBump" || isOwnAutomationWrapper(record?.component);
}
function pickWrappableWorkspacesEntry(entries) {
  for (const item of entries) {
    const record = item;
    if (record?.component === void 0) continue;
    if (isAutomationWorkspaceWrapper(item)) continue;
    return item;
  }
  return void 0;
}
function applyWorkspaceBrowserQuery(groups, query, sort, groupMode = "workspace") {
  const needle = query.trim().toLocaleLowerCase();
  const filtered = groups.map((group) => {
    if (needle === "") return group;
    if (group.name.toLocaleLowerCase().includes(needle)) return group;
    const sessions = group.sessions.filter((session) => `${session.title ?? ""} ${session.label ?? ""}`.toLocaleLowerCase().includes(needle));
    return { ...group, sessions };
  }).filter((group) => group.sessions.length > 0 || needle !== "" && group.name.toLocaleLowerCase().includes(needle));
  if (groupMode === "list") {
    const sessions = filtered.flatMap((group) => [...group.sessions]);
    if (sort === "time") sessions.sort((left, right) => sessionTime(right) - sessionTime(left));
    return sessions.length === 0 ? [] : [{ ...filtered[0], name: "", sessions }];
  }
  if (sort === "manual") return filtered;
  return [...filtered].sort((left, right) => latestSessionTime(right) - latestSessionTime(left));
}
function sessionTime(session) {
  const ts = Date.parse(session.updatedAt ?? "");
  return Number.isFinite(ts) ? ts : 0;
}
function latestSessionTime(group) {
  let latest = 0;
  for (const session of group.sessions) {
    const ts = sessionTime(session);
    if (ts > latest) latest = ts;
  }
  return latest;
}

// src/client/workspace-toolbar.tsx
var import_react5 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function officialSearchIconSize(expanded) {
  return expanded ? 11 : 14;
}
function WorkspaceToolbar({
  t,
  query,
  sort,
  groupMode,
  onQueryChange,
  onSortChange,
  onGroupModeChange
}) {
  const [searching, setSearching] = (0, import_react5.useState)(query.trim() !== "");
  const [filterOpen, setFilterOpen] = (0, import_react5.useState)(false);
  const inputRef = (0, import_react5.useRef)(null);
  const rootRef = (0, import_react5.useRef)(null);
  const searchSize = officialSearchIconSize(searching);
  (0, import_react5.useEffect)(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);
  (0, import_react5.useEffect)(() => {
    if (!filterOpen) return;
    const close = (event) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen]);
  const openSearch = () => {
    setFilterOpen(false);
    setSearching(true);
  };
  const closeSearch = () => {
    onQueryChange("");
    setSearching(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: searching ? "dsh-st-n-toolbar is-search" : "dsh-st-n-toolbar", ref: rootRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dsh-st-n-head-label", children: t("sidebar.workspaces") }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dsh-st-n-search-slot", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dsh-st-n-search", onClick: openSearch, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dsh-st-n-search-btn", "aria-label": t("sidebar.search"), "aria-expanded": searching, onClick: openSearch, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SearchOutlineIcon, { width: searchSize, height: searchSize }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { ref: inputRef, className: "dsh-st-n-search-input", value: query, placeholder: t("sidebar.searchSessions"), "aria-label": t("sidebar.searchSessions"), tabIndex: searching ? 0 : -1, "aria-hidden": !searching, onChange: (event) => onQueryChange(event.target.value), onKeyDown: (event) => {
        if (event.key === "Escape") closeSearch();
      } }),
      searching && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "dsh-st-n-search-clear", "aria-label": t("sidebar.clearSearch"), onClick: (event) => {
        event.stopPropagation();
        closeSearch();
      }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CloseOutlineIcon, { width: 14, height: 14 }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dsh-st-n-head-acts", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dsh-st-n-head-filter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: filterOpen ? "dsh-st-n-head-btn is-on" : "dsh-st-n-head-btn", "aria-label": t("sidebar.filter"), "aria-expanded": filterOpen, onClick: () => setFilterOpen((open) => !open), children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SlidersIcon, { width: 16, height: 16 }) }),
      filterOpen && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dsh-st-n-filter-menu", role: "menu", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dsh-st-n-filter-label", children: t("sidebar.groupBy") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FilterRow, { label: t("sidebar.groupWorkspace"), selected: groupMode === "workspace", onSelect: () => {
          onGroupModeChange("workspace");
          setFilterOpen(false);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FilterRow, { label: t("sidebar.groupList"), selected: groupMode === "list", onSelect: () => {
          onGroupModeChange("list");
          setFilterOpen(false);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dsh-st-n-filter-split" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dsh-st-n-filter-label", children: t("sidebar.sortBy") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FilterRow, { label: t("sidebar.sortManual"), selected: sort === "manual", onSelect: () => {
          onSortChange("manual");
          setFilterOpen(false);
        } }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FilterRow, { label: t("sidebar.sortTime"), selected: sort === "time", onSelect: () => {
          onSortChange("time");
          setFilterOpen(false);
        } })
      ] })
    ] }) })
  ] });
}
function FilterRow({
  label,
  selected,
  onSelect
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", role: "menuitemradio", "aria-checked": selected, className: selected ? "is-on" : void 0, onClick: onSelect, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: label }),
    selected ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CheckOutlineIcon, { width: 16, height: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dsh-st-n-filter-tick" })
  ] });
}

// src/client/native-session-list.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var EMPTY_SESSION_BY_ID = {};
function NativeScheduleSessionList(props) {
  const { t, runtime, openSession, useSessions, useWorkspaces, renameSession, archiveSession, forkSession } = props;
  const state = (0, import_react6.useSyncExternalStore)(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot);
  const selectedId = useSessions ? useSessions((snap) => snap?.current ?? null) : null;
  const sessionById = useSessions ? useSessions((snap) => snap?.byId ?? EMPTY_SESSION_BY_ID) : EMPTY_SESSION_BY_ID;
  const archivedIds = useWorkspaces ? useWorkspaces((snap) => snap?.archivedSessionIds ?? []) : [];
  const [folded, setFolded] = (0, import_react6.useState)({});
  const [openMenu, setOpenMenu] = (0, import_react6.useState)(null);
  const [query, setQuery] = (0, import_react6.useState)("");
  const [sort, setSort] = (0, import_react6.useState)("time");
  const [groupMode, setGroupMode] = (0, import_react6.useState)("workspace");
  const archived = (0, import_react6.useMemo)(() => new Set(archivedIds), [archivedIds]);
  const listedIds = useSessions ? useSessions((snap) => Array.isArray(snap?.ids) ? snap.ids : void 0) : void 0;
  const presentIds = (0, import_react6.useMemo)(() => {
    if (listedIds !== void 0) return new Set(listedIds);
    const keys = Object.keys(sessionById);
    return keys.length > 0 ? new Set(keys) : void 0;
  }, [listedIds, sessionById]);
  const groups = (0, import_react6.useMemo)(() => {
    const snapshot = state.snapshot;
    if (snapshot === void 0) return [];
    return groupScheduledSessions(snapshot.automations, snapshot.runs).map((group) => ({
      ...group,
      sessions: group.sessions.filter((session) => keepScheduledSessionLink(session.id, archived, presentIds)).map((session) => {
        const run = snapshot.runs.find((item) => item.sessionId === session.id);
        return {
          ...session,
          title: formatRunStamp(run && (run.startedAt || run.scheduledFor) || ""),
          updatedAt: run && (run.startedAt || run.scheduledFor) || "",
          running: session.running || sessionById[session.id]?.running === true
        };
      })
    })).filter((group) => group.sessions.length > 0);
  }, [archived, presentIds, sessionById, state.snapshot]);
  const visibleGroups = (0, import_react6.useMemo)(() => applyWorkspaceBrowserQuery(groups.map((group) => ({ ...group, name: group.name })), query, sort, groupMode), [groups, query, sort, groupMode]);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-st-n", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(WorkspaceToolbar, { t, query, sort, groupMode, onQueryChange: setQuery, onSortChange: setSort, onGroupModeChange: setGroupMode }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-st-n-tree", role: "tree", children: [
      state.phase === "loading" && visibleGroups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-st-n-empty", children: t("loading") }),
      visibleGroups.length === 0 && state.phase !== "loading" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-st-n-empty", children: t("sidebar.empty") }),
      visibleGroups.map((group) => {
        const expanded = folded[group.id] !== true;
        return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-st-n-group", children: [
          groupMode === "workspace" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-st-n-row", role: "treeitem", "aria-expanded": expanded, onClick: () => setFolded((current) => ({ ...current, [group.id]: expanded })), children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-slot dsh-st-n-folder", children: expanded ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FolderOpenIcon, { width: 16, height: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FolderClosedIcon, { width: 16, height: 16 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-title", children: group.name })
          ] }),
          (groupMode === "list" || expanded) && group.sessions.map((session) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            NativeSessionRow,
            {
              t,
              id: session.id,
              title: session.title,
              hoverTitle: String(sessionById[session.id]?.displayTitle ?? sessionById[session.id]?.title ?? group.name),
              updatedAt: session.updatedAt,
              running: session.running,
              selected: selectedId === session.id,
              menuOpen: openMenu?.id === session.id,
              menuPoint: openMenu === null || openMenu.id !== session.id ? { x: 8, y: 8 } : { x: openMenu.x, y: openMenu.y },
              onToggleMenu: (event) => setOpenMenu((current) => nextOpenSessionMenu(current, session.id, pointerPoint(event))),
              onCloseMenu: () => setOpenMenu((current) => current?.id === session.id ? null : current),
              onOpen: () => {
                setOpenMenu(null);
                openSession?.(session.id);
              },
              ...renameSession === void 0 ? {} : { renameSession },
              ...archiveSession === void 0 ? {} : { archiveSession },
              ...forkSession === void 0 ? {} : { forkSession }
            },
            session.id
          ))
        ] }, group.id);
      })
    ] })
  ] });
}
function NativeSessionRow(props) {
  const { t, id, title, hoverTitle, updatedAt, running, selected, menuOpen, menuPoint, onToggleMenu, onCloseMenu, onOpen, renameSession, archiveSession, forkSession } = props;
  const rowRef = (0, import_react6.useRef)(null);
  const menuRef = (0, import_react6.useRef)(null);
  const hoverRef = (0, import_react6.useRef)(null);
  const [hoverOpen, setHoverOpen] = (0, import_react6.useState)(false);
  const [hoverStyle, setHoverStyle] = (0, import_react6.useState)({});
  const hoverTimer = (0, import_react6.useRef)(void 0);
  const [renaming, setRenaming] = (0, import_react6.useState)(false);
  const [draft, setDraft] = (0, import_react6.useState)(title);
  const [menuStyle, setMenuStyle] = (0, import_react6.useState)({});
  (0, import_react6.useEffect)(() => {
    setDraft(title);
  }, [title]);
  (0, import_react6.useEffect)(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (!shouldCloseNativeSessionMenu(event.target, [rowRef.current, menuRef.current])) return;
      onCloseMenu();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onCloseMenu();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, onCloseMenu]);
  (0, import_react6.useLayoutEffect)(() => {
    if (!menuOpen) return;
    const update = () => {
      const el = menuRef.current;
      const size = el === null ? { width: 218, height: 176 } : { width: el.offsetWidth, height: el.offsetHeight };
      setMenuStyle(nativeSessionMenuStyle(menuPoint, size, { width: window.innerWidth, height: window.innerHeight }));
    };
    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [menuOpen, menuPoint]);
  (0, import_react6.useEffect)(() => {
    if (!hoverOpen || menuOpen) return;
    const update = () => {
      const row = rowRef.current?.getBoundingClientRect();
      const card = hoverRef.current;
      if (row === void 0) return;
      const size = card === null ? { width: 220, height: 96 } : { width: card.offsetWidth, height: card.offsetHeight };
      setHoverStyle(nativeSessionHoverStyle({ right: row.right, top: row.top }, size, { width: window.innerWidth, height: window.innerHeight }));
    };
    update();
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [hoverOpen, menuOpen, title, updatedAt, running]);
  (0, import_react6.useEffect)(() => () => {
    if (hoverTimer.current !== void 0) window.clearTimeout(hoverTimer.current);
  }, []);
  const run = (action) => {
    void Promise.resolve(action()).catch(() => void 0);
  };
  const showHover = () => {
    if (menuOpen) return;
    if (hoverTimer.current !== void 0) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoverOpen(true), 500);
  };
  const hideHover = () => {
    if (hoverTimer.current !== void 0) window.clearTimeout(hoverTimer.current);
    setHoverOpen(false);
  };
  const rowClass = "dsh-st-n-sess" + (selected ? " is-on" : "") + (menuOpen ? " is-menu" : "");
  if (renaming) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: rowClass, ref: rowRef, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { className: "dsh-st-n-rename", value: draft, autoFocus: true, "aria-label": t("session.rename"), onChange: (event) => setDraft(event.target.value), onClick: (event) => event.stopPropagation(), onKeyDown: (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setRenaming(false);
        if (draft.trim() !== "" && draft.trim() !== title) run(() => renameSession?.(id, draft.trim()));
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setRenaming(false);
        setDraft(title);
      }
    }, onBlur: () => {
      setRenaming(false);
      if (draft.trim() !== "" && draft.trim() !== title) run(() => renameSession?.(id, draft.trim()));
    } }) });
  }
  const menuItems = [
    { id: "rename", label: t("session.rename"), icon: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PencilIcon, { width: 16, height: 16 }), go: () => {
      setRenaming(true);
    } },
    { id: "fork", label: t("session.fork"), icon: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(BranchIcon, { width: 16, height: 16 }), go: () => run(() => forkSession?.(id)) },
    { id: "archive", label: t("session.archive"), icon: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ArchiveIcon, { width: 16, height: 16 }), go: () => run(() => archiveSession?.(id)) }
  ];
  const menu = menuOpen && typeof document !== "undefined" ? (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { ref: menuRef, className: "dsh-st-n-menu is-float", "data-n-menu": id, style: menuStyle, onMouseDown: (event) => event.stopPropagation(), onClick: (event) => event.stopPropagation(), children: menuItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", className: void 0, onClick: () => {
      onCloseMenu();
      item.go();
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-mi", children: item.icon }),
      item.label
    ] }, item.id)) }),
    document.body
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: rowClass, ref: rowRef, role: "treeitem", tabIndex: 0, "aria-selected": selected, "data-n-menu-root": id, onClick: onOpen, onMouseEnter: showHover, onMouseLeave: hideHover, onKeyDown: (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }, onContextMenu: (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleMenu(event);
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-slot", children: running ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RunningStateDot, {}) : null }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-title", children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-time", children: relativeTime(updatedAt, t) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dsh-st-n-acts", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "dsh-st-n-ico", "aria-label": title + " \u66F4\u591A", onMouseDown: (event) => event.stopPropagation(), onClick: (event) => {
      event.stopPropagation();
      hideHover();
      onToggleMenu(event);
    }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(EllipsisIcon, { width: 16, height: 16 }) }) }),
    menu,
    hoverOpen && !menuOpen && typeof document !== "undefined" && (0, import_react_dom2.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { ref: hoverRef, className: "dsh-st-n-hover", style: hoverStyle, onMouseEnter: showHover, onMouseLeave: hideHover, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-st-n-hover-title", children: (hoverTitle ?? title).trim() || title }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dsh-st-n-hover-time", children: relativeTime(updatedAt, t) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dsh-st-n-hover-state", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: running ? "dsh-st-n-hover-dot is-run" : "dsh-st-n-hover-dot" }),
          running ? t("session.runningStatus") : t("session.idle")
        ] })
      ] }),
      document.body
    )
  ] });
}

// src/client/ScheduleRail.tsx
var import_react7 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
var EMPTY_EXTRA_TABS = [];
var noopSubscribe = (_listener) => () => void 0;
var OfficialTreeGuard = class extends import_react7.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn("[dsh-automation] official workspace tree crashed", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
};
function ScheduleRail({
  t,
  runtime,
  openSession
}) {
  const state = (0, import_react7.useSyncExternalStore)(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot);
  const [folded, setFolded] = (0, import_react7.useState)({});
  const groups = (0, import_react7.useMemo)(() => {
    const snapshot = state.snapshot;
    if (snapshot === void 0) return [];
    return groupScheduledSessions(snapshot.automations, snapshot.runs);
  }, [state.snapshot]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dsh-st-rail", children: [
    state.phase === "loading" && groups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-rail-empty", children: t("loading") }),
    groups.length === 0 && state.phase !== "loading" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-rail-empty", children: t("sidebar.empty") }),
    groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "dsh-st-rail-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          type: "button",
          className: "dsh-st-rail-head",
          onClick: () => setFolded((current) => ({ ...current, [group.id]: !current[group.id] })),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dsh-st-rail-folder", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ClockIcon, { width: 16, height: 16 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dsh-st-rail-title", children: group.name })
          ]
        }
      ),
      folded[group.id] !== true && group.sessions.map((session) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          type: "button",
          className: "dsh-st-rail-session",
          onClick: () => openSession?.(session.id),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: session.label }),
            session.running && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(RunningStateDot, {})
          ]
        },
        session.id
      ))
    ] }, group.id))
  ] });
}
function NativeScheduleShell({
  t,
  runtime,
  officialTree,
  hostProps,
  openSession,
  useSessions,
  useWorkspaces,
  renderSlot,
  hasChannels,
  subscribeChannels,
  tabRegistry,
  wide
}) {
  const Official = officialTree;
  const [tab, setTab] = (0, import_react7.useState)(() => {
    try {
      return readNativeSidebarTab(window.localStorage.getItem(NATIVE_SIDEBAR_TAB_KEY));
    } catch {
      return "tasks";
    }
  });
  const extraTabs = (0, import_react7.useSyncExternalStore)(
    tabRegistry?.subscribe ?? noopSubscribe,
    () => tabRegistry?.getTabs() ?? EMPTY_EXTRA_TABS,
    () => EMPTY_EXTRA_TABS
  );
  const channelsReady = (0, import_react7.useSyncExternalStore)(
    subscribeChannels ?? noopSubscribe,
    () => {
      try {
        return hasChannels?.() === true;
      } catch {
        return false;
      }
    },
    () => false
  );
  const currentId = useSessions?.((state) => state?.current ?? null);
  const automationState = (0, import_react7.useSyncExternalStore)(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot);
  const scheduledIds = (0, import_react7.useMemo)(() => collectScheduledSessionIds(automationState.snapshot?.runs), [automationState.snapshot]);
  const useFilteredSessions = (0, import_react7.useCallback)((selector, eq) => {
    if (useSessions === void 0) return selector({ ids: [], byId: {}, current: null });
    return useSessions((state) => selector(filterTaskSessionState(state, scheduledIds)), eq);
  }, [useSessions, scheduledIds]);
  const useFilteredWorkspaces = (0, import_react7.useCallback)((selector, eq) => {
    if (useWorkspaces === void 0) return selector({ items: [], archivedSessionIds: [] });
    return useWorkspaces((state) => selector(filterWorkspaceListState(state, scheduledIds)), eq);
  }, [useWorkspaces, scheduledIds]);
  (0, import_react7.useEffect)(() => {
    try {
      window.localStorage.setItem(NATIVE_SIDEBAR_TAB_KEY, tab);
    } catch {
    }
  }, [tab]);
  const previousCurrentId = (0, import_react7.useRef)(currentId);
  const tabFollowReady = (0, import_react7.useRef)(false);
  (0, import_react7.useEffect)(() => {
    if (!tabFollowReady.current) {
      tabFollowReady.current = true;
      previousCurrentId.current = currentId;
      return;
    }
    const previous = previousCurrentId.current;
    previousCurrentId.current = currentId;
    if (!shouldFollowSessionTab(previous, currentId)) return;
    const next = tabForSessionId(currentId ?? void 0, scheduledIds);
    const extraIds = extraTabs.map((item) => item.id);
    if (next === "channels" && (channelsReady || extraIds.includes("channels"))) setTab("channels");
    const matched = extraTabs.find((item) => currentId !== void 0 && currentId !== null && item.matchSession?.(String(currentId)) === true);
    if (matched !== void 0 && matched.id !== "schedule") setTab(matched.id);
  }, [currentId, channelsReady, extraTabs, scheduledIds]);
  const rawOfficialProps = { ...hostProps ?? {}, ...wide === void 0 ? {} : { wide } };
  const filteredOfficialProps = {
    ...rawOfficialProps,
    ...useSessions === void 0 ? {} : { useSessions: useFilteredSessions },
    ...useWorkspaces === void 0 ? {} : { useWorkspaces: useFilteredWorkspaces }
  };
  const renderOfficial = (props) => {
    if (Official === void 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(NativeTaskRail, { t, ...openSession === void 0 ? {} : { openSession }, ...useSessions === void 0 ? {} : { useSessions: useFilteredSessions }, ...useWorkspaces === void 0 ? {} : { useWorkspaces } });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OfficialTreeGuard, { fallback: (0, import_react7.createElement)(Official, rawOfficialProps), children: (0, import_react7.createElement)(Official, props) });
  };
  if (wide === false) return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children: renderOfficial(filteredOfficialProps) });
  const foreignTabs = extraTabs.filter((item) => item.id !== "schedule");
  const visibleTab = resolveVisibleSidebarTab({
    tab,
    channelsReady,
    extraTabIds: ownedSidebarTabIds({ extraTabIds: foreignTabs.map((item) => item.id), channelsReady })
  });
  const hostedSchedule = extraTabs.find((item) => item.id === "schedule");
  const scheduleBody = hostedSchedule === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(NativeScheduleSessionList, { t, runtime, ...openSession === void 0 ? {} : { openSession }, ...useSessions === void 0 ? {} : { useSessions }, ...useWorkspaces === void 0 ? {} : { useWorkspaces } }) : hostedSchedule.render({ ...hostProps ?? {}, openSession, open: openSession, useSessions, wide: true });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dsh-st-shell-rail", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dsh-st-shell-tabs", role: "tablist", "aria-label": t("sidebar.tabs"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", role: "tab", "aria-selected": visibleTab === "tasks", className: visibleTab === "tasks" ? "is-on" : void 0, onClick: () => setTab("tasks"), children: t("sidebar.tasksTab") }),
      foreignTabs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", role: "tab", "aria-selected": visibleTab === item.id, className: visibleTab === item.id ? "is-on" : void 0, onClick: () => setTab(item.id), children: item.label }, item.id)),
      channelsReady && foreignTabs.every((item) => item.id !== "channels") && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", role: "tab", "aria-selected": visibleTab === "channels", className: visibleTab === "channels" ? "is-on" : void 0, onClick: () => setTab("channels"), children: t("sidebar.channelsTab") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", role: "tab", "aria-selected": visibleTab === "schedule", className: visibleTab === "schedule" ? "is-on" : void 0, onClick: () => setTab("schedule"), children: t("sidebar.tab") })
    ] }),
    visibleTab === "schedule" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-shell-body", children: scheduleBody }) : foreignTabs.find((item) => item.id === visibleTab) !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-shell-body", children: foreignTabs.find((item) => item.id === visibleTab)?.render({ ...hostProps ?? {}, openSession, open: openSession, useSessions, wide: true }) }) : visibleTab === "channels" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-shell-body", children: renderSlot?.("sidebar.channels", { ...hostProps ?? {}, openSession, open: openSession, useSessions, wide: true, skin: "native" }) }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-official-tree", children: renderOfficial(filteredOfficialProps) })
  ] });
}
function NativeTaskRail({
  t,
  openSession,
  useSessions,
  useWorkspaces
}) {
  const snap = useSessions === void 0 ? { ids: [], byId: {}, current: null } : useSessions((state) => state ?? { ids: [], byId: {}, current: null });
  const workspaces = useWorkspaces === void 0 ? void 0 : useWorkspaces((state) => state ?? { items: [], archivedSessionIds: [] });
  const groups = groupNativeTaskSessions(snap, workspaces, t("sidebar.ungrouped"));
  if (groups.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-rail-empty", children: t("sidebar.tasksEmpty") });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-rail", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "dsh-st-rail-group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dsh-st-rail-head is-static", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dsh-st-rail-title", children: group.label }) }),
    group.sessions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "button",
      {
        type: "button",
        className: `dsh-st-rail-session${snap.current === item.id ? " is-on" : ""}`,
        onClick: () => {
          if (item.id !== void 0) openSession?.(item.id);
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: item.title || item.id })
      },
      item.id
    ))
  ] }, group.id || "ungrouped")) });
}

// src/client/styles.ts
var STYLE_ID = "dsh-automation-styles";
var CSS_TEXT = `
.dsh-st-shell{box-sizing:border-box;max-width:1080px;width:100%;margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:12px}
.dsh-st-heading h1,.dsh-st-top h1{margin:0;font-size:20px;line-height:28px;font-weight:650;letter-spacing:-.2px}
.dsh-st-heading p,.dsh-st-top p{margin:4px 0 0;max-width:none;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.dsh-st-toolbar{display:flex;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:8px}
.dsh-st-search{flex:1;min-width:0;max-width:280px;height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-1));color:inherit;font:inherit;font-size:13px}
.dsh-st-btn,.dsh-st-icon{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.dsh-st-icon{width:32px;padding:0;flex:none}
.dsh-st-btn--primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,#fff);color:var(--dsw-alias-label-primary-foreground,#111)}
.dsh-st-btn--danger{border-color:var(--dsw-alias-state-error-primary,#f85149);background:var(--dsw-alias-state-error-primary,#f85149);color:#fff}
.dsh-st-hint{margin:-6px 0 14px;padding:10px 12px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:16px;padding:10px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-banner>span{display:inline-flex;align-items:flex-start;gap:8px}
.dsh-st-switch{width:42px;height:26px;border:0;border-radius:999px;background:rgba(120,120,128,.36);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);position:relative;cursor:pointer}
.dsh-st-switch:after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .16s ease}
.dsh-st-switch.is-on{background:#34c759}
.dsh-st-switch.is-on:after{transform:translateX(16px)}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03));color:inherit;text-align:left;cursor:pointer}
.dsh-st-example:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;gap:16px;margin:4px 0 16px}
.dsh-st-tabs>button{padding:8px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dsh-st-tabs>button.is-on{border-bottom-color:currentColor;color:var(--dsw-alias-label-primary);font-weight:650}
.dsh-st-dropdown{position:relative;min-width:0}
.dsh-st-sort{margin-left:auto}
.dsh-st-dropdown-btn{display:inline-flex;align-items:center;gap:4px;max-width:220px;height:28px;padding:0 10px;border:0;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.14));color:var(--dsw-alias-label-primary,inherit);font:13px/20px inherit;cursor:pointer;white-space:nowrap}
.dsh-st-dropdown-btn:hover,.dsh-st-dropdown-btn.is-open{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.18))}
.dsh-st-dropdown-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-dropdown-chevron{flex:none;transition:transform .16s ease;transform:rotate(90deg)}
.dsh-st-dropdown-btn.is-open .dsh-st-dropdown-chevron{transform:rotate(-90deg)}
.dsh-st-dropdown-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;width:180px;max-height:260px;overflow:auto;padding:6px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-alias-bg-layer-3,#303033);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.32))}
.dsh-st-dropdown-menu button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:36px;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:13px/20px inherit;cursor:pointer;text-align:left}
.dsh-st-dropdown-menu button>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-dropdown-menu button:hover,.dsh-st-dropdown-menu button.is-selected{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-sort-tick{width:16px;height:16px;flex:none}
.dsh-st-filters{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-left:auto}
.dsh-st-filters>button{height:28px;padding:0 10px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:inherit;font-size:12px}
.dsh-st-filters>button.is-on{background:rgba(255,255,255,.14)}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03))}
.dsh-st-card{cursor:pointer}
.dsh-st-card:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:14px;font-weight:500}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
.dsh-st-more{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsh-st-menu{position:absolute;top:40px;right:12px;z-index:3;min-width:148px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.dsh-st-menu button{display:flex;width:100%;align-items:center;gap:8px;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-menu button svg{flex:none}
.dsh-st-menu button:hover{background:rgba(255,255,255,.06)}
.dsh-st-menu .is-danger{color:#ff6b6b}
.dsh-st-timeline{display:flex;flex-direction:column;gap:22px;padding-left:10px}
.dsh-st-group{position:relative;padding-left:18px}
.dsh-st-group:before{content:'';position:absolute;top:8px;bottom:0;left:4px;width:1px;background:rgba(255,255,255,.08)}
.dsh-st-group h3{margin:0 0 10px;font-size:13px;font-weight:600}
.dsh-st-run{position:relative;margin:0 0 12px}
.dsh-st-run:after{content:'';position:absolute;top:6px;left:-18px;width:7px;height:7px;border-radius:50%;background:#34c759}
.dsh-st-run.is-failed:after,.dsh-st-run.is-interrupted:after{background:#ff6b6b}
.dsh-st-run.is-queued:after,.dsh-st-run.is-skipped:after,.dsh-st-run.is-cancelled:after{background:#8b8f98}
.dsh-st-run strong{display:block;margin-bottom:4px;font-size:14px}
.dsh-st-run p{display:flex;gap:10px;margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-error{color:#ff6b6b;font-size:12px}
.dsh-st-muted{color:var(--dsw-alias-label-secondary)}
.dsh-st-mask{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;background:rgba(0,0,0,.45)}.dsh-st-flyout-root{position:absolute;inset:0;z-index:1200;overflow:visible;pointer-events:none}.dsh-st-flyout-root .dsh-st-select-menu,.dsh-st-flyout-root .dsh-st-model-select-menu{pointer-events:auto}
.dsh-st-modal,.dsh-st-modal *{box-sizing:border-box}.dsh-st-modal{display:flex;flex-direction:column;width:min(760px,calc(100vw - 48px));max-width:100%;max-height:min(92vh,900px);overflow:hidden;padding:24px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;background:var(--dsw-alias-bg-base)}
.dsh-st-confirm-modal,.dsh-st-confirm-modal *{box-sizing:border-box}.dsh-st-confirm-modal{width:min(420px,calc(100vw - 48px));padding:24px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;background:var(--dsw-alias-bg-base);box-shadow:var(--dsw-shadow-lv3,0 12px 36px rgba(0,0,0,.36))}.dsh-st-confirm-modal h2{margin:0 0 10px;font-size:18px}.dsh-st-confirm-modal p{margin:0 0 8px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}.dsh-st-confirm-modal .dsh-st-confirm-target{color:var(--dsw-alias-label-primary);font-weight:600;overflow-wrap:anywhere}
.dsh-st-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dsh-st-modal-head h2{margin:0 0 4px;font-size:20px}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;min-width:0;max-width:100%;font-size:13px}.dsh-st-field:has(.dsh-st-prompt-card){flex:1;min-height:0;margin-bottom:10px}
.dsh-st-field input,.dsh-st-field select,.dsh-st-field textarea{width:100%;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-field textarea{min-height:140px;max-width:100%;resize:vertical}
.dsh-st-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dsh-st-inline select,.dsh-st-inline input{flex:1;min-width:120px}
.dsh-st-weekdays{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.dsh-st-weekdays button{min-width:40px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-weekdays button.is-on{border-color:#4b7cff;color:#4b7cff}
.dsh-st-check{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;font-size:12px}
.dsh-st-modal-actions{display:flex;justify-content:flex-end;flex:none;gap:8px;margin-top:8px}
@media(max-width:860px){.dsh-st-toolbar{flex-wrap:wrap}.dsh-st-search{flex-basis:100%;max-width:none}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-filters{width:100%;margin:8px 0}}
.dsh-st-select{position:relative;min-width:108px;z-index:1}.dsh-st-select.is-open{z-index:30}
.dsh-st-select.is-wide{min-width:148px}
.dsh-st-select-btn,.dsh-st-field input,.dsh-st-field textarea{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.04);color:inherit}
.dsh-st-select-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px;width:100%;padding:0 12px;cursor:pointer}
.dsh-st-select.is-pill{width:auto;min-width:0;flex:none}
.dsh-st-select.is-pill .dsh-st-select-btn{width:auto;min-height:28px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;gap:6px;white-space:nowrap}
.dsh-st-select.is-pill .dsh-st-select-btn:hover{background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary)}
.dsh-st-select.is-pill .dsh-st-select-menu,.dsh-st-select-menu.is-composer{min-width:260px}
.dsh-st-select-btn em{width:8px;height:8px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.dsh-st-select-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:30;min-width:196px;max-height:280px;overflow:auto;padding:6px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:#2a2c31;box-shadow:0 16px 40px rgba(0,0,0,.42)}
.dsh-st-select-menu.is-up{top:auto;bottom:calc(100% + 6px)}
.dsh-st-select-menu.is-end{left:auto;right:0}.dsh-st-select-menu.is-float{position:absolute;z-index:1200;max-height:min(280px,calc(100vh - 24px));box-sizing:border-box}
.dsh-st-menu-row{white-space:nowrap}
.dsh-st-menu-row.is-kv .dsh-st-menu-row-main{flex:none}
.dsh-st-menu-row.is-kv .dsh-st-menu-row-side{flex:1;justify-content:flex-end;min-width:0}
.dsh-st-select-menu button,.dsh-st-menu-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:inherit;text-align:left;cursor:pointer;font-size:13px}
.dsh-st-menu-row-main{display:inline-flex;align-items:center;gap:8px;min-width:0}
.dsh-st-menu-row-side{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-menu-row-side small{display:block;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.dsh-st-select-menu button:hover,.dsh-st-menu-row:hover,.dsh-st-menu-row.is-on{background:rgba(255,255,255,.06)}
.dsh-st-tick,.dsh-st-next{width:7px;height:11px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;flex:none}
.dsh-st-tick{height:12px;width:6px;transform:rotate(45deg) translateY(-2px);border-right-color:#7aa2ff;border-bottom-color:#7aa2ff}
.dsh-st-next{height:7px;transform:rotate(-45deg);opacity:.55}
.dsh-st-select-empty{padding:14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.dsh-st-chip-btn{display:inline-flex;align-items:center;gap:6px;min-height:28px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer}
.dsh-st-chip-btn:hover{background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary)}
.dsh-st-chip-btn.is-static{cursor:default;opacity:.78}
.dsh-st-chip-btn em,.dsh-st-select.is-pill .dsh-st-select-btn em{width:6px;height:6px;margin-left:2px;opacity:.55}
.dsh-st-model-select{position:relative;z-index:1;min-width:0;flex:none}.dsh-st-model-select.is-open{z-index:30}.dsh-st-model-select-trigger{display:flex;align-items:center;gap:4px;min-width:0;max-width:260px;height:28px;padding:0 4px 0 8px;border:0;border-radius:24px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer}.dsh-st-model-select-trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dsh-st-model-select-trigger>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-trigger-effort{flex:none;color:var(--dsw-alias-label-tertiary);white-space:nowrap}.dsh-st-model-trigger-chevron{flex:none;transition:transform .16s ease}.dsh-st-model-trigger-chevron.is-open{transform:rotate(180deg)}.dsh-st-model-select-menu{z-index:30;width:min(240px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-inverted,var(--dsw-alias-border-l2));border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-base));box-shadow:var(--dsw-shadow-lv3)}.dsh-st-model-select-menu.is-float{position:absolute;z-index:1200;box-sizing:border-box}.dsh-st-model-select-menu .dsh-st-menu-row{min-height:40px;padding:0 10px;border-radius:10px;font-size:14px}.dsh-st-model-select-menu .dsh-st-menu-row.is-kv .dsh-st-menu-row-side{font-size:13px;color:var(--dsw-alias-label-tertiary)}.dsh-st-model-group+.dsh-st-model-group{margin-top:4px}.dsh-st-model-group-title{position:sticky;top:0;z-index:1;padding:5px 8px 3px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-base));color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:500;line-height:18px}.dsh-st-model-option{display:flex;width:100%;min-height:38px;align-items:center;gap:8px;padding:6px 8px;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer}.dsh-st-model-option:hover,.dsh-st-model-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}.dsh-st-model-option-copy{display:flex;min-width:0;flex:1;flex-direction:column}.dsh-st-model-name{overflow:hidden;font-size:14px;font-weight:500;line-height:20px;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-description{overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-check{display:grid;flex:0 0 18px;place-items:center;color:var(--dsw-alias-label-primary)}.dsh-st-model-warning{margin:4px;padding:8px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.1));color:var(--dsw-alias-state-error-primary,#f85149);font-size:12px;line-height:18px}.dsh-st-model-empty{padding:14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-st-inline input.is-narrow{width:72px;flex:none}
.dsh-st-time{display:inline-flex;align-items:center;gap:2px;min-height:36px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.04)}
.dsh-st-time .dsh-st-select{min-width:48px}
.dsh-st-time .dsh-st-select-btn{width:auto;min-height:32px;padding:0 6px;border:0;background:transparent}
.dsh-st-time-sep{padding:0 2px;color:var(--dsw-alias-label-secondary)}
.dsh-st-inline input[type=date]{min-width:148px;max-width:170px}
.dsh-st-weekdays button{min-width:52px;height:34px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent}
.dsh-st-weekdays button.is-on{border-color:transparent;background:#fff;color:#111}
.dsh-st-prompt-card{display:flex;flex-direction:column;flex:1;min-height:160px;max-width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;overflow:visible;background:rgba(255,255,255,.03)}
.dsh-st-prompt-card textarea{flex:1;width:100%;max-width:100%;min-height:140px;border:0;background:transparent;padding:16px 18px;font-size:14px;line-height:1.65;resize:none}
.dsh-st-composer,.dsh-st-composer-left,.dsh-st-composer-right{display:flex;align-items:center;flex-wrap:nowrap}
.dsh-st-composer{justify-content:space-between;gap:8px;padding:2px 8px 10px;border-top:0}
.dsh-st-composer-left,.dsh-st-composer-right{gap:2px;min-width:0}
.dsh-st-composer .dsh-st-select{min-width:0}
.dsh-st-composer svg{flex:none}
.dsh-st-menu-split{height:1px;margin:6px 8px;background:rgba(255,255,255,.08)}
.dsh-st-subdialog{margin:0 0 12px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.03)}
.dsh-st-subdialog>strong{display:block;margin:0 0 8px;font-size:13px}
.dsh-st-rail{box-sizing:border-box;height:100%;overflow:auto;padding:4px var(--dsh-sidebar-inline-padding,12px) 18px 8px;color:inherit;scrollbar-gutter:stable}
.dsh-st-rail-empty{padding:16px 10px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px}
.dsh-st-rail-group{margin:0 0 8px}
.dsh-st-rail-head,.dsh-st-rail-session{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}
.dsh-st-rail-head{min-height:32px;padding:4px 8px;border-radius:8px;font-size:13px;font-weight:600}
.dsh-st-rail-session{min-height:28px;padding:3px 8px 3px 28px;border-radius:8px;color:var(--dsw-alias-label-secondary,#9ca39f);font-size:12px}
.dsh-st-rail-head:hover,.dsh-st-rail-session:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-rail-folder{display:grid;place-items:center;width:16px;height:20px;flex:none;opacity:.8}
.dsh-st-rail-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-rail-session span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-rail-dot{width:6px;height:6px;margin-left:auto;border-radius:50%;background:#34c759;flex:none}.dsh-st-run-dot{flex:none;color:var(--dsw-static-deepseek-450,#4c8dff)}.dsh-st-run-dot-cell{fill:currentColor;opacity:.15;animation:dsh-st-run-chase 1s infinite}@keyframes dsh-st-run-chase{0%,12.4%{opacity:1}12.5%,24.9%{opacity:.6}25%,37.4%{opacity:.35}37.5%,100%{opacity:.15}}
.dsh-st-shell-rail{display:flex;flex-direction:column;min-height:0;flex:1;height:100%;overflow:hidden}
.dsh-st-shell-tabs{display:flex;flex:none;gap:18px;padding:4px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.08))}
.dsh-st-shell-tabs button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#8b8f98);padding:8px 0;font-size:13px;cursor:pointer}
.dsh-st-shell-tabs button.is-on{color:var(--dsw-alias-label-primary,inherit);box-shadow:inset 0 -2px 0 currentColor}
.dsh-st-shell-body{display:flex;min-height:0;flex:1;overflow:hidden}
.dsh-st-shell-body>*{min-width:0;flex:1}.dsh-st-official-tree{display:flex;min-height:0;flex:1;overflow:hidden}.dsh-st-official-tree>*{min-width:0;flex:1}
.dsh-st-rail-head.is-static{cursor:default;font-weight:600}
.dsh-st-rail-session.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-n,.dsh-st-n *{box-sizing:border-box}.dsh-st-n{box-sizing:border-box;display:flex;flex:1;min-width:0;max-width:100%;min-height:0;flex-direction:column;padding:0;padding-right:var(--dsh-sidebar-inline-padding,12px);color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;overflow:hidden}.dsh-st-n-toolbar{box-sizing:border-box;flex:none;height:36px;margin:2px -4px 4px 0;padding-left:4px;display:flex;justify-content:flex-end;align-items:center;gap:4px;overflow:visible;position:relative;z-index:2;color:var(--dsw-alias-label-tertiary,#81858C);border-radius:12px}.dsh-st-n-head-label{white-space:nowrap;min-width:0;max-width:45%;flex:none;line-height:20px;font-size:14px;overflow:hidden;transition:max-width .18s var(--ds-ease-in-out,ease),margin-right .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear}.dsh-st-n-toolbar.is-search .dsh-st-n-head-label{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transform:translate(-4px);transition-delay:0s,0s,0s,0s,.18s}.dsh-st-n-search-slot{box-sizing:border-box;min-width:28px;max-width:28px;transition:max-width .18s var(--ds-ease-in-out,ease);flex:none;align-items:center;margin-left:auto;display:flex;position:relative;z-index:2}.dsh-st-n-toolbar.is-search .dsh-st-n-search-slot{flex:1;min-width:0;max-width:100%}.dsh-st-n-search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out,ease),padding .18s var(--ds-ease-in-out,ease),border-color .18s var(--ds-ease-in-out,ease);background:transparent;border:none;border-radius:50%;flex:none;align-items:center;margin:0;padding:0;display:flex;overflow:hidden}.dsh-st-n-toolbar.is-search .dsh-st-n-search{border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.10));width:calc(100% + 4px);height:30px;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.dsh-st-n-search-btn,.dsh-st-n-head-btn{cursor:pointer;width:28px;height:28px;min-width:28px;min-height:28px;position:relative;z-index:1;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn{width:28px;height:30px}.dsh-st-n-search-btn:hover,.dsh-st-n-head-btn:hover,.dsh-st-n-head-btn.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn:hover{background:transparent}.dsh-st-n-head-acts{opacity:1;visibility:visible;max-width:32px;transition:max-width .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:visible;position:relative}.dsh-st-n-toolbar.is-search .dsh-st-n-head-acts{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transform:translate(4px);transition-delay:0s,0s,0s,.18s}.dsh-st-n-head-filter{position:relative}.dsh-st-n-search-input{display:none;opacity:0;pointer-events:none;width:0;min-width:0;flex:none;color:var(--dsw-alias-label-primary,inherit);transition:opacity .12s var(--ds-ease-in-out,ease);background:transparent;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.dsh-st-n-toolbar.is-search .dsh-st-n-search-input{display:block;opacity:1;pointer-events:auto;margin-left:-2px;width:auto;flex:1;min-width:0}.dsh-st-n-search-input::placeholder{color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-search-clear{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-search-clear:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}@media (prefers-reduced-motion:reduce){.dsh-st-n-head-label,.dsh-st-n-search-slot,.dsh-st-n-search,.dsh-st-n-head-acts,.dsh-st-n-search-input{transition:none}}.dsh-st-n-filter-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:196px;padding:8px 6px;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36))}.dsh-st-n-filter-label{padding:6px 10px 4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-filter-split{height:1px;margin:6px 8px;background:var(--dsw-alias-border-l2,rgba(255,255,255,.1))}.dsh-st-n-filter-menu button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:36px;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;cursor:pointer;text-align:left}.dsh-st-n-filter-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-filter-tick{width:16px;height:16px;flex:none}.dsh-st-n-tree{flex:1;min-width:0;max-width:100%;min-height:0;overflow-x:hidden;overflow-y:auto;padding:0 0 16px;user-select:none}.dsh-st-n-empty{padding:14px 8px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px}.dsh-st-n-group{min-width:0;max-width:100%}.dsh-st-n-row,.dsh-st-n-sess{display:flex;align-items:center;max-width:100%;border-radius:8px;padding:0 8px 0 12px;cursor:pointer;border:0;background:transparent;color:var(--dsw-alias-label-primary,inherit);text-align:left;font:14px/20px inherit}.dsh-st-n-row{height:34px;gap:6px}.dsh-st-n-sess{height:32px;gap:0;position:relative;width:100%;appearance:none}.dsh-st-n-row:hover,.dsh-st-n-sess:hover,.dsh-st-n-sess.is-on,.dsh-st-n-sess.is-menu{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-slot{flex:none;width:16px;height:20px;display:inline-flex;align-items:center;justify-content:center}.dsh-st-n-folder{color:var(--dsw-alias-label-secondary,#9ca39f)}.dsh-st-n-lead{color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-corner{color:var(--dsw-alias-label-caption,#ADB2B8);width:8px}.dsh-st-n-title{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}.dsh-st-n-sess .dsh-st-n-title{margin:0 6px 0 4px}.dsh-st-n-time{flex:none;font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858C);white-space:nowrap}.dsh-st-n-acts{flex:none;display:none;align-items:center;gap:12px}.dsh-st-n-row:hover .dsh-st-n-acts,.dsh-st-n-sess:hover .dsh-st-n-acts,.dsh-st-n-row.is-menu .dsh-st-n-acts,.dsh-st-n-sess.is-menu .dsh-st-n-acts{display:inline-flex}.dsh-st-n-sess:hover .dsh-st-n-time,.dsh-st-n-sess.is-menu .dsh-st-n-time{display:none}.dsh-st-n-ico{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#81858C);padding:0;cursor:pointer}.dsh-st-n-ico:hover{color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-menu.is-float{position:fixed;z-index:4000;right:auto;top:auto}.dsh-st-n-menu{position:absolute;right:8px;top:calc(100% + 4px);z-index:1100;min-width:218px;max-width:360px;box-sizing:border-box;padding:4px;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36))}.dsh-st-n-menu button{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;padding:8px 10px;border:0;border-radius:10px;background:transparent;cursor:pointer;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary,inherit);text-align:left}.dsh-st-n-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-mi{display:inline-flex;flex:none;width:16px;height:16px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-menu button.danger{color:var(--dsw-alias-state-error-primary,#f85149)}.dsh-st-n-menu button.danger .dsh-st-n-mi{color:inherit}.dsh-st-n-menu button.danger:hover{background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.12))}.dsh-st-n-hover{position:fixed;z-index:4100;min-width:188px;max-width:280px;padding:12px 14px;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36));color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-hover-title{font-size:14px;line-height:20px;font-weight:500}.dsh-st-n-hover-time{margin-top:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-hover-state{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#9ca39f)}.dsh-st-n-hover-dot{width:8px;height:8px;border-radius:50%;background:#34c759;flex:none}.dsh-st-n-hover-dot.is-run{background:#4c8dff}.dsh-st-n-rename{flex:1;min-width:0;margin:0 6px 0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-button-elevated-fill,rgba(255,255,255,.04));color:inherit;font:inherit;padding:0 2px}
`;
function installStyles() {
  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    existing.textContent = CSS_TEXT;
    return () => void 0;
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  document.head.append(style);
  return () => {
    style.remove();
  };
}

// src/client/index.ts
var name = "dsh-automation-client";
var inject = ["slots", "locale", "connection", "sessions"];
var SETTINGS_CLOCK_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" data-dsh-schedule-icon="1"><path fill="currentColor" d="M8 1.15A6.85 6.85 0 1 0 8 14.85 6.85 6.85 0 0 0 8 1.15Zm0 1.4a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Z"/><path fill="currentColor" d="M8.62 4.35H7.28v4.2l3.02 1.78.67-1.13-2.35-1.39V4.35Z"/></svg>';
function installSettingsNavIcon(labels) {
  const wanted = new Set(labels().map((item) => item.trim()).filter((item) => item !== ""));
  const applyButton = (button) => {
    const text = (button.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!wanted.has(text)) return;
    const svg = button.querySelector("svg");
    if (svg === null || svg.getAttribute("data-dsh-schedule-icon") === "1") return;
    svg.outerHTML = SETTINGS_CLOCK_SVG;
  };
  const scan = (root) => {
    if (root instanceof HTMLButtonElement) applyButton(root);
    for (const button of root.querySelectorAll?.("button") ?? []) applyButton(button);
  };
  scan(document);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
      const owner = target?.closest("button");
      if (owner instanceof HTMLButtonElement) applyButton(owner);
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  return () => {
    observer.disconnect();
  };
}
function apply(ctx) {
  ctx.effect(() => installStyles(), "dsh-automation: styles");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-automation: locale");
  const t = ctx.locale.bind(NS);
  const permissionT = ctx.locale.bind("permission.access");
  const modelT = ctx.locale.bind("model");
  const runtime = createAutomationRuntime(ctx.connection.rpc);
  ctx.effect(() => installSettingsNavIcon(() => [t("tab"), "Scheduled tasks", "\u5B9A\u65F6\u4EFB\u52A1"]), "dsh-automation: settings icon");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "scheduled-tasks",
    order: 28,
    locale: NS,
    label: () => t("tab"),
    icon: "schedule"
  }, function ScheduledTasksSettings(props) {
    return (0, import_react8.createElement)(AutomationView, { t, permissionT, modelT, runtime, ...props.close === void 0 ? {} : { closeSettings: props.close } });
  }));
  ctx.slots.inject("sidebar.schedule", () => ctx.slots.register({
    name: "sidebar.schedule",
    id: "dsh-automation-schedule",
    order: 10,
    locale: NS,
    label: () => t("sidebar.tab")
  }, function AutomationScheduleRail(props) {
    return (0, import_react8.createElement)(ScheduleRail, {
      t,
      runtime,
      openSession: createScheduledSessionOpener(ctx, runtime, props.openSession)
    });
  }));
  ctx.slots.inject("sidebar.workspaces", () => {
    let wrappedEntry;
    let originalComp;
    let removeInsertedTab = () => void 0;
    let wrapped = false;
    let syncing = false;
    let retryTimer;
    const listenChannels = (listener) => ctx.slots.subscribe?.("sidebar.channels", listener) ?? (() => void 0);
    const stopRetry = () => {
      if (retryTimer !== void 0) {
        window.clearInterval(retryTimer);
        retryTimer = void 0;
      }
    };
    const unwrap = () => {
      stopRetry();
      removeInsertedTab();
      removeInsertedTab = () => void 0;
      if (wrappedEntry !== void 0 && originalComp !== void 0) {
        try {
          wrappedEntry.component = originalComp;
        } catch {
        }
      }
      wrappedEntry = void 0;
      originalComp = void 0;
      wrapped = false;
    };
    const insertScheduleTab = (entry, openSession) => {
      const registry = findNativeTabRegistry(entry);
      if (registry === void 0) return false;
      if (registry.getTabs().some((item) => item.id === "schedule")) return true;
      removeInsertedTab = registry.insert({
        id: "schedule",
        label: t("sidebar.tab"),
        order: 30,
        matchSession: (sessionId) => sessionId.startsWith(AUTOMATION_SESSION_PREFIX),
        render: (props) => {
          const hostOpen = typeof props.openSession === "function" ? props.openSession : typeof props.open === "function" ? props.open : openSession;
          const opener = createScheduledSessionOpener(ctx, runtime, hostOpen);
          return (0, import_react8.createElement)(NativeScheduleSessionList, {
            t,
            runtime,
            openSession: opener,
            ...typeof props.useSessions === "function" ? { useSessions: props.useSessions } : {},
            ...typeof props.useWorkspaces === "function" ? { useWorkspaces: props.useWorkspaces } : {},
            ...typeof props.renameSession === "function" ? { renameSession: props.renameSession } : {},
            ...typeof props.archiveSession === "function" ? { archiveSession: props.archiveSession } : {},
            ...typeof props.deleteSession === "function" ? { deleteSession: props.deleteSession } : {},
            ...typeof props.forkSession === "function" ? { forkSession: props.forkSession } : {}
          });
        }
      });
      return true;
    };
    const insertIntoKnownHosts = () => {
      const entries = readSlotEntries(ctx, "sidebar.workspaces");
      for (const entry of entries) {
        const record = entry;
        if (insertScheduleTab(entry) || insertScheduleTab(record.component)) return true;
      }
      return wrappedEntry !== void 0 && insertScheduleTab(wrappedEntry);
    };
    const ensureScheduleTab = () => {
      if (insertIntoKnownHosts()) {
        stopRetry();
        return;
      }
      if (retryTimer !== void 0) return;
      let tries = 0;
      retryTimer = window.setInterval(() => {
        tries += 1;
        if (insertIntoKnownHosts() || tries >= 20) stopRetry();
      }, 250);
    };
    const sync = () => {
      if (syncing) return;
      syncing = true;
      try {
        let AutomationNativeWorkspaceShell2 = function(innerProps) {
          const openSession = createScheduledSessionOpener(ctx, runtime, innerProps.openSession ?? innerProps.open);
          return (0, import_react8.createElement)(NativeScheduleShell, {
            t,
            runtime,
            hostProps: innerProps,
            openSession,
            tabRegistry: registry,
            ...innerProps.wide === void 0 ? {} : { wide: innerProps.wide },
            hasChannels: () => slotHasEntries(ctx, "sidebar.channels"),
            subscribeChannels: listenChannels,
            ...innerProps.useSessions === void 0 ? {} : { useSessions: innerProps.useSessions },
            ...innerProps.useWorkspaces === void 0 ? {} : { useWorkspaces: innerProps.useWorkspaces },
            ...innerProps.renderSlot === void 0 ? {} : { renderSlot: innerProps.renderSlot },
            ...originalComp === void 0 ? {} : { officialTree: originalComp }
          });
        };
        var AutomationNativeWorkspaceShell = AutomationNativeWorkspaceShell2;
        if (hasCodexUiSidebar(readSlotEntries(ctx, "sidebar"))) {
          unwrap();
          return;
        }
        const entries = readSlotEntries(ctx, "sidebar.workspaces");
        const occupant = pickWrappableWorkspacesEntry(entries);
        const current = occupant?.component;
        if (current !== void 0 && isForeignSidebarHost(current)) {
          ensureScheduleTab();
          return;
        }
        if (wrappedEntry?.component !== void 0 && wrappedEntry.component.__dshAutomationWrapped === true) {
          ensureScheduleTab();
          return;
        }
        if (occupant?.component === void 0 || wrapped) return;
        const resolved = resolveOfficialTreeComponent(occupant.component);
        if (resolved === void 0) return;
        originalComp = resolved;
        const registry = createNativeTabRegistry(originalComp);
        attachNativeTabRegistry(occupant, registry);
        const marked = AutomationNativeWorkspaceShell2;
        marked.displayName = "AutomationNativeWorkspaceShell";
        marked.__dshNativeTabHost = true;
        marked.__dshAutomationWrapped = true;
        marked.__dshAutomationOriginal = originalComp;
        attachNativeTabRegistry(marked, registry);
        occupant.component = marked;
        wrappedEntry = occupant;
        wrapped = true;
        ensureScheduleTab();
      } catch (error) {
        console.warn("[dsh-automation] \u5305\u88F9\u5B98\u65B9\u4EFB\u52A1\u6811\u5931\u8D25", error);
      } finally {
        syncing = false;
      }
    };
    sync();
    const unsub = typeof ctx.slots.subscribe === "function" ? ctx.slots.subscribe("sidebar.workspaces", sync) : () => void 0;
    ensureScheduleTab();
    return () => {
      unsub();
      unwrap();
    };
  });
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "dsh-automation-prefill",
    order: 80,
    locale: NS
  }, PrefillBridge));
}
function createScheduledSessionOpener(ctx, runtime, hostOpen) {
  return (sessionId) => {
    void ensureOpenScheduledSession({
      id: sessionId,
      adopt: (id) => runtime.adoptSession(id),
      listed: (id) => {
        const snap = ctx.sessions?.list?.getSnapshot();
        return snap?.byId?.[id] !== void 0 || (snap?.ids ?? []).some((item) => item === id);
      },
      ...ctx.sessions?.refresh === void 0 ? {} : { refresh: () => ctx.sessions.refresh() },
      ...ctx.sessions === void 0 ? {} : { openRuntime: (id) => {
        ctx.sessions.open(id);
      } },
      ...hostOpen === void 0 ? {} : { openHost: hostOpen }
    });
  };
}
function PrefillBridge(props) {
  (0, import_react8.useEffect)(() => {
    const applyPrefill = (text) => {
      if (text === null || text === "") return;
      if (props.inputActions !== void 0) {
        props.inputActions.setDraft(text);
        takeChatPrefill();
        return;
      }
      if (applyPrefillToDom(text)) takeChatPrefill();
    };
    applyPrefill(peekChatPrefill());
    return subscribeChatPrefill(applyPrefill);
  }, [props.inputActions]);
  return null;
}
function readSlotEntries(ctx, name2) {
  try {
    const read = ctx.slots.entriesOfSlot ?? ctx.slots.entries;
    return read?.call(ctx.slots, name2) ?? [];
  } catch {
    return [];
  }
}
function slotHasEntries(ctx, name2) {
  return readSlotEntries(ctx, name2).length > 0;
}
return module.exports; } });
//# sourceMappingURL=client.js.map
