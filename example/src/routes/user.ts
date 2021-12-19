import { Router, NextFunction } from 'express'
import httpErrors from 'http-errors'
import { ValidationError } from 'joi'

import { User as UserC } from 'controllers/user'
import { idSchema, userSchema } from 'schemas'

const User = Router()

User.route('/users')
  .post(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        body: { args }
      } = req
      const u = new UserC(args as DtoUser)

      try {
        const result = await u.process({ type: 'store' })
        response({ error: false, message: result, res, status: 201 })
      } catch (e) {
        next(e)
      }
    }
  )
  .get(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const u = new UserC()

      try {
        const result = await u.process({ type: 'getAll' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        next(e)
      }
    }
  )
  .delete(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const u = new UserC()

      try {
        const result = await u.process({ type: 'deleteAll' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        next(e)
      }
    }
  )

User.route('/user/:id')
  .get(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'getOne' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )
  .patch(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        body: { args },
        params: { id }
      } = req
      const user: DtoUser = {
        id,
        ...args
      }

      try {
        await userSchema.validateAsync(user)
        const u = new UserC(user)
        const result = await u.process({ type: 'update' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )
  .delete(
    async (
      req: CustomRequest,
      res: CustomResponse,
      next: NextFunction
    ): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'delete' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )

export { User }
