import { User } from '..'
import { User as UserSchema, UserDTO, UserWithId } from 'schemas'
import { Transaction } from 'sequelize/types'

const userDBOtoDTO = (userDBO: User): UserDTO => ({
  ...userDBO.get(),
  createdAt: userDBO.createdAt.toISOString(),
  updatedAt: userDBO.updatedAt.toISOString()
})

const store = async (
  userData: UserSchema,
  transaction: Transaction | null = null
): Promise<UserDTO> => {
  const user = await User.create(userData, {
    transaction
  })

  return userDBOtoDTO(user)
}

const remove = async (
  id: number | null = null,
  transaction: Transaction | null = null
): Promise<number | null> => {
  if (id) {
    const removedUser = await User.destroy({
      where: { id },
      transaction
    })

    return removedUser
  }

  const w = await User.destroy({ truncate: true, transaction })

  console.log(w)

  return w
}

const get = async (
  id: number | null = null
): Promise<UserDTO[] | UserDTO | null> => {
  if (id) {
    const user = await User.findByPk(id)

    return user ? userDBOtoDTO(user) : null
  }

  const { rows: users } = await User.findAndCountAll()

  return users.map(u => userDBOtoDTO(u))
}

const update = async (userData: UserWithId): Promise<UserDTO | null> => {
  const { id, ...rest } = userData
  const [, user] = await User.update(rest, {
    where: { id },
    returning: true,
    limit: 1
  })

  return user[0] ? userDBOtoDTO(user[0]) : null
}

export { store, remove, get, update }
