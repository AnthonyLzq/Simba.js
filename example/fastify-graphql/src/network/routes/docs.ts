import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'

const Docs = (app: FastifyInstance, prefix = '/api'): void => {
  app.register(fastifySwagger, {
    routePrefix: `${prefix}/docs`,
    openapi: {
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0',
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
          description: 'test-fastify local API'
        }
      ],
      tags: [
        {
          name: 'user',
          description: 'User related endpoints'
        }
      ]
    },
    exposeRoute: true
  })
}

export { Docs }
