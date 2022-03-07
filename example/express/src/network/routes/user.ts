import { Router } from 'express'

import { response } from 'network/response'
import { UserService } from 'services'
import { idSchema, storeUserSchema, UserDTO } from 'schemas'
import { validatorCompiler } from './utils'

const User = Router()

User.route('/users')
  .post(
    validatorCompiler(storeUserSchema, 'body'),
    async (req: CustomRequest, res: CustomResponse): Promise<void> => {
      const {
        body: { args }
      } = req
      const us = new UserService({ userDtoWithoutId: args })
      const result = await us.process({ type: 'store' })

      response({ error: false, message: result, res, status: 201 })
    }
  )
  .get(async (req: CustomRequest, res: CustomResponse): Promise<void> => {
    const us = new UserService()
    const result = await us.process({ type: 'getAll' })

    response({ error: false, message: result, res, status: 200 })
  })
  .delete(async (req: CustomRequest, res: CustomResponse): Promise<void> => {
    const us = new UserService()
    const result = await us.process({ type: 'deleteAll' })

    response({ error: false, message: result, res, status: 200 })
  })

User.route('/user/:id')
  .get(
    validatorCompiler(idSchema, 'params'),
    async (req: CustomRequest, res: CustomResponse): Promise<void> => {
      const {
        params: { id }
      } = req
      const us = new UserService({ id })
      const result = await us.process({ type: 'getOne' })

      response({ error: false, message: result, res, status: 200 })
    }
  )
  .patch(
    validatorCompiler(idSchema, 'params'),
    validatorCompiler(storeUserSchema, 'body'),
    async (req: CustomRequest, res: CustomResponse): Promise<void> => {
      const {
        body: { args },
        params: { id }
      } = req
      const userDto = {
        id,
        ...args
      } as UserDTO
      const us = new UserService({ userDto })
      const result = await us.process({ type: 'update' })

      response({ error: false, message: result, res, status: 200 })
    }
  )
  .delete(
    validatorCompiler(idSchema, 'params'),
    async (req: CustomRequest, res: CustomResponse): Promise<void> => {
      const {
        params: { id }
      } = req
      const us = new UserService({ id })
      const result = await us.process({ type: 'delete' })

      response({ error: false, message: result, res, status: 200 })
    }
  )

export { User }
