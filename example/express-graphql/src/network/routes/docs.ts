import type { Application } from 'express'
import swaggerUi from 'swagger-ui-express'
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'

import { registry } from 'network/utils'
import pkg from '../../../package.json'

const Docs = (app: Application, prefix = '/api'): void => {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  const docs = generator.generateDocument({
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

  app.use(`${prefix}/docs`, swaggerUi.serve, swaggerUi.setup(docs))
}

export { Docs }
