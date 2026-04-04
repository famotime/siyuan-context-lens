import { describe, expect, it } from 'vitest'

import { resolveSecretFieldMeta } from './setting-panel-secret-field'

describe('setting panel secret field', () => {
  it('uses password mode and show action when secret is hidden', () => {
    expect(resolveSecretFieldMeta(false, 'API Key')).toEqual({
      inputType: 'password',
      actionLabel: '显示 API Key',
      icon: 'eye',
    })
  })

  it('uses text mode and hide action when secret is visible', () => {
    expect(resolveSecretFieldMeta(true, 'API Key')).toEqual({
      inputType: 'text',
      actionLabel: '隐藏 API Key',
      icon: 'eye-off',
    })
  })
})
