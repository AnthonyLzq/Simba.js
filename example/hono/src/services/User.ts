import debug from 'debug'

import { getById, removeById, store, update } from 'database'
import { Id, User as UserSchema } from 'schemas'
import { BaseHttpService } from './BaseHttp'
import { EFU, MFU, GE } from './utils'

class UserService extends BaseHttpService {
  constructor() {
    super(debug('App:Services:User'))
  }

  async store(userDto: UserSchema) {
    try {
      const result = await store(userDto)
      super.log({ method: this.store.name, value: 'result', content: result })

      return result
    } catch (e) {
      return super.errorHandling(e)
    }
  }

  async getById(id: Id) {
    try {
      const user = await getById(id)
      super.log({ method: this.getById.name, value: 'result', content: user })

      if (!user)
        return super.errorHandling(new Error(EFU.NOT_FOUND), { code: '404' })

      return user
    } catch (e) {
      return super.errorHandling(e)
    }
  }

  async update(id: Id, user: UserSchema) {
    try {
      const updatedUser = await update(id, user)
      super.log({
        method: this.update.name,
        value: 'result',
        content: updatedUser
      })

      if (!updatedUser)
        return super.errorHandling(new Error(EFU.NOT_FOUND), { code: '404' })

      return updatedUser
    } catch (e) {
      return super.errorHandling(e, { message: GE.INTERNAL_SERVER_ERROR })
    }
  }

  async deleteById(id: Id) {
    try {
      const deletedUser = await removeById(id)
      super.log({
        method: this.deleteById.name,
        value: 'result',
        content: deletedUser
      })

      if (!deletedUser)
        return super.errorHandling(new Error(EFU.NOT_FOUND), { code: '404' })

      return MFU.USER_DELETED
    } catch (e) {
      return super.errorHandling(e)
    }
  }
}

export { UserService }
