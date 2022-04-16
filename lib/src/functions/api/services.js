const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
module.exports = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/services \
${projectName}/src/services/utils \
${projectName}/src/services/utils/messages`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const services = {
    index: {
      content: "export * from './user'\n",
      file: `${projectName}/src/services/index.ts`
    },
    user: {
      content: `import httpErrors from 'http-errors'

import { store, remove, get, update } from 'database'
import { UserDTO } from 'schemas'
import { EFU, MFU, GE, errorHandling } from './utils'

type Process = {
  type: 'store' | 'getAll' | 'deleteAll' | 'getOne' | 'update' | 'delete'
}

type Arguments = {
  id?: string
  userDto?: UserDTO
  userDtoWithoutId?: Omit<UserDTO, 'id'>
}

class UserService {
  #args: Arguments

  constructor(args: Arguments = {}) {
    this.#args = args
  }

  public process({ type }: Process): Promise<string | UserDTO | UserDTO[]> {
    switch (type) {
      case 'store':
        return this.#store()
      case 'getAll':
        return this.#getAll()
      case 'deleteAll':
        return this.#deleteAll()
      case 'getOne':
        return this.#getOne()
      case 'update':
        return this.#update()
      case 'delete':
        return this.#delete()
      default:
        throw new httpErrors.InternalServerError(GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #store(): Promise<UserDTO> {
    try {
      if (!this.#args.userDtoWithoutId)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const result = await store({
        ...this.#args.userDtoWithoutId
      })

      return result
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #getAll(): Promise<UserDTO[]> {
    try {
      const users = (await get()) as UserDTO[]

      return users
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #deleteAll(): Promise<string> {
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

  async #getOne(): Promise<UserDTO> {
    try {
      if (!this.#args.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const { id } = this.#args
      const user = (await get(id)) as UserDTO | null

      if (!user) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return user
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #update(): Promise<UserDTO> {
    try {
      if (!this.#args.userDto || !this.#args.userDto.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const updatedUser = await update(this.#args.userDto)

      if (!updatedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return updatedUser
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }

  async #delete(): Promise<string> {
    try {
      if (!this.#args.id)
        throw new httpErrors.UnprocessableEntity(GE.INTERNAL_SERVER_ERROR)

      const { id } = this.#args
      const deletedUser = await remove(id)

      if (!deletedUser) throw new httpErrors.NotFound(EFU.NOT_FOUND)

      return MFU.USER_DELETED
    } catch (e) {
      return errorHandling(e, GE.INTERNAL_SERVER_ERROR)
    }
  }
}

export { UserService }
`,
      file: `${projectName}/src/services/user.ts`
    },
    utils: {
      index: {
        content: `import httpErrors from 'http-errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorHandling = (e: any, message?: string): never => {
  console.error(e)

  if (e instanceof httpErrors.HttpError) throw e

  throw new httpErrors.InternalServerError(message ?? e.message)
}

export { errorHandling }
export * from './messages'
`,
        file: `${projectName}/src/services/utils/index.ts`
      }
    },
    'utils/messages': {
      index: {
        content: `enum GenericErrors {
  INTERNAL_SERVER_ERROR = 'Something went wrong'
}

export { GenericErrors as GE }
export * from './user'
`,
        file: `${projectName}/src/services/utils/messages/index.ts`
      },
      user: {
        content: `enum ErrorForUser {
  NOT_FOUND = 'The requested user does not exists',
  NOTHING_TO_DELETE = 'There is no user to be deleted'
}

enum MessageForUser {
  ALL_USERS_DELETED = 'All the users were deleted successfully',
  USER_DELETED = 'The requested user was successfully deleted'
}

export { ErrorForUser as EFU, MessageForUser as MFU }
`,
        file: `${projectName}/src/services/utils/messages/user.ts`
      }
    }
  }

  await writeFile(services.index.file, services.index.content)
  await writeFile(services.user.file, services.user.content)
  await writeFile(services.utils.index.file, services.utils.index.content)
  await writeFile(
    services['utils/messages'].index.file,
    services['utils/messages'].index.content
  )
  await writeFile(
    services['utils/messages'].user.file,
    services['utils/messages'].user.content
  )
}
