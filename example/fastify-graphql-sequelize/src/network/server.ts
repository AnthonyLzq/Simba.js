import fastify, { FastifyInstance } from 'fastify'
import { ApolloServer } from 'apollo-server-fastify'
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { dbConnection } from 'database'

import { mergedSchema as schema } from 'graphQL'
import { applyRoutes } from './router'

const PORT = process.env.PORT ?? 1996
const ENVIRONMENTS_WITHOUT_PRETTY_PRINT = ['production', 'ci']

class Server {
  #app: FastifyInstance
  #connection: Awaited<ReturnType<typeof dbConnection>> | undefined

  constructor() {
    this.#app = fastify({
      logger: {
        prettyPrint: !ENVIRONMENTS_WITHOUT_PRETTY_PRINT.includes(
          process.env.NODE_ENV as string
        )
      }
    })
    this.#config()
  }

  #config() {
    this.#app.addHook('preHandler', (req, reply, done) => {
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type'
      )
      reply.header('x-powered-by', 'Simba.js')
      done()
    })
    applyRoutes(this.#app)
  }

  async #dbConnection() {
    this.#connection = await dbConnection(this.#app.log)
  }

  #fastifyAppClosePlugin(): ApolloServerPlugin {
    const app = this.#app

    return {
      async serverWillStart() {
        return {
          async drainServer() {
            await app.close()
          }
        }
      }
    }
  }

  public async start(): Promise<void> {
    const server = new ApolloServer({
      schema,
      plugins: [
        this.#fastifyAppClosePlugin(),
        ApolloServerPluginDrainHttpServer({ httpServer: this.#app.server }),
        process.env.NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageGraphQLPlayground()
      ],
      context: (): Context => ({
        log: this.#app.log
      })
    })

    try {
      await server.start()
      this.#app.register(
        server.createHandler({
          path: '/api'
        })
      )
      await this.#dbConnection()
      await this.#connection?.connect()
      await this.#app.listen(PORT)
      this.#app.log.info(
        `GraphQL server listening at: http://localhost:${PORT}${server.graphqlPath}`
      )
    } catch (e) {
      console.error(e)
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.#connection?.disconnect()
      await this.#app.close()
    } catch (e) {
      console.error(e)
    }
  }
}

const server = new Server()

export { server as Server }
