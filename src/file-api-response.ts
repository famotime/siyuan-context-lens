interface FileErrorEnvelope {
  code?: number
  msg?: string
  data?: unknown
}

interface FileSuccessEnvelope {
  code: number
  data?: unknown
}

export async function parseFileApiResponse(response: Response): Promise<Blob> {
  if (!response.ok) {
    throw new Error(`读取文件失败：${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return response.blob()
  }

  const text = await response.text()
  if (!text.trim()) {
    return new Blob([text], contentType ? { type: contentType } : undefined)
  }

  const parsed = parseJsonOrNull(text)
  if (isFileErrorEnvelope(parsed)) {
    throw new Error((parsed.msg || '').trim() || `读取文件失败：${parsed.code}`)
  }
  if (isFileSuccessEnvelope(parsed)) {
    return toBlobFromSuccessData(parsed.data, contentType)
  }

  return new Blob([text], { type: contentType })
}

function isFileErrorEnvelope(value: unknown): value is FileErrorEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as FileErrorEnvelope
  return typeof payload.code === 'number' && payload.code !== 0 && payload.data === null
}

function isFileSuccessEnvelope(value: unknown): value is FileSuccessEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<FileSuccessEnvelope>
  return payload.code === 0
}

function toBlobFromSuccessData(data: unknown, contentType: string): Blob {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return data
  }
  if (typeof data === 'string') {
    return new Blob([data], contentType ? { type: contentType } : undefined)
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data], contentType ? { type: contentType } : undefined)
  }
  if (ArrayBuffer.isView(data)) {
    const copied = new Uint8Array(data.byteLength)
    copied.set(new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength))
    return new Blob([copied.buffer], contentType ? { type: contentType } : undefined)
  }
  if (data == null) {
    return new Blob([], contentType ? { type: contentType } : undefined)
  }
  if (typeof data === 'object') {
    return new Blob([JSON.stringify(data)], contentType ? { type: contentType } : undefined)
  }
  return new Blob([String(data)], contentType ? { type: contentType } : undefined)
}

function parseJsonOrNull(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
