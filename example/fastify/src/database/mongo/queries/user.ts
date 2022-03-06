import { Document, Types } from 'mongoose'

import { UserModel } from '..'
import { UserDTO } from 'schemas'

const userDBOtoDTO = (
  userDBO: Document<unknown, unknown, UserDBO> &
    UserDBO & {
      _id: Types.ObjectId
    }
): UserDTO => ({
  ...userDBO.toObject(),
  createdAt: userDBO.createdAt.toISOString(),
  updatedAt: userDBO.updatedAt.toISOString()
})

const store = async (userData: UserDTO): Promise<UserDTO> => {
  const user = new UserModel(userData)

  await user.save()

  return userDBOtoDTO(user)
}

const remove = async (
  id: string | null = null
): Promise<UserDTO | number | null> => {
  if (id) {
    const removedUser = await UserModel.findByIdAndRemove(id)

    if (!removedUser) return null

    return userDBOtoDTO(removedUser)
  }

  return (await UserModel.deleteMany({})).deletedCount
}

const get = async (
  id: string | null = null
): Promise<UserDTO[] | UserDTO | null> => {
  if (id) {
    const user = await UserModel.findById(id)

    return user ? userDBOtoDTO(user) : null
  }

  const users = await UserModel.find({})

  return users.map(u => userDBOtoDTO(u))
}

const update = async (userData: UserDTO): Promise<UserDTO | null> => {
  const { id, ...rest } = userData
  const user = await UserModel.findByIdAndUpdate(id, rest, { new: true })

  return user ? userDBOtoDTO(user) : null
}

export { store, remove, get, update }
