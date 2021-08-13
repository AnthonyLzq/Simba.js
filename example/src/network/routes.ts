import { Application, Response, Request, Router, NextFunction } from 'express'
import swaggerUi from 'swagger-ui-express'
import httpErrors from 'http-errors'

import { Home, User } from '../routes'
import { response, docs } from '../utils'

const routers = [User]

const applyRoutes = (app: Application): void => {
  app.use('/', Home)
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(docs))
  routers.forEach((router: Router): Application => app.use('/api', router))

  // Handling 404 error
  app.use((req, res, next) => {
    next(new httpErrors.NotFound('This route does not exists'))
  })
  app.use((
    error: httpErrors.HttpError,
    req  : Request,
    res  : Response,
    next : NextFunction
  ) => {
    response(true, error.message, res, error.status)
    next()
  })
}

export { applyRoutes }
