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
var import_react4 = require("react");

// src/client/AutomationView.tsx
var import_react3 = require("react");

// src/client/helpers.ts
var AutomationFormError = class extends Error {
  constructor(key) {
    super(key);
    this.key = key;
  }
};
function localDateTimeValue(date = /* @__PURE__ */ new Date()) {
  const future = new Date(date.getTime() + 60 * 60 * 1e3);
  future.setMinutes(0, 0, 0);
  const offset = future.getTimezoneOffset() * 6e4;
  return new Date(future.getTime() - offset).toISOString().slice(0, 16);
}
function defaultFormState(now = /* @__PURE__ */ new Date(), workspaces = [], defaultModel) {
  return {
    name: "",
    prompt: "",
    scheduleKind: "daily",
    onceAt: localDateTimeValue(now),
    everyMinutes: "60",
    time: "09:00",
    weekdays: [1, 2, 3, 4, 5],
    hourlyMinute: "00",
    monthDay: "1",
    customDays: "2",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
    permission: "read-only",
    workspaceId: workspaces[0]?.id ?? "",
    modelKey: defaultModel === void 0 || defaultModel === null ? "default" : `${defaultModel.provider}::${defaultModel.model}`,
    reasoningEffort: "high",
    skills: []
  };
}
function buildCreateInput(form, workspaces, models, now = /* @__PURE__ */ new Date()) {
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
      if (!Number.isFinite(at.getTime()) || at.getTime() <= now.getTime()) {
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
      schedule = { kind: "interval", everyMinutes, anchor: now.toISOString(), timeZone: form.timeZone };
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
function groupHistory(runs, range, now, t) {
  const buckets = /* @__PURE__ */ new Map();
  for (const run of runs) {
    const at = new Date(run.finishedAt ?? run.startedAt ?? run.scheduledFor);
    if (Number.isNaN(at.getTime())) continue;
    let key;
    let label;
    if (range === "month") {
      key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
      label = t("history.month", { month: `${at.getFullYear()}/${at.getMonth() + 1}` });
    } else if (range === "week") {
      const start = startOfWeek(at);
      key = start.toISOString().slice(0, 10);
      label = t("history.week", { date: `${start.getMonth() + 1}/${start.getDate()}` });
    } else {
      key = localDayKey(at);
      const today = localDayKey(now);
      const yesterday = localDayKey(new Date(now.getTime() - 864e5));
      label = key === today ? t("history.today") : key === yesterday ? t("history.yesterday") : t("history.date", { date: `${at.getMonth() + 1}/${at.getDate()}` });
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
function formFromAutomation(item, workspaces = [], defaultModel) {
  const base = defaultFormState(/* @__PURE__ */ new Date(), workspaces, defaultModel);
  const schedule = item.schedule;
  const modelKey = item.provider && item.model ? `${item.provider}::${item.model}` : "default";
  const common = {
    ...base,
    name: item.name,
    prompt: item.prompt,
    permission: item.permission,
    workspaceId: item.workspaceId ?? base.workspaceId,
    modelKey,
    reasoningEffort: item.reasoningEffort ?? "high"
  };
  switch (schedule.kind) {
    case "once":
      return { ...common, scheduleKind: "once", onceAt: toLocalInput(schedule.at) };
    case "interval":
      return { ...common, scheduleKind: "interval", everyMinutes: String(schedule.everyMinutes) };
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
function prettyModelName(model) {
  return model.split(/[-_]/g).map((part) => {
    if (part.toLowerCase() === "deepseek") return "DeepSeek";
    if (/^v\d/i.test(part)) return part.slice(0, 1).toUpperCase() + part.slice(1);
    if (part === "") return part;
    return part.slice(0, 1).toUpperCase() + part.slice(1);
  }).join("-");
}
function mergeSkills(...lists) {
  const seen = /* @__PURE__ */ new Set();
  const skills = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      skills.push(item);
    }
  }
  return skills;
}
async function loadClientSkills() {
  try {
    const response = await fetch("/api/dsh-skills-manager/state");
    if (!response.ok) return [];
    const payload = await response.json();
    const roots = payload.roots ?? payload.value?.roots ?? [];
    const skills = [];
    const seen = /* @__PURE__ */ new Set();
    for (const root of roots) {
      for (const item of root.skills ?? []) {
        const name2 = String(item.name ?? "").trim();
        if (name2 === "" || seen.has(name2)) continue;
        seen.add(name2);
        skills.push({ id: name2, name: name2 });
      }
    }
    return skills;
  } catch {
    return [];
  }
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m9 7 8 5-8 5V7Z" }) });
}
function TrashIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconFrame, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.5 7.5h13M9 7.5V5.7h6v1.8M8 10.5l.5 7h7l.5-7" }) });
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

// src/client/create-modal.tsx
var import_react2 = require("react");

// src/client/menu.tsx
var import_react = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function useMenuOpen() {
  const [open, setOpen] = (0, import_react.useState)(false);
  const root = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const close = (event) => {
      if (root.current !== null && root.current.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);
  return { open, setOpen, root };
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
    menu.open && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dsh-st-select-menu${pill === true ? " is-composer" : ""}${up === true ? " is-up" : ""}${up === true ? " is-end" : ""}`, children: options.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    )) })
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
    menu.open && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dsh-st-select-menu is-composer${up === true ? " is-up" : ""}`, onClick: () => {
      if (persist !== true) menu.setOpen(false);
    }, children })
  ] });
}
function useMenuState() {
  return useMenuOpen();
}

// src/client/create-modal.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
var KINDS = ["once", "interval", "hourly", "daily", "weekly", "monthly", "custom"];
var MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
var EFFORTS = ["none", "low", "medium", "high"];
function CreateModal({
  t,
  busy,
  workspaces,
  models,
  defaultModel,
  skills,
  draft,
  editing,
  onClose,
  onSubmit,
  onAddWorkspace
}) {
  const [form, setForm] = (0, import_react2.useState)(() => ({ ...defaultFormState(/* @__PURE__ */ new Date(), workspaces, defaultModel), ...draft }));
  const [validationError, setValidationError] = (0, import_react2.useState)();
  const [addingWorkspace, setAddingWorkspace] = (0, import_react2.useState)(false);
  const [workspacePath, setWorkspacePath] = (0, import_react2.useState)("");
  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setValidationError(void 0);
  };
  (0, import_react2.useEffect)(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
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
  const workspace = workspaces.find((item) => item.id === form.workspaceId);
  const skillLabel = form.skills.length === 1 ? skills.find((item) => item.id === form.skills[0])?.name ?? t("form.skills") : form.skills.length > 1 ? `${t("form.skills")} ${form.skills.length}` : t("form.skills");
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      className: "dsh-st-mask",
      role: "presentation",
      onClick: (event) => {
        if (event.target.closest(".dsh-st-select-menu") !== null) return;
        onClose();
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("form", { className: "dsh-st-modal", onClick: (event) => event.stopPropagation(), onSubmit: handleSubmit, children: [
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "date", value: datePart, onChange: (event) => update({ onceAt: `${event.target.value}T${timePart}` }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: timePart, onChange: (event) => update({ onceAt: `${datePart}T${event.target.value}` }) })
            ] }),
            form.scheduleKind === "interval" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "is-narrow", type: "number", min: 5, value: form.everyMinutes, onChange: (event) => update({ everyMinutes: event.target.value }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.minutesShort") })
            ] }),
            form.scheduleKind === "hourly" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuSelect, { value: form.hourlyMinute, options: MINUTES.map((item) => ({ value: item, label: item })), onChange: (value) => update({ hourlyMinute: value }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.minutesShort") })
            ] }),
            (form.scheduleKind === "daily" || form.scheduleKind === "weekly") && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: form.time, onChange: (event) => update({ time: event.target.value }) }),
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: form.time, onChange: (event) => update({ time: event.target.value }) })
            ] }),
            form.scheduleKind === "custom" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "is-narrow", type: "number", min: 1, value: form.customDays, onChange: (event) => update({ customDays: event.target.value }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsh-st-suffix", children: t("form.daysShort") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "time", value: form.time, onChange: (event) => update({ time: event.target.value }) })
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
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("textarea", { value: form.prompt, placeholder: t("form.promptPlaceholder"), onChange: (event) => update({ prompt: event.target.value }) }),
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
                  )),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-menu-split" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    MenuRow,
                    {
                      icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, { width: 14, height: 14 }),
                      label: t("form.addWorkspace"),
                      onClick: () => {
                        setWorkspacePath("");
                        setAddingWorkspace(true);
                      }
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(MenuPanel, { ghost: true, up: true, persist: true, label: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SparkleIcon, { width: 14, height: 14 }),
                  skillLabel
                ] }), children: [
                  skills.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-select-empty", children: t("form.skillsEmpty") }),
                  skills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    MenuRow,
                    {
                      icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SparkleIcon, { width: 14, height: 14 }),
                      label: item.name,
                      active: form.skills.includes(item.id),
                      onClick: () => update({
                        skills: form.skills.includes(item.id) ? form.skills.filter((id) => id !== item.id) : [...form.skills, item.id]
                      })
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
                    options: [
                      { value: "read-only", label: t("form.readOnly"), icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShieldIcon, { width: 14, height: 14 }) },
                      { value: "workspace-write", label: t("form.workspaceWrite"), icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShieldIcon, { width: 14, height: 14 }) },
                      { value: "full-access", label: t("form.fullAccess"), icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ShieldIcon, { width: 14, height: 14 }) }
                    ],
                    onChange: (value) => update({ permission: value })
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsh-st-composer-right", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                ModelPicker,
                {
                  t,
                  models,
                  modelKey: form.modelKey,
                  effort: form.reasoningEffort,
                  onModelKey: (value) => update({ modelKey: value }),
                  onEffort: (value) => update({ reasoningEffort: value })
                }
              ) })
            ] })
          ] })
        ] }),
        addingWorkspace && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-subdialog", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: t("form.addWorkspace") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "dsh-st-field", children: [
            t("form.workspacePath"),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { value: workspacePath, placeholder: t("form.workspacePathPlaceholder"), onChange: (event) => setWorkspacePath(event.target.value) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-modal-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dsh-st-btn", onClick: () => setAddingWorkspace(false), children: t("form.cancel") }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                type: "button",
                className: "dsh-st-btn dsh-st-btn--primary",
                disabled: busy || onAddWorkspace === void 0,
                onClick: async () => {
                  if (onAddWorkspace === void 0) return;
                  try {
                    const id = await onAddWorkspace(workspacePath);
                    update({ workspaceId: id });
                    setAddingWorkspace(false);
                  } catch (caught) {
                    setValidationError(caught instanceof Error ? caught.message : t("error.action"));
                  }
                },
                children: t("modal.save")
              }
            )
          ] })
        ] }),
        validationError !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dsh-st-error", children: validationError }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-modal-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "dsh-st-btn", onClick: onClose, disabled: busy, children: t("form.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "submit", className: "dsh-st-btn dsh-st-btn--primary", disabled: busy, children: t("modal.save") })
        ] })
      ] })
    }
  );
}
function ModelPicker({
  t,
  models,
  modelKey,
  effort,
  onModelKey,
  onEffort
}) {
  const menu = useMenuState();
  const [pane, setPane] = (0, import_react2.useState)("root");
  const selected = models.find((item) => `${item.provider}::${item.model}` === modelKey);
  const modelLabel = selected === void 0 ? t("form.modelDefault") : prettyModelName(selected.model);
  const effortLabel = t(`form.effort.${effort}`);
  const trigger = effort === "none" ? modelLabel : `${modelLabel} ${effortLabel}`;
  const open = (next) => {
    setPane(next);
    menu.setOpen(true);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `dsh-st-select is-pill${menu.open ? " is-open" : ""}`, ref: menu.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "button",
      {
        type: "button",
        className: "dsh-st-select-btn",
        onMouseDown: (event) => event.stopPropagation(),
        onClick: () => {
          if (menu.open) {
            menu.setOpen(false);
            return;
          }
          open("root");
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: trigger }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("em", {})
        ]
      }
    ),
    menu.open && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsh-st-select-menu is-composer is-up is-end", children: [
      pane === "root" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuRow, { kv: true, label: t("form.model"), hint: modelLabel, chevron: true, onClick: () => setPane("model") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MenuRow, { kv: true, label: t("form.effort"), hint: effortLabel, chevron: true, onClick: () => setPane("effort") })
      ] }),
      pane === "model" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          MenuRow,
          {
            label: t("form.modelDefault"),
            active: modelKey === "default",
            onClick: () => {
              onModelKey("default");
              menu.setOpen(false);
            }
          }
        ),
        models.map((item) => {
          const value = `${item.provider}::${item.model}`;
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            MenuRow,
            {
              label: prettyModelName(item.model),
              active: value === modelKey,
              onClick: () => {
                onModelKey(value);
                menu.setOpen(false);
              }
            },
            value
          );
        })
      ] }),
      pane === "effort" && EFFORTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        MenuRow,
        {
          label: t(`form.effort.${item}`),
          active: item === effort,
          onClick: () => {
            onEffort(item);
            menu.setOpen(false);
          }
        },
        item
      ))
    ] })
  ] });
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

// src/client/AutomationView.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var POLL_INTERVAL_MS = 15e3;
var EXAMPLES = [
  { name: "\u6BCF\u65E5\u56DE\u5F52\u68C0\u67E5", scheduleKind: "daily", time: "09:00", weekdays: [1, 2, 3, 4, 5] },
  { name: "\u6BCF\u5468\u4F9D\u8D56\u5DE1\u68C0", scheduleKind: "weekly", time: "10:00", weekdays: [1] },
  { name: "\u5DE5\u4F5C\u65E5\u65E9\u62A5", scheduleKind: "weekly", time: "08:00", weekdays: [1, 2, 3, 4, 5] }
];
function AutomationView({ t, runtime, closeSettings }) {
  const state = (0, import_react3.useSyncExternalStore)(runtime.source.subscribe, runtime.source.getSnapshot, runtime.source.getSnapshot);
  const [tab, setTab] = (0, import_react3.useState)("mine");
  const [query, setQuery] = (0, import_react3.useState)("");
  const [creating, setCreating] = (0, import_react3.useState)(false);
  const [editingId, setEditingId] = (0, import_react3.useState)();
  const [draft, setDraft] = (0, import_react3.useState)();
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)();
  const [keepAwake, setKeepAwake] = (0, import_react3.useState)(false);
  const [historyRange, setHistoryRange] = (0, import_react3.useState)("day");
  const [historyTask, setHistoryTask] = (0, import_react3.useState)("all");
  const [historyStatus, setHistoryStatus] = (0, import_react3.useState)("all");
  const [extraSkills, setExtraSkills] = (0, import_react3.useState)([]);
  const now = (0, import_react3.useMemo)(() => new Date(state.snapshot?.serverNow ?? Date.now()), [state.snapshot?.serverNow, state.refreshedAt]);
  (0, import_react3.useEffect)(() => {
    void loadClientSkills().then(setExtraSkills).catch(() => void 0);
    void runtime.refresh().catch(() => void 0);
    const timer = window.setInterval(() => {
      void runtime.refresh().catch(() => void 0);
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [runtime]);
  (0, import_react3.useEffect)(() => {
    if (!keepAwake || !("wakeLock" in navigator)) return;
    let lock;
    void navigator.wakeLock.request("screen").then((value) => {
      lock = value;
    }).catch(() => void 0);
    return () => {
      void lock?.release();
    };
  }, [keepAwake]);
  const snapshot = state.snapshot;
  const workspaces = snapshot?.workspaces ?? [];
  const models = snapshot?.models ?? [];
  const automations = (snapshot?.automations ?? []).filter((item) => query.trim() === "" || `${item.name} ${item.prompt}`.toLowerCase().includes(query.trim().toLowerCase())).slice().sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
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
      setError(caught instanceof Error ? caught.message : t("error.action"));
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
    setEditingId(void 0);
    setDraft(partial);
    setCreating(true);
  };
  const openEdit = (item) => {
    setEditingId(item.id);
    setDraft(formFromAutomation(item, workspaces, snapshot?.defaultModel ?? null));
    setCreating(true);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-shell", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "dsh-st-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: t("tab") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: t("header.lead") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-toolbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-st-icon", onClick: () => {
          void runtime.refresh();
        }, "aria-label": t("section.refresh"), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RefreshIcon, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { className: "dsh-st-search", value: query, placeholder: t("search.placeholder"), onChange: (event) => setQuery(event.target.value) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "dsh-st-btn", onClick: () => {
          setChatPrefill(t("chat.prompt"));
          closeSettings?.();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChatIcon, {}),
          t("action.chatCreate")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "dsh-st-btn dsh-st-btn--primary", onClick: () => openCreate(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PlusIcon, {}),
          t("action.create")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-banner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(InfoIcon, {}),
        t("banner.wake")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "dsh-st-toggle", children: [
        t("banner.keepAwake"),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: keepAwake ? "is-on" : "", role: "switch", "aria-checked": keepAwake, onClick: () => setKeepAwake((value) => !value) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsh-st-examples", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-examples-head", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: t("examples.title") }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-example-row", children: EXAMPLES.map((example, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "button",
        {
          type: "button",
          className: "dsh-st-example",
          onClick: () => openCreate({
            name: t(`examples.${index + 1}.title`),
            prompt: t(`examples.${index + 1}.body`),
            scheduleKind: example.scheduleKind,
            time: example.time,
            weekdays: example.weekdays
          }),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: t(`examples.${index + 1}.title`) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: t(`examples.${index + 1}.body`) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dsh-st-chip", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ClockIcon, {}),
              t(`examples.${index + 1}.chip`)
            ] })
          ]
        },
        example.name
      )) })
    ] }),
    error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsh-st-error", children: error }),
    (state.phase === "idle" || state.phase === "loading" && snapshot === void 0) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsh-st-muted", children: t("loading") }),
    state.phase === "error" && snapshot === void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: t("error.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: state.error }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-st-btn dsh-st-btn--primary", onClick: () => {
        void runtime.refresh();
      }, children: t("error.retry") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-tabs", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: tab === "mine" ? "is-on" : "", onClick: () => setTab("mine"), children: t("tabs.mine") }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: tab === "runs" ? "is-on" : "", onClick: () => setTab("runs"), children: t("tabs.runs") }),
      tab === "mine" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dsh-st-sort", children: t("sort.created") }),
      tab === "runs" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-filters", children: [
        ["day", "week", "month"].map((range) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: historyRange === range ? "is-on" : "", onClick: () => setHistoryRange(range), children: t(`history.range.${range}`) }, range)),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("select", { value: historyTask, onChange: (event) => setHistoryTask(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "all", children: t("history.allTasks") }),
          (snapshot?.automations ?? []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: item.id, children: item.name }, item.id))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("select", { value: historyStatus, onChange: (event) => setHistoryStatus(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "all", children: t("history.allStatus") }),
          ["succeeded", "failed", "running", "queued", "skipped", "cancelled"].map((status) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: status, children: t(`status.${status}`) }, status))
        ] })
      ] })
    ] }),
    tab === "mine" && (automations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: t("empty.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: t("empty.body") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-grid", children: automations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
        onDelete: () => {
          void runAction(() => runtime.mutateAutomation(item.id, "delete"));
        }
      },
      item.id
    )) })),
    tab === "runs" && (groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-empty", children: t("runs.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsh-st-timeline", children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsh-st-group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: group.label }),
      group.items.map((run) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RunRow, { run, t }, run.id))
    ] }, group.key)) })),
    creating && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      CreateModal,
      {
        t,
        busy,
        workspaces,
        models,
        defaultModel: snapshot?.defaultModel ?? null,
        skills: mergeSkills(snapshot?.skills, extraSkills),
        onAddWorkspace: async (path) => runtime.addWorkspace(path).then((value) => value.id),
        editing: editingId !== void 0,
        ...draft === void 0 ? {} : { draft },
        onClose: closeModal,
        onSubmit: async (form) => {
          await runAction(async () => {
            const input = buildCreateInput(form, workspaces, models);
            if (editingId === void 0) await runtime.createAutomation(input);
            else await runtime.updateAutomation(editingId, input);
            closeModal();
          });
        }
      },
      editingId ?? "create"
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
  const [menu, setMenu] = (0, import_react3.useState)(false);
  const root = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    if (!menu) return;
    const close = (event) => {
      if (root.current !== null && !root.current.contains(event.target)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [menu]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "dsh-st-card", ref: root, onClick: onEdit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-card-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: `dsh-st-switch ${item.status === "active" ? "is-on" : ""}`, role: "switch", "aria-checked": item.status === "active", disabled: busy, onClick: (event) => {
        event.stopPropagation();
        onToggle();
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "dsh-st-more", onClick: (event) => {
        event.stopPropagation();
        setMenu((value) => !value);
      }, "aria-label": t("card.delete"), children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(MoreIcon, {}) }),
      menu && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-menu", onClick: (event) => event.stopPropagation(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", disabled: busy, onClick: () => {
          setMenu(false);
          onRun();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PlayIcon, {}),
          t("menu.run")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "is-danger", disabled: busy, onClick: () => {
          setMenu(false);
          onDelete();
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TrashIcon, {}),
          t("menu.delete")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: item.name }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: item.prompt }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsh-st-card-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dsh-st-chip", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ClockIcon, {}),
        formatSchedule(item.schedule, t)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: item.nextRunAt === void 0 ? t("stats.noneScheduled") : t("history.nextApprox", { when: formatWithin(item.nextRunAt, now, t) }) })
    ] })
  ] });
}
function RunRow({ run, t }) {
  const duration = formatDuration(run.startedAt, run.finishedAt);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: `dsh-st-run is-${run.status}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: run.automationName }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: clockTime(run.startedAt ?? run.scheduledFor) }),
      duration !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: duration }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: t("history.trigger") })
    ] })
  ] });
}

// src/client/locales.ts
var NS = "dsh-automation";
var en = {
  tab: "Scheduled tasks",
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
  "menu.run": "Run now",
  "menu.delete": "Delete task",
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
  "banner.keepAwake": "Keep system awake",
  "tabs.mine": "My tasks",
  "tabs.runs": "Run history",
  "sort.created": "Newest first",
  "form.workspace": "Workspace",
  "form.addWorkspace": "Add workspace...",
  "form.workspacePath": "Folder path",
  "form.workspacePathPlaceholder": "D:\\work\\project",
  "form.model": "Model",
  "form.modelDefault": "Follow default model",
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
  "form.readOnly": "Read Only",
  "form.readOnlyHint": "Inspect the workspace without changing files.",
  "form.workspaceWrite": "Workspace Write",
  "form.fullAccess": "Full access",
  "form.workspaceWriteHint": "May change files in this workspace; past approvals are not reused.",
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
  "card.permission.read-only": "Read-only",
  "card.permission.workspace-write": "Workspace write",
  "card.permission.full-access": "Full access",
  "schedule.onceAt": "Once \xB7 {time}",
  "schedule.everyMinutes": "Every {count} minutes",
  "schedule.dailyAt": "Daily \xB7 {time}",
  "schedule.weeklyAt": "{days} \xB7 {time}",
  "card.pause": "Pause",
  "card.resume": "Resume",
  "card.runNow": "Run now",
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
  "menu.run": "\u7ACB\u5373\u6267\u884C",
  "menu.delete": "\u5220\u9664\u4EFB\u52A1",
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
  "banner.keepAwake": "\u4FDD\u6301\u7CFB\u7EDF\u5524\u9192",
  "tabs.mine": "\u6211\u7684\u5B9A\u65F6\u4EFB\u52A1",
  "tabs.runs": "\u6267\u884C\u8BB0\u5F55",
  "sort.created": "\u6309\u521B\u5EFA\u65F6\u95F4\u5012\u5E8F",
  "form.workspace": "\u5DE5\u4F5C\u76EE\u5F55",
  "form.addWorkspace": "\u6DFB\u52A0\u5DE5\u4F5C\u533A...",
  "form.workspacePath": "\u76EE\u5F55\u8DEF\u5F84",
  "form.workspacePathPlaceholder": "D:\\work\\project",
  "form.model": "\u6A21\u578B",
  "form.modelDefault": "\u8DDF\u968F\u9ED8\u8BA4\u6A21\u578B",
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
  "form.readOnly": "Read Only",
  "form.readOnlyHint": "\u53EF\u4EE5\u68C0\u67E5\u5DE5\u4F5C\u533A\uFF0C\u4F46\u4E0D\u4F1A\u4FEE\u6539\u6587\u4EF6\u3002",
  "form.workspaceWrite": "Workspace Write",
  "form.fullAccess": "Full access",
  "form.workspaceWriteHint": "\u53EF\u4EE5\u4FEE\u6539\u5F53\u524D\u5DE5\u4F5C\u533A\u6587\u4EF6\uFF1B\u4E0D\u4F1A\u7EE7\u627F\u5386\u53F2\u6279\u51C6\u3002",
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
  "card.permission.read-only": "\u53EA\u8BFB",
  "card.permission.workspace-write": "\u53EF\u5199\u5DE5\u4F5C\u533A",
  "card.permission.full-access": "Full access",
  "schedule.onceAt": "\u5355\u6B21 \xB7 {time}",
  "schedule.everyMinutes": "\u6BCF {count} \u5206\u949F",
  "schedule.dailyAt": "\u6BCF\u5929 \xB7 {time}",
  "schedule.weeklyAt": "{days} \xB7 {time}",
  "card.pause": "\u6682\u505C",
  "card.resume": "\u6062\u590D",
  "card.runNow": "\u7ACB\u5373\u8FD0\u884C",
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
  "time.now": "\u521A\u521A",
  "time.minuteAgo": "{count} \u5206\u949F\u524D",
  "time.hourAgo": "{count} \u5C0F\u65F6\u524D",
  "time.dayAgo": "{count} \u5929\u524D",
  "time.inMinute": "{count} \u5206\u949F\u540E",
  "time.inHour": "{count} \u5C0F\u65F6\u540E",
  "time.inDay": "{count} \u5929\u540E"
};

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
function createAutomationRuntime(rpc) {
  let state = { phase: "idle" };
  let refreshPromise;
  const listeners2 = /* @__PURE__ */ new Set();
  const publish = (next) => {
    state = next;
    for (const listener of [...listeners2]) listener();
  };
  const source = {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners2.add(listener);
      return () => {
        listeners2.delete(listener);
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
  const mutateThenRefresh = async (endpoint, payload) => {
    unwrapRpcResult(await rpc.call(CHANNEL, endpoint, payload));
    const pendingBeforeRefresh = refreshPromise;
    if (pendingBeforeRefresh !== void 0) await pendingBeforeRefresh.catch(() => void 0);
    await refresh();
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
      await mutateThenRefresh("mutate", payload);
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
    async addWorkspace(path) {
      const payload = { sessionId: "settings", path };
      const value = unwrapRpcResult(await rpc.call(CHANNEL, "add-workspace", payload));
      await refresh();
      return value;
    }
  };
}

// src/client/styles.ts
var STYLE_ID = "dsh-automation-styles";
var CSS_TEXT = `
.dsh-st-shell{max-width:1080px;margin:0 auto;padding:4px 2px 56px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}
.dsh-st-top h1{margin:0 0 6px;font-size:28px;font-weight:700;letter-spacing:-.03em}
.dsh-st-top p{margin:0;max-width:42em;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55}
.dsh-st-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px}
.dsh-st-search{width:220px;height:34px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-btn,.dsh-st-icon{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}
.dsh-st-icon{width:34px;padding:0}
.dsh-st-btn--primary{border-color:transparent;background:#4b7cff;color:#fff}
.dsh-st-hint{margin:-6px 0 14px;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;padding:10px 14px;border-radius:12px;background:rgba(53,104,196,.22);color:#c9dbff;font-size:13px}
.dsh-st-banner>span{display:inline-flex;align-items:center;gap:8px}
.dsh-st-toggle{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.dsh-st-toggle button,.dsh-st-switch{width:40px;height:22px;border:0;border-radius:999px;background:rgba(255,255,255,.18);position:relative;cursor:pointer}
.dsh-st-switch{width:42px;height:24px;background:#3a3d42}
.dsh-st-toggle button:after,.dsh-st-switch:after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .16s ease}
.dsh-st-toggle button.is-on,.dsh-st-switch.is-on{background:#34c759}
.dsh-st-toggle button.is-on:after,.dsh-st-switch.is-on:after{transform:translateX(18px)}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:rgba(255,255,255,.03);color:inherit;text-align:left;cursor:pointer}
.dsh-st-example:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;gap:16px;margin:4px 0 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.dsh-st-tabs>button{padding:8px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dsh-st-tabs>button.is-on{border-bottom-color:currentColor;color:var(--dsw-alias-label-primary);font-weight:650}
.dsh-st-sort{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-filters{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-left:auto}
.dsh-st-filters>button,.dsh-st-filters>select{height:28px;padding:0 10px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:inherit;font-size:12px}
.dsh-st-filters>button.is-on{background:rgba(255,255,255,.14)}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:rgba(255,255,255,.03)}
.dsh-st-card{cursor:pointer}
.dsh-st-card:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:15px}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
.dsh-st-more{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsh-st-menu{position:absolute;top:40px;right:12px;z-index:3;min-width:148px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.dsh-st-menu button{display:flex;width:100%;align-items:center;gap:8px;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer}
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
.dsh-st-mask{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;background:rgba(0,0,0,.45)}
.dsh-st-modal{width:min(760px,100%);max-height:min(92vh,900px);overflow:visible;padding:24px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;background:var(--dsw-alias-bg-base)}
.dsh-st-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dsh-st-modal-head h2{margin:0 0 4px;font-size:20px}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;font-size:13px}
.dsh-st-field input,.dsh-st-field select,.dsh-st-field textarea{width:100%;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-field textarea{min-height:240px;resize:vertical}
.dsh-st-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dsh-st-inline select,.dsh-st-inline input{flex:1;min-width:120px}
.dsh-st-weekdays{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.dsh-st-weekdays button{min-width:40px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-weekdays button.is-on{border-color:#4b7cff;color:#4b7cff}
.dsh-st-check{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;font-size:12px}
.dsh-st-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
@media(max-width:860px){.dsh-st-top,.dsh-st-banner{flex-direction:column}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-search{width:100%}.dsh-st-filters{width:100%;margin:8px 0}}
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
.dsh-st-select-menu.is-end{left:auto;right:0}
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
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-st-inline input.is-narrow{width:72px;flex:none}
.dsh-st-weekdays button{min-width:52px;height:34px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent}
.dsh-st-weekdays button.is-on{border-color:transparent;background:#fff;color:#111}
.dsh-st-prompt-card{display:flex;flex-direction:column;min-height:320px;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;overflow:visible;background:rgba(255,255,255,.03)}
.dsh-st-prompt-card textarea{flex:1;border:0;background:transparent;min-height:240px;padding:16px 18px;font-size:14px;line-height:1.65}
.dsh-st-composer,.dsh-st-composer-left,.dsh-st-composer-right{display:flex;align-items:center;flex-wrap:nowrap}
.dsh-st-composer{justify-content:space-between;gap:8px;padding:2px 8px 10px;border-top:0}
.dsh-st-composer-left,.dsh-st-composer-right{gap:2px;min-width:0}
.dsh-st-composer .dsh-st-select{min-width:0}
.dsh-st-composer svg{flex:none}
.dsh-st-menu-split{height:1px;margin:6px 8px;background:rgba(255,255,255,.08)}
.dsh-st-subdialog{margin:0 0 12px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.03)}
.dsh-st-subdialog>strong{display:block;margin:0 0 8px;font-size:13px}

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
var inject = ["slots", "locale", "connection"];
function apply(ctx) {
  ctx.effect(() => installStyles(), "dsh-automation: styles");
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-automation: locale");
  const t = ctx.locale.bind(NS);
  const runtime = createAutomationRuntime(ctx.connection.rpc);
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "scheduled-tasks",
    order: 28,
    locale: NS,
    label: () => t("tab")
  }, function ScheduledTasksSettings(props) {
    return (0, import_react4.createElement)(AutomationView, { t, runtime, ...props.close === void 0 ? {} : { closeSettings: props.close } });
  }));
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "dsh-automation-prefill",
    order: 80,
    locale: NS
  }, PrefillBridge));
}
function PrefillBridge(props) {
  (0, import_react4.useEffect)(() => {
    const apply2 = (text) => {
      if (text === null || text === "") return;
      if (props.inputActions !== void 0) {
        props.inputActions.setDraft(text);
        takeChatPrefill();
        return;
      }
      if (applyPrefillToDom(text)) takeChatPrefill();
    };
    apply2(peekChatPrefill());
    return subscribeChatPrefill(apply2);
  }, [props.inputActions]);
  return null;
}
return module.exports; } });
//# sourceMappingURL=client.js.map
