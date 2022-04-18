import { ApolloError } from 'apollo-server-core'

import { get } from 'database'
import { UserDTO } from 'schemas'
import { EFU, GE, errorHandling } from '../utils'

const getUsers = async (
  parent: unknown,
  args: unknown,
  { log }: Context
): Promise<UserDTO[]> => {
  try {
    const users = (await get()) as UserDTO[]

    return users
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const getUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const user = (await get(id as string)) as UserDTO | null

    if (!user) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return user
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { getUsers, getUser }
