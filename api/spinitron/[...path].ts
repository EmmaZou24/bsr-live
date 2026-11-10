const SPINITRON_API_URL = 'https://spinitron.com/api'

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET' },
    })
  }

  const token = process.env.SPINITRON_API_TOKEN
  if (!token) {
    console.error('SPINITRON_API_TOKEN is not configured')
    return new Response('Spinitron is not configured', { status: 500 })
  }

  const requestUrl = new URL(request.url)
  const apiPath = requestUrl.pathname.replace(/^\/api\/spinitron\/?/, '')
  if (!apiPath) {
    return new Response('A Spinitron API path is required', { status: 400 })
  }

  const upstreamUrl = new URL(`${SPINITRON_API_URL}/${apiPath}`)
  upstreamUrl.search = requestUrl.search

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': upstreamResponse.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
