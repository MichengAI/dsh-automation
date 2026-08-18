/** 给模型看的定时任务入口说明，避免把「定时任务」理解成操作系统 cron。 */

export const AUTOMATION_PROMPT_NAME = 'tool:automation'
export const AUTOMATION_PROMPT_ORDER = 118

export const AUTOMATION_PROMPT_TEXT = [
  '当用户要创建定时任务、计划任务，或让某件事每天/每周/工作日自动执行时，必须调用 automation_create。',
  '不要建议 crontab、cron、systemd timer、GitHub Actions 或 CI 定时，除非用户明确要求操作系统级 cron。',
  'schedule_create 只用于当前会话里的提醒，不会新开独立编码 Session。写日报、跑代码、做研究等独立工作必须用 automation_create。',
  '自然语言映射：每个工作日/周一到周五 → kind=weekly, weekdays=["MO","TU","WE","TH","FR"]；每天 → kind=daily；早上8点 → time="08:00"。',
  '未指定时区时使用 Asia/Shanghai。prompt 必须写成每次独立运行都能看懂的完整任务说明。',
].join('\n')

export const AUTOMATION_CREATE_DESCRIPTION = [
  '当用户要创建定时任务、计划任务、每天/每周/工作日自动执行某件事时使用本工具。',
  '不要改用 crontab、systemd 或 CI。',
  '为当前工作区创建一条独立 DSH 自动化；每次触发开启全新 Session，不继承当前对话。',
  '工作日早上 8 点示例：kind=weekly, weekdays=["MO","TU","WE","TH","FR"], time="08:00", time_zone="Asia/Shanghai"。',
  '必须使用显式 IANA 时区。最短间隔 5 分钟。默认只读；只有需要改文件时才选 workspace-write。',
].join('')

export function shouldUseAutomationCreate(userText: string): boolean {
  const text = userText.trim()
  if (text === '') return false
  const wantsSchedule = /定时任务|计划任务|每天|每周|工作日|每周一到周五|cron/.test(text)
  const wantsOsCron = /crontab\s+-e|systemd timer|github actions|操作系统.*cron|系统级.?cron/.test(text)
  return wantsSchedule && !wantsOsCron
}