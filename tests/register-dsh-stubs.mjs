import { registerHooks } from 'node:module'

const runtimeStub = new URL('./dsh-runtime-stub.mjs', import.meta.url).href
const runtimePackages = new Set([
  '@deepseek-ai/dsh-agent',
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-sandbox-policy',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/schemastery',
  '@deepseek-ai/dsh-user-approval',
  '@deepseek-ai/dsh-workspace',
])

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (runtimePackages.has(specifier)) return { url: runtimeStub, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})
