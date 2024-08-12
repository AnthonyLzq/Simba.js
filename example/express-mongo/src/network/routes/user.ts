import { type NextFunction, type Request, type Response, Router } from 'express'

import { response } from 'network/response'
import { UserService } from 'services'
import { idSchema, storeUserDto, UserDTO } from 'schemas'
import { validatorCompiler } from './utils'

const User = Router()

User.route('/users').post(
  validatorCompiler(storeUserDto, 'body'),
  async (
    req: Request<
      {
        [key: string]: string
      },
      Record<string, unknown>,
      { args: UserDTO }
    >,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        body: {
          args: { lastName, name }
        }
      } = req
      const us = new UserService()
      const user = await us.store({ lastName, name })

      response({ error: false, message: user, res, status: 201 })
    } catch (error) {
      next(error)
    }
  }
)

User.route('/user/:id')
  .get(
    validatorCompiler(idSchema, 'params'),
    async (
      req: Request<{ id: string }, Record<string, unknown>>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService()
        const user = await us.getById(id)

        response({ error: false, message: user, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .patch(
    validatorCompiler(idSchema, 'params'),
    validatorCompiler(storeUserDto, 'body'),
    async (
      req: Request<{ id: string }, Record<string, unknown>, { args: UserDTO }>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          body: {
            args: { name, lastName }
          },
          params: { id }
        } = req
        const us = new UserService()
        const user = await us.update(id, { name, lastName })

        response({ error: false, message: user, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )
  .delete(
    validatorCompiler(idSchema, 'params'),
    async (
      req: Request<{ id: string }>,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const {
          params: { id }
        } = req
        const us = new UserService()
        const result = await us.deleteById(id)

        response({ error: false, message: result, res, status: 200 })
      } catch (error) {
        next(error)
      }
    }
  )

export { User }
