import { describe, expect, it } from 'vitest'

import {
  buildSiliconFlowModelSelectPlaceholder,
  shouldAutoLoadSiliconFlowModelCatalog,
} from './setting-panel-ai'

describe('setting panel ai helpers', () => {
  it('requests siliconflow model autoload only when api key is available and the catalog is not already ready', () => {
    expect(shouldAutoLoadSiliconFlowModelCatalog({
      apiKey: '',
      loading: false,
      loaded: false,
      error: '',
    })).toBe(false)

    expect(shouldAutoLoadSiliconFlowModelCatalog({
      apiKey: 'sk-test',
      loading: false,
      loaded: false,
      error: '',
    })).toBe(true)

    expect(shouldAutoLoadSiliconFlowModelCatalog({
      apiKey: 'sk-test',
      loading: true,
      loaded: false,
      error: '',
    })).toBe(false)

    expect(shouldAutoLoadSiliconFlowModelCatalog({
      apiKey: 'sk-test',
      loading: false,
      loaded: true,
      error: '',
    })).toBe(false)

    expect(shouldAutoLoadSiliconFlowModelCatalog({
      apiKey: 'sk-test',
      loading: false,
      loaded: true,
      error: '加载失败',
    })).toBe(true)
  })

  it('builds compact siliconflow select placeholder copy for loading states', () => {
    expect(buildSiliconFlowModelSelectPlaceholder({
      kind: 'chat',
      apiKey: '',
      loading: false,
      loaded: false,
      error: '',
      optionCount: 0,
    })).toBe('请先填写 API Key')

    expect(buildSiliconFlowModelSelectPlaceholder({
      kind: 'chat',
      apiKey: 'sk-test',
      loading: false,
      loaded: false,
      error: '',
      optionCount: 0,
    })).toBe('点击加载聊天模型')

    expect(buildSiliconFlowModelSelectPlaceholder({
      kind: 'embedding',
      apiKey: 'sk-test',
      loading: true,
      loaded: false,
      error: '',
      optionCount: 0,
    })).toBe('正在加载 embedding 模型...')

    expect(buildSiliconFlowModelSelectPlaceholder({
      kind: 'chat',
      apiKey: 'sk-test',
      loading: false,
      loaded: false,
      error: '模型列表请求失败',
      optionCount: 0,
    })).toBe('加载失败，点击重试')

    expect(buildSiliconFlowModelSelectPlaceholder({
      kind: 'chat',
      apiKey: 'sk-test',
      loading: false,
      loaded: true,
      error: '',
      optionCount: 3,
    })).toBe('请选择聊天模型')
  })
})
