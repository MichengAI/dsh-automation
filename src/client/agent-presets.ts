/** 客户端 Agent 预设显示：内置预设走官方词条，用户自建预设保留自报名称。 */

import { createElement } from 'react'
import type { Translate } from './contracts.js'
import type { AgentPresetOption } from './protocol.js'
import type { MenuSelectOption } from './menu-select.js'

/** 宿主 settings.agentPreset 命名空间的翻译函数；比插件自身词条覆盖更多语言。 */
export type PresetTranslate = (key: string, params?: Record<string, unknown>) => string

type BuiltInPresetKey =
  | 'presetStandardName' | 'presetStandardDescription'
  | 'presetPtcName' | 'presetPtcDescription'
  | 'presetMinimalName' | 'presetMinimalDescription'
  | 'presetCordisName' | 'presetCordisDescription'

/** 与宿主 @deepseek-ai/dsh-agent-preset-registry/display 保持一致的内置预设映射。 */
const BUILT_IN_PRESET_KEYS: Record<string, { readonly name: BuiltInPresetKey; readonly description: BuiltInPresetKey }> = {
  standard: { name: 'presetStandardName', description: 'presetStandardDescription' },
  ptc: { name: 'presetPtcName', description: 'presetPtcDescription' },
  minimal: { name: 'presetMinimalName', description: 'presetMinimalDescription' },
  cordis: { name: 'presetCordisName', description: 'presetCordisDescription' },
}

function publishedName(preset: { readonly id: string; readonly name?: string }): string | undefined {
  return preset.name !== undefined && preset.name !== '' && preset.name !== preset.id
    ? preset.name
    : undefined
}

/** 宿主命名空间缺词条时回退到插件自己的 zh/en 词典。 */
function translated(
  presetT: PresetTranslate | undefined,
  key: BuiltInPresetKey,
  fallback: string,
): string {
  if (presetT === undefined) return fallback
  const value = presetT(key)
  return value !== '' && value !== key ? value : fallback
}

/** 下拉与卡片共用的预设名称。 */
export function agentPresetLabel(
  preset: { readonly id: string; readonly name?: string },
  t: Translate,
  presetT?: PresetTranslate,
): string {
  const keys = BUILT_IN_PRESET_KEYS[preset.id]
  if (keys !== undefined && publishedName(preset) === undefined) {
    return translated(presetT, keys.name, t(keys.name))
  }
  return publishedName(preset) ?? preset.id
}

/** 下拉项的说明文案；内置预设缺省时回退到官方描述。 */
export function agentPresetDescription(
  preset: { readonly id: string; readonly description?: string },
  t: Translate,
  presetT?: PresetTranslate,
): string | undefined {
  const keys = BUILT_IN_PRESET_KEYS[preset.id]
  if (keys !== undefined && (preset.description === undefined || preset.description === '')) {
    return translated(presetT, keys.description, t(keys.description))
  }
  return preset.description !== undefined && preset.description !== '' ? preset.description : undefined
}

/** 构造预设下拉项；损坏预设保留但禁用，当前值不在名册时也保留可见。 */
export function buildAgentPresetOptions(
  presets: readonly AgentPresetOption[],
  current: string,
  t: Translate,
  presetT?: PresetTranslate,
): MenuSelectOption[] {
  const options: MenuSelectOption[] = presets.map(option => {
    const name = agentPresetLabel(option, t, presetT)
    const description = agentPresetDescription(option, t, presetT)
    const label = option.broken !== undefined
      ? `${name}${t('form.agentPresetUnavailable')}`
      : description !== undefined
        ? createElement('span', { className: 'dsh-st-preset-option' },
            createElement('span', { className: 'dsh-st-preset-option-name' }, name),
            createElement('span', { className: 'dsh-st-preset-option-desc' }, description),
          )
        : name
    return {
      value: option.id,
      label,
      text: name,
      displayText: name,
      disabled: option.broken !== undefined,
    }
  })
  if (current !== '' && !options.some(option => option.value === current)) {
    options.push({ value: current, label: current, text: current, displayText: current })
  }
  return options
}
