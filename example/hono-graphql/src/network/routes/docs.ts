import type { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

import pkg from '../../../package.json'

const Docs = (app: OpenAPIHono, prefix = '/api') => {
  app.doc(`${prefix}/doc`, {
    openapi: '3.1.0',
    info: {
      title: pkg.name,
      description: pkg.description,
      version: pkg.version,
      contact: {
        email: 'sluzquinosa@uni.pe'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:1996/api',
        description: `${pkg.name} local API`
      }
    ],
    tags: [
    ]
  })
  app.get(`${prefix}/docs`, swaggerUI({ url: `${prefix}/doc` }))
}

export { Docs }
