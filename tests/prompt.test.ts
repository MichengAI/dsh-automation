import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_CREATE_DESCRIPTION,
  AUTOMATION_PROMPT_TEXT,
  shouldUseAutomationCreate,
} from '../src/prompt.ts'

test('用户说创建定时任务时应走 automation_create，而不是操作系统 cron', () => {
  assert.equal(shouldUseAutomationCreate('我要创建一个定时任务，每个工作日早上8点，执行生成每日日报'), true)
  assert.equal(shouldUseAutomationCreate('每天早上帮我跑一遍测试'), true)
  assert.equal(shouldUseAutomationCreate('每小时第15分钟检查一次'), true)
  assert.equal(shouldUseAutomationCreate('每月31号生成月报'), true)
  assert.equal(shouldUseAutomationCreate('每隔3天整理一次依赖'), true)
  assert.equal(shouldUseAutomationCreate('帮我写一段 crontab -e 的系统级 cron'), false)
  assert.equal(shouldUseAutomationCreate('今天天气怎么样'), false)
})

test('工具描述和系统提示必须点名定时任务，并禁止默认建议 cron', () => {
  assert.match(AUTOMATION_CREATE_DESCRIPTION, /定时任务/)
  assert.match(AUTOMATION_CREATE_DESCRIPTION, /不要改用 crontab/)
  assert.match(AUTOMATION_CREATE_DESCRIPTION, /weekdays/)
  assert.match(AUTOMATION_PROMPT_TEXT, /automation_create/)
  assert.match(AUTOMATION_PROMPT_TEXT, /不要建议 crontab/)
  assert.match(AUTOMATION_PROMPT_TEXT, /schedule_create 只用于当前会话里的提醒/)
  assert.match(AUTOMATION_PROMPT_TEXT, /kind=hourly, minute=15/)
  assert.match(AUTOMATION_PROMPT_TEXT, /kind=monthly, month_day=31/)
  assert.match(AUTOMATION_PROMPT_TEXT, /kind=custom, every_days=3/)
  assert.match(AUTOMATION_CREATE_DESCRIPTION, /hourly\(minute\)/)
  assert.match(AUTOMATION_CREATE_DESCRIPTION, /默认权限来自 Host/)
  assert.doesNotMatch(AUTOMATION_CREATE_DESCRIPTION, /默认只读/)
})
