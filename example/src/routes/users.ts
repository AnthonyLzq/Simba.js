import { Router, NextFunction } from 'express'

import { Response, Request } from '../custom'
import { response } from '../utils'
import { User as UserC } from '../controllers/user'
import { DtoUser } from '../dto-interfaces'
import { idSchema, userSchema } from '../schemas'

const User = Router()

User.route('/users')
  .post(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const {
        body: { args }
      } = req
      const u = new UserC(args as DtoUser)

      try {
        const result = await u.process({ type: 'store' })
        response(false, result, res, 201)
      } catch (e) {
        next(e)
      }
    }
  )
  .get(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const u = new UserC()

      try {
        const result = await u.process({ type: 'getAll' })
        response(false, result, res, 200)
      } catch (e) {
        next(e)
      }
    }
  )
  .delete(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const u = new UserC()

      try {
        const result = await u.process({ type: 'deleteAll' })
        response(false, result, res, 200)
      } catch (e) {
        next(e)
      }
    }
  )

User.route('/user/:id')
  .get(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'getOne' })
        response(false, result, res, 200)
      } catch (e) {
        if (e.isJoi) e.status = 422
        next(e)
      }
    }
  )
  .patch(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        response(false, result, res, 200)
      } catch (e) {
        if (e.isJoi) e.status = 422
        next(e)
      }
    }
  )
  .delete(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const {
        params: { id }
      } = req

      try {
        await idSchema.validateAsync(id)
        const u = new UserC({ id } as DtoUser)
        const result = await u.process({ type: 'delete' })
        response(false, result, res, 200)
      } catch (e) {
        if (e.isJoi) e.status = 422
        next(e)
      }
    }
  )

export { User }
