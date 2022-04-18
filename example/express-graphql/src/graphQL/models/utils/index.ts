import { ApolloError } from 'apollo-server-core'
import { FastifyLoggerInstance } from 'fastify'

const errorHandling = ({
  e,
  message,
  code,
  log
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e: any
  message: string
  code: string
  log: FastifyLoggerInstance
}): never => {
  log.error(e)

  if (e instanceof ApolloError) throw e

  throw new ApolloError(message ?? e.message, code)
}

export { errorHandling }
export * from './messages'
