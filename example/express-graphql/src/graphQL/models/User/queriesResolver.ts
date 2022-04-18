import { DefinedError } from 'ajv'
import { ApolloError } from 'apollo-server-core'

import { ajv, idSchema, UserDTO } from 'schemas'
import { getUser, getUsers } from './queries'
import { errorHandling, GE } from '../utils'

const Query = {
  getUser: async (
    parent: unknown,
    { id }: { id: string },
    context: Context
  ): Promise<UserDTO> => {
    const { log } = context
    const validate = ajv.compile(idSchema)

    try {
      const ok = validate({ id })

      if (!ok)
        throw new ApolloError(
          `id ${(validate.errors as DefinedError[])[0].message as string}`,
          'UNPROCESSABLE_ENTITY'
        )

      return await getUser({ id }, context)
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
  getUsers
}

export { Query }
