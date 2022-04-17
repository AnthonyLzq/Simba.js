import { FastifyInstance } from 'fastify'
import { response } from 'network/response'

const Home = (app: FastifyInstance, prefix = '/'): void => {
  app.get(`${prefix}`, (request, reply) => {
    response({
      error: false,
      message: 'Welcome to your Fastify GraphQL Backend!',
      reply,
      status: 200
    })
  })
}

export { Home }
