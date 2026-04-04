export const AI_FIELD_TOOLTIPS = {
  baseUrl: 'OpenAI 兼容服务通常需要填写到 /v1，例如 https://api.siliconflow.cn/v1',
  embeddingModel: '可选，用于增强孤立文档 AI 补链召回；留空时会退回到主题命中与结构候选。SiliconFlow 可填写 BAAI/bge-m3、BAAI/bge-large-zh-v1.5 或 Qwen/Qwen3-Embedding-*；不要填写 text-embedding-3-small 这类 OpenAI 模型名。',
  timeout: '发起请求的超时时间',
  maxTokens: '请求 API 时传入的 max_tokens 参数，用于控制生成的文本长度',
  temperature: '请求 API 时传入的 temperature 参数，用于控制生成的文本随机性',
  maxContextMessages: '请求 API 时传入的最大上下文数',
  siliconFlowChatModel: '点击下拉时自动加载 SiliconFlow 聊天模型清单',
  siliconFlowEmbeddingModel: '点击下拉时自动加载 SiliconFlow embedding 模型清单',
} as const

export function shouldAutoLoadSiliconFlowModelCatalog(params: {
  apiKey?: string
  loading: boolean
  loaded: boolean
  error: string
}) {
  if (!params.apiKey?.trim()) {
    return false
  }
  if (params.loading) {
    return false
  }
  return !params.loaded || Boolean(params.error)
}

export function buildSiliconFlowModelSelectPlaceholder(params: {
  kind: 'chat' | 'embedding'
  apiKey?: string
  loading: boolean
  loaded: boolean
  error: string
  optionCount: number
}) {
  if (!params.apiKey?.trim()) {
    return '请先填写 API Key'
  }
  if (params.loading) {
    return params.kind === 'chat' ? '正在加载聊天模型...' : '正在加载 embedding 模型...'
  }
  if (params.error) {
    return '加载失败，点击重试'
  }
  if (params.loaded || params.optionCount > 0) {
    return params.kind === 'chat' ? '请选择聊天模型' : '请选择 embedding 模型'
  }
  return params.kind === 'chat' ? '点击加载聊天模型' : '点击加载 embedding 模型'
}
