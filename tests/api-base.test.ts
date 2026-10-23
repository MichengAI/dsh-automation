import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveApiUrl } from '../src/client/api-base.ts'

test('resolveApiUrl: 页面反代路径前缀安全解析', () => {
  const globalObj = globalThis as unknown as { document?: { baseURI?: string } }
  const originalDoc = globalObj.document

  try {
    // 1. 无 document 环境（如 Node.js CLI / 后台）保持原样
    delete globalObj.document
    assert.equal(resolveApiUrl('/api/michengai/dsh-automation/update'), '/api/michengai/dsh-automation/update')
    assert.equal(resolveApiUrl(''), '')

    // 2. 根路径部署：https://localhost:5173/
    globalObj.document = { baseURI: 'https://localhost:5173/' }
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-automation/update'),
      'https://localhost:5173/api/michengai/dsh-automation/update',
    )

    // 3. 反代子路径部署（带尾随斜杠）：https://gateway.example.com/app/dsh/
    globalObj.document = { baseURI: 'https://gateway.example.com/app/dsh/' }
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-automation/update'),
      'https://gateway.example.com/app/dsh/api/michengai/dsh-automation/update',
    )
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-automation/sidebar-entry'),
      'https://gateway.example.com/app/dsh/api/michengai/dsh-automation/sidebar-entry',
    )

    // 4. 反代子路径部署（不带尾随斜杠）：https://gateway.example.com/app/dsh
    // 必须自动补齐尾随斜杠，避免把最后一级子路径吃掉
    globalObj.document = { baseURI: 'https://gateway.example.com/app/dsh' }
    assert.equal(
      resolveApiUrl('/api/michengai/dsh-automation/update'),
      'https://gateway.example.com/app/dsh/api/michengai/dsh-automation/update',
    )

    // 5. 非根绝对路径 / 协议相对 / 完整 URL / 空值原样返回
    assert.equal(resolveApiUrl('https://other.com/api/test'), 'https://other.com/api/test')
    assert.equal(resolveApiUrl('//other.com/api/test'), '//other.com/api/test')
    assert.equal(resolveApiUrl('api/relative'), 'api/relative')
    assert.equal(resolveApiUrl(''), '')
  } finally {
    if (originalDoc !== undefined) {
      globalObj.document = originalDoc
    } else {
      delete globalObj.document
    }
  }
})
