import httpErrors from 'http-errors'

import { UserModel } from 'models'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

class User {
  private _args: DtoUser | null

  constructor(args: DtoUser | null = null) {
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
    const { lastName, name } = this._args as DtoUser

    try {
      const newUser = new UserModel({ lastName, name })
      const result = await newUser.save()

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getAll(): Promise<IUser[]> {
    try {
      const users = await UserModel.find({})

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _deleteAll(): Promise<string> {
    try {
      const usersDeleted = await UserModel.deleteMany({})

      if (usersDeleted.deletedCount >= 1) return MFU.ALL_USERS_DELETED

      if (usersDeleted.deletedCount === 0)
        throw new httpErrors.Conflict(EFU.NOTHING_TO_DELETE)

      throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _getOne(): Promise<IUser> {
    const { id } = this._args as DtoUser

    try {
      const user = await UserModel.findById(id)

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _update(): Promise<IUser> {
    const { id, lastName, name } = this._args as DtoUser

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { lastName, name },
        { new: true }
      )

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  private async _delete(): Promise<string> {
    const { id } = this._args as DtoUser

    try {
      const deletedUser = await UserModel.findByIdAndRemove(id)

      if (!deletedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return MFU.USER_DELETED
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }
}

export { User }
