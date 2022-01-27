import { UserModel } from '..'

const store = async (userData: DtoUser): Promise<IUser> => {
  const user = new UserModel(userData)
  await user.save()

  return user.toJSON()
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
  if (id) {
    const user = await UserModel.findById(id)

    return user ? user.toJSON() : null
  }

  const users = await UserModel.find({})

  return users.map(u => u.toJSON())
}

const update = async (userData: DtoUser): Promise<IUser | null> => {
  const { id, ...rest } = userData
  const user = await UserModel.findByIdAndUpdate(id, rest, { new: true })

  return user ? user.toJSON() : null
}

export { store, remove, get, update }
