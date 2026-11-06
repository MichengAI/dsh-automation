/** 客户端 Agent 预设显示：内置预设走官方词条，用户自建预设保留自报名称。 */

import type { Translate } from './contracts.js'

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

/** 下拉与卡片共用的预设名称。 */
export function agentPresetLabel(
  preset: { readonly id: string; readonly name?: string },
  t: Translate,
): string {
  const keys = BUILT_IN_PRESET_KEYS[preset.id]
  if (keys !== undefined && publishedName(preset) === undefined) return t(keys.name)
  return publishedName(preset) ?? preset.id
}

/** 下拉项的说明文案；内置预设缺省时回退到官方描述。 */
export function agentPresetDescription(
  preset: { readonly id: string; readonly description?: string },
  t: Translate,
): string | undefined {
  const keys = BUILT_IN_PRESET_KEYS[preset.id]
  if (keys !== undefined && (preset.description === undefined || preset.description === '')) {
    return t(keys.description)
  }
  return preset.description !== undefined && preset.description !== '' ? preset.description : undefined
}
