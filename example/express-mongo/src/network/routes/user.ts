import { type NextFunction, type Request, type Response, Router } from 'express'
import z from 'zod'

import { response } from 'network/response'
import { jsonBody, jsonResponse, registry, validatorCompiler } from 'network/utils'
import { userDto, idSchema, storeUserDto, type UserDTO } from 'schemas'
import { UserService } from 'services'

const User = Router()
const userTag = 'user'

// POST /users
User.post(
  '/users',
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

registry.registerPath({
  method: 'post',
  path: '/users',
  tags: [userTag],
  request: {
    body: jsonBody(storeUserDto)
  },
  responses: {
    201: jsonResponse(userDto, 'User created successfully')
  }
})

// GET /user/:id
User.get(
  '/user/:id',
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

registry.registerPath({
  method: 'get',
  path: '/user/{id}',
  tags: [userTag],
  request: {
    params: idSchema
  },
  responses: {
    200: jsonResponse(userDto, 'User found')
  }
})

// PATCH /user/:id
User.patch(
  '/user/:id',
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
          args: { lastName, name }
        },
        params: { id }
      } = req
      const us = new UserService()
      const user = await us.update(id, { lastName, name })

      response({ error: false, message: user, res, status: 200 })
    } catch (error) {
      next(error)
    }
  }
)

registry.registerPath({
  method: 'patch',
  path: '/user/{id}',
  tags: [userTag],
  request: {
    params: idSchema,
    body: jsonBody(storeUserDto)
  },
  responses: {
    200: jsonResponse(userDto, 'User updated successfully')
  }
})

// DELETE /user/:id
User.delete(
  '/user/:id',
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

registry.registerPath({
  method: 'delete',
  path: '/user/{id}',
  tags: [userTag],
  request: {
    params: idSchema
  },
  responses: {
    200: jsonResponse(z.string(), 'User deleted successfully')
  }
})

export { User }
