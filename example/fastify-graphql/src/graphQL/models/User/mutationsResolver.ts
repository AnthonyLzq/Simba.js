import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import { ajv, idSchema, UserDTO } from 'schemas'
import { storeUserSchema, updateUserSchema } from './schemas'
import { storeUser, updateUser, deleteUser, deleteAllUsers } from './mutations'
import { errorHandling, GE } from '../utils'

const Mutation = {
  storeUser: async (
    parent: unknown,
    { user }: { user: UserDTO },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(storeUserSchema)

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          `${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} ${(validate.errors as DefinedError[])[0].message as string}`,
          'UNPROCESSABLE_ENTITY'
        )

      return await storeUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  updateUser: async (
    parent: unknown,
    { user }: { user: UserDTO },
    context: Context
  ): Promise<UserDTO> => {
    const validate = ajv.compile(updateUserSchema)
    const { log } = context

    try {
      const ok = validate(user)

      if (!ok)
        throw new ApolloError(
          `${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} ${(validate.errors as DefinedError[])[0].message as string}`,
          'UNPROCESSABLE_ENTITY'
        )

      return await updateUser({ user }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<string> => {
    const validate = ajv.compile(idSchema)
    const { log } = context

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          `${(validate.errors as DefinedError[])[0].instancePath.replace(
            '/',
            ''
          )} ${(validate.errors as DefinedError[])[0].message as string}`,
          'UNPROCESSABLE_ENTITY'
        )

      return await deleteUser({ id }, context)
    } catch (e) {
      log.error(validate.errors)

      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  },
  deleteAllUsers: async (
    parent: unknown,
    args: unknown,
    context: Context
  ): Promise<string> => {
    const { log } = context
    try {
      return await deleteAllUsers(context)
    } catch (e) {
      return errorHandling({
        e,
        message: GE.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        log
      })
    }
  }
}

export { Mutation }
