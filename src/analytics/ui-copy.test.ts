import { describe, expect, it } from 'vitest'

import { DOCUMENT_DETAIL_DESCRIPTION } from './ui-copy'

describe('ui copy', () => {
  it('describes document detail panel as following the active document', () => {
    expect(DOCUMENT_DETAIL_DESCRIPTION)
      .toBe('跟随主浏览区当前打开文档，汇总其社区位置、桥接角色与沉没风险。')
  })
})
