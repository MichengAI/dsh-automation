export function manualPluginUpdateCommand(profileName: string, packageName: string, version: string): string {
  const profile = profileName.trim() === '' ? '' : ` --profile ${profileName.trim()}`
  return `dsh plugin${profile} add ${packageName}@${version} --registry=https://registry.npmjs.org/`
}

interface PluginUpdateEscapeEvent {
  readonly key: string
  preventDefault(): void
  stopPropagation(): void
  stopImmediatePropagation(): void
}

export function handlePluginUpdateEscape(event: PluginUpdateEscapeEvent, close: () => void): boolean {
  if (event.key !== 'Escape') return false
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()
  close()
  return true
}
