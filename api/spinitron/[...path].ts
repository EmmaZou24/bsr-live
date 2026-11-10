import type { VercelRequest, VercelResponse } from '@vercel/node'

const SPINITRON_API_URL = 'https://spinitron.com/api'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).send('Method not allowed')
    return
  }

  const token = process.env.SPINITRON_API_TOKEN
  if (!token) {
    console.error('SPINITRON_API_TOKEN is not configured')
    res.status(500).send('Spinitron is not configured')
    return
  }

  try {
    const pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path]
    const encodedPath = pathSegments
      .filter((segment): segment is string => typeof segment === 'string' && segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/')

    if (!encodedPath) {
      res.status(400).send('A Spinitron API path is required')
      return
    }

    const upstreamUrl = new URL(`${SPINITRON_API_URL}/${encodedPath}`)
    const queryIndex = req.url?.indexOf('?') ?? -1
    if (queryIndex >= 0) {
      upstreamUrl.search = req.url?.slice(queryIndex) ?? ''
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    res.status(upstreamResponse.status)
    res.setHeader('Content-Type', upstreamResponse.headers.get('Content-Type') ?? 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.send(await upstreamResponse.text())
  } catch (error) {
    console.error('Spinitron proxy request failed', error)
    res.status(502).send('Unable to reach Spinitron')
  }
}
