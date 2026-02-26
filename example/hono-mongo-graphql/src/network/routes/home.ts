import type { OpenAPIHono } from '@hono/zod-openapi'
import { response } from 'network/response'

const Home = (app: OpenAPIHono, prefix = '/') => {
  app.get(`${prefix}`, c => {
    return response({
      error: false,
      message: 'Welcome to your Hono Backend!',
      c,
      status: 200
    })
  })
}

export { Home }
