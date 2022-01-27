import { FastifyInstance } from 'fastify'

import { response } from 'network/response'
import { userSchema, idSchema, storeUserSchema } from './schemas'
import { UserService } from 'services'

const User = (app: FastifyInstance, prefix = '/api'): void => {
  app
    .post<{ Body: { args: Omit<DtoUser, 'id'> } }>(
      `${prefix}/users`,
      {
        schema: {
          body: {
            args: storeUserSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
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
        const us = new UserService({ lastName, name })
        const user = await us.process({ type: 'store' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .get(
      `${prefix}/users`,
      {
        schema: {
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'array',
                items: userSchema
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const us = new UserService()
        const users = await us.process({ type: 'getAll' })

        response({
          error: false,
          message: users,
          reply,
          status: 200
        })
      }
    )
    .delete(
      `${prefix}/users`,
      {
        schema: {
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'string'
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const us = new UserService()
        const result = await us.process({ type: 'deleteAll' })

        response({
          error: false,
          message: result,
          reply,
          status: 200
        })
      }
    )
    .get<{ Params: { id: string } }>(
      `${prefix}/user/:id`,
      {
        schema: {
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService({ id })
        const user = await us.process({ type: 'getOne' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .patch<{ Body: { args: Omit<DtoUser, 'id'> }; Params: { id: string } }>(
      `${prefix}/user/:id`,
      {
        schema: {
          body: {
            args: userSchema
          },
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: userSchema
            }
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
        const us = new UserService({ name, lastName, id })
        const user = await us.process({ type: 'update' })

        response({
          error: false,
          message: user,
          reply,
          status: 200
        })
      }
    )
    .delete<{ Params: { id: string } }>(
      `${prefix}/user/:id`,
      {
        schema: {
          params: {
            id: idSchema
          },
          response: {
            200: {
              error: {
                type: 'boolean'
              },
              message: {
                type: 'string'
              }
            }
          },
          tags: ['user']
        }
      },
      async (request, reply) => {
        const {
          params: { id }
        } = request
        const us = new UserService({ id })
        const result = await us.process({ type: 'delete' })

        response({
          error: false,
          message: result,
          reply,
          status: 200
        })
      }
    )
}

export { User }
