import { Router, NextFunction } from 'express'
import httpErrors from 'http-errors'
import { ValidationError } from 'joi'

import { response } from 'network/response'
import { UserService } from 'services/user'
import { idSchema, userSchema, storeUserSchema } from './schemas'

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

      try {
        await storeUserSchema.validateAsync(args)
        const us = new UserService(args)
        const result = await us.process({ type: 'store' })
        response({ error: false, message: result, res, status: 201 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

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
      const us = new UserService()

      try {
        const result = await us.process({ type: 'getAll' })
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
      const us = new UserService()

      try {
        const result = await us.process({ type: 'deleteAll' })
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
        const us = new UserService({ id })
        const result = await us.process({ type: 'getOne' })
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
      const user = {
        id,
        ...args
      }

      try {
        await userSchema.validateAsync(user)
        const us = new UserService(user)
        const result = await us.process({ type: 'update' })
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
        const us = new UserService({ id })
        const result = await us.process({ type: 'delete' })
        response({ error: false, message: result, res, status: 200 })
      } catch (e) {
        if (e instanceof ValidationError)
          return next(new httpErrors.UnprocessableEntity(e.message))

        next(e)
      }
    }
  )

export { User }
