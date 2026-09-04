/** 定时执行 Session 的展示标题，Host 与侧栏共用。 */

const RUN_STAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}
const zonedRunStampFormatters = new Map<string, Intl.DateTimeFormat>()

function runStampFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = zonedRunStampFormatters.get(timeZone)
  if (cached !== undefined) return cached
  const formatter = new Intl.DateTimeFormat('en-CA', { ...RUN_STAMP_OPTIONS, timeZone })
  zonedRunStampFormatters.set(timeZone, formatter)
  return formatter
}

export function formatRunStamp(iso: string, timeZone?: string): string {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return iso
  if (timeZone === undefined) {
    const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    const time = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    return `${date} ${time}`
  }
  try {
    const parts = runStampFormatter(timeZone).formatToParts(value)
    const part = (type: Intl.DateTimeFormatPartTypes): string | undefined => parts.find(item => item.type === type)?.value
    const [year, month, day, hour, minute] = ['year', 'month', 'day', 'hour', 'minute']
      .map(type => part(type as Intl.DateTimeFormatPartTypes))
    if ([year, month, day, hour, minute].some(item => item === undefined)) return iso
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch {
    // 历史数据若含宿主不支持的时区，保留原值以免侧栏整体渲染失败。
    return iso
  }
}

export function automationSessionTitle(taskName: string, iso: string, timeZone?: string): string {
  return `${formatRunStamp(iso, timeZone)} - ${taskName}`
}
