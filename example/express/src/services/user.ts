import httpErrors from 'http-errors'

import { store, remove, get, update } from 'database'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

class UserService {
  private _args: Partial<DtoUser> | null

  constructor(args: Partial<DtoUser> | null = null) {
    this._args = args
  }

  public process({ type }: Process): Promise<string | IUser[] | IUser> {
    switch (type) {
      case 'store':
        return this._store()
      case 'getAll':
        return this._getAll()
      case 'deleteAll':
        return this._deleteAll()
      case 'getOne':
        return this._getOne()
      case 'update':
        return this._update()
      case 'delete':
        return this._delete()
      default:
        throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _store(): Promise<IUser> {
    try {
      const result = await store(this._args as DtoUser)

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getAll(): Promise<IUser[]> {
    try {
      const users = (await get()) as IUser[]

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _deleteAll(): Promise<string> {
    try {
      const usersDeleted = (await remove()) as number

      if (usersDeleted >= 1) return MFU.ALL_USERS_DELETED

      if (usersDeleted === 0)
        throw new httpErrors.Conflict(EFU.NOTHING_TO_DELETE)

      throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getOne(): Promise<IUser> {
    const { id } = this._args as DtoUser

    try {
      const user = (await get(id as string)) as IUser | null

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _update(): Promise<IUser> {
    try {
      const updatedUser = await update(this._args as DtoUser)

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _delete(): Promise<string> {
    const { id } = this._args as DtoUser

    try {
      const deletedUser = await remove(id)

      if (!deletedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return MFU.USER_DELETED
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }
}

export { UserService }
