import assert from 'node:assert/strict'
import test from 'node:test'
import { permissionLabel } from '../src/client/permissions.ts'
import { normalizePermissionPreset } from '../src/permission-presets.ts'

const names = ['read-only', 'workspace-write', 'danger-full-access', 'review']

test('权限只接受 Host 官方列表并迁移旧完全访问名称', () => {
  assert.equal(normalizePermissionPreset('full-access', names), 'danger-full-access')
  assert.equal(normalizePermissionPreset('review', names), 'review')
  assert.equal(normalizePermissionPreset('unknown', names), undefined)
})

test('内置权限使用官方文案，自定义权限保留 Host 名称', () => {
  const t = (key: string): string => `official:${key}`
  assert.equal(permissionLabel({ value: 'read-only', name: 'Read Only' }, t), 'official:preset.readOnly')
  assert.equal(permissionLabel({ value: 'review', name: '安全审阅' }, t), '安全审阅')
})
