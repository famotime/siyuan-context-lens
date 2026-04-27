import { describe, expect, it } from 'vitest'

import { parseFileApiResponse } from './file-api-response'

describe('parseFileApiResponse', () => {
  it('returns a blob when the file API responds with a json success envelope', async () => {
    const file = await parseFileApiResponse(new Response(
      JSON.stringify({
        code: 0,
        data: '1234',
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      },
    ))

    expect(file).toBeInstanceOf(Blob)
    expect(await file.text()).toBe('1234')
  })

  it('returns a blob when the file API responds with raw sy json content', async () => {
    const rawContent = JSON.stringify({
      ID: '20260308103148-yqz4azy',
      Type: 'NodeDocument',
      Content: 'hello',
    })

    const file = await parseFileApiResponse(new Response(rawContent, {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }))

    expect(file).toBeInstanceOf(Blob)
    expect(file.size).toBe(rawContent.length)
    expect(await file.text()).toBe(rawContent)
  })
})
