import { UserModel } from '../models'

const store = async (userData: DtoUser): Promise<IUser> => {
  const user = new UserModel(userData)

  return await user.save()
}

const remove = async (
  id: string | null = null
): Promise<IUser | number | null> => {
  if (id) return await UserModel.findByIdAndRemove(id)

  return (await UserModel.deleteMany({})).deletedCount
}

const get = async (
  id: string | null = null
): Promise<IUser[] | IUser | null> => {
  if (id) return await UserModel.findById(id)

  return await UserModel.find({})
}

const update = async (userData: DtoUser): Promise<IUser | null> => {
  const { id, ...rest } = userData

  return await UserModel.findByIdAndUpdate(id, rest, { new: true })
}

export { store, remove, get, update }
