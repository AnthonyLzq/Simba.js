import { connect, connection } from 'mongoose'
import { HttpLogger } from 'express-pino-logger'

const ENVIRONMENTS_WITHOUT_RECONNECTION = ['ci', 'local']
const dbConnection = async (
  logger: HttpLogger['logger']
): Promise<{
  connect: () => Promise<typeof import('mongoose')>
  disconnect: () => Promise<void>
}> => {
  const connectionConfig = {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  connection.on('connected', () => {
    logger.info('Mongo connection established.')
  })
  connection.on('reconnected', () => {
    logger.info('Mongo connection reestablished')
  })
  connection.on('disconnected', () => {
    if (
      !ENVIRONMENTS_WITHOUT_RECONNECTION.includes(
        process.env.NODE_ENV as string
      )
    ) {
      logger.info(
        'Mongo connection disconnected. Trying to reconnected to Mongo...'
      )
      setTimeout(() => {
        connect(process.env.DB_URI as string, {
          ...connection,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000
        })
      }, 3000)
    }
  })
  connection.on('close', () => {
    logger.info('Mongo connection closed')
  })
  connection.on('error', (e: Error) => {
    logger.info('Mongo connection error:')
    logger.error(e)
  })

  return {
    connect: () => connect(process.env.DB_URI as string, connectionConfig),
    disconnect: () => connection.close()
  }
}

export { dbConnection }
