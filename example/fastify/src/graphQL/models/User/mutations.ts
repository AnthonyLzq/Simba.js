import { ApolloError } from 'apollo-server-core'

import { store, remove, update } from 'database'
import { UserDTO } from 'schemas'
import { EFU, MFU, GE, errorHandling } from '../utils'

const storeUser = async (
  { user }: { user: UserDTO },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const result = await store(user)

    return result
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteAllUsers = async ({ log }: Context): Promise<string> => {
  try {
    const usersDeleted = (await remove()) as number

    if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

    if (usersDeleted === 0)
      throw new ApolloError(EFU.NOTHING_TO_DELETE, 'NOTHING_TO_DELETE')

    throw new ApolloError(GE.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR')
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const updateUser = async (
  { user }: { user: UserDTO },
  { log }: Context
): Promise<UserDTO> => {
  try {
    const updatedUser = await update(user)

    if (!updatedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return updatedUser
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

const deleteUser = async (
  { id }: { id: string },
  { log }: Context
): Promise<string> => {
  try {
    const deletedUser = await remove(id)

    if (!deletedUser) throw new ApolloError(EFU.NOT_FOUND, 'NOT_FOUND')

    return MFU.USER_DELETED
  } catch (e) {
    return errorHandling({
      e,
      message: GE.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      log
    })
  }
}

export { storeUser, deleteAllUsers, updateUser, deleteUser }
