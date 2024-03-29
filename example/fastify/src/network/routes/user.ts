import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { response } from 'network/response'
import {
  userDto,
  idSchema,
  IdSchema,
  storeUserDto,
  StoreUserDTO
} from 'schemas'
import { UserService } from 'services'

const User = (app: FastifyInstance, prefix = '/api'): void => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post<{ Body: StoreUserDTO }>(
      `${prefix}/users`,
      {
        schema: {
          body: storeUserDto,
          response: {
            201: z.object({
              error: z.boolean(),
              message: userDto
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          body: {
            args: { lastName, name }
          }
        } = request
        const us = new UserService()
        const user = await us.store({ lastName, name })

        response({ error: false, message: user, reply, status: 201 })
      }
    )
    .get<{ Params: IdSchema }>(
      `${prefix}/user/:id`,
      {
        schema: {
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: userDto
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService()
        const user = await us.getById(id)

        response({ error: false, message: user, reply, status: 200 })
      }
    )
    .patch<{ Body: StoreUserDTO; Params: IdSchema }>(
      `${prefix}/user/:id`,
      {
        schema: {
          body: storeUserDto,
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: userDto
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          body: {
            args: { name, lastName }
          },
          params: { id }
        } = request
        const us = new UserService()
        const user = await us.update(id, { name, lastName })

        response({ error: false, message: user, reply, status: 200 })
      }
    )
    .delete<{ Params: IdSchema }>(
      `${prefix}/user/:id`,
      {
        schema: {
          params: idSchema,
          response: {
            200: z.object({
              error: z.boolean(),
              message: z.string()
            })
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService()
        const result = await us.deleteById(id)

        response({ error: false, message: result, reply, status: 200 })
      }
    )
}

export { User }
