import { User } from '@prisma/client'
import debug from 'debug'

import { dbConnection } from '../connection'
import { Id, User as UserSchema, UserDTO } from 'schemas'
import { Logger } from 'utils'

const LOGGER = new Logger(debug('App:Database:Queries:User'))

const userDBOtoDTO = (userDBO: User): UserDTO =>
  ({
    ...userDBO,
    createdAt: userDBO.createdAt.toISOString(),
    updatedAt: userDBO.updatedAt.toISOString()
  }) as UserDTO

const store = async (userData: UserSchema) => {
  try {
    const client = await dbConnection().connect()
    const user = await client.user.create({
      data: userData
    })

    return userDBOtoDTO(user)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: store.name,
      value: 'error',
      content: error
    })

    return null
  }
}

const removeById = async (id: Id) => {
  try {
    const client = await dbConnection().connect()
    await client.user.delete({
      where: { id }
    })

    return true
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: removeById.name,
      value: 'error',
      content: error
    })

    return false
  }
}

const getById = async (id: Id) => {
  try {
    const client = await dbConnection().connect()
    const user = await client.user.findUnique({
      where: { id }
    })

    if (!user) return null

    return userDBOtoDTO(user)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: getById.name,
      value: 'error',
      content: error
    })

    return null
  }
}

const update = async (id: Id, user: UserSchema) => {
  try {
    const client = await dbConnection().connect()
    const userUpdated = await client.user.update({
      where: { id },
      data: user
    })

    if (!userUpdated) return null

    return userDBOtoDTO(userUpdated)
  } catch (error) {
    LOGGER.log({
      origin: 'queries/user.ts',
      method: update.name,
      value: 'error',
      content: error
    })

    return null
  }
}

export { store, removeById, getById, update }
