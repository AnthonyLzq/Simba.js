import type { OpenAPIHono } from '@hono/zod-openapi'
import z from 'zod'

import { response } from 'network/response'
import { jsonBody, jsonResponse } from 'network/utils'
import { userDto, idSchema, storeUserDto } from 'schemas'
import { UserService } from 'services'

const User = (app: OpenAPIHono, prefix = '/api'): void => {
  const userTag = 'user'
  const registry = app.openAPIRegistry

  // POST /users
  app.post(`${prefix}/users`, async c => {
    const {
      args: { lastName, name }
    } = storeUserDto.parse(await c.req.json())
    const us = new UserService()
    const user = await us.store({ lastName, name })

    return response({ error: false, message: user, c, status: 201 })
  })

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
  app.get(`${prefix}/user/:id`, async c => {
    const { id } = idSchema.parse({ id: c.req.param('id') })
    const us = new UserService()
    const user = await us.getById(id)

    return response({ error: false, message: user, c, status: 200 })
  })

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
  app.patch(`${prefix}/user/:id`, async c => {
    const {
      args: { lastName, name }
    } = storeUserDto.parse(await c.req.json())
    const { id } = idSchema.parse({ id: c.req.param('id') })
    const us = new UserService()
    const user = await us.update(id, { lastName, name })

    return response({ error: false, message: user, c, status: 200 })
  })

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
  app.delete(`${prefix}/user/:id`, async c => {
    const { id } = idSchema.parse({ id: c.req.param('id') })
    const us = new UserService()
    const result = await us.deleteById(id)

    return response({ error: false, message: result, c, status: 200 })
  })

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
}

export { User }
