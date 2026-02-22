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
      content: "export * from './User'\n",
      file: `${projectName}/src/services/index.ts`
    },
    base: {
      content: `import { Debugger } from 'debug'
import httpErrors, {
  HttpErrorConstructor,
  NamedConstructors
} from 'http-errors'

import { Log } from 'utils'
import { GE } from './utils'

type FilterNumberKeys<T> = {
  [K in keyof T]: T[K] extends HttpErrorConstructor<infer N>
    ? N extends number
      ? K
      : never
    : never
}[keyof T]

type ErrorCodes = FilterNumberKeys<NamedConstructors>

class BaseHttpService implements Log {
  #debug: Debugger

  constructor(debug: Debugger) {
    this.#debug = debug
  }

  log({
    method,
    value,
    content
  }: {
    method: string
    value: string
    content: unknown
  }) {
    this.#debug(
      \`Service invoked -> \${
        this.constructor.name
      } ~ \${method} ~ value: \${value} ~ content: \${JSON.stringify(content)}\`
    )
  }

  errorHandling(
    error: unknown,
    {
      message,
      code
    }:
      | {
          message?: string
          code?: never
        }
      | {
          message?: never
          code: ErrorCodes
        } = {
      message: GE.INTERNAL_SERVER_ERROR
    }
  ): never {
    this.log({
      method: this.errorHandling.name,
      value: 'error',
      content: error
    })
    const errorMessage = message ?? (error as { message: string }).message

    if (code) throw new httpErrors[code](errorMessage)

    throw new httpErrors.InternalServerError(errorMessage)
  }
}

export { BaseHttpService }\n`,
      file: `${projectName}/src/services/BaseHttp.ts`
    },
    user: {
      content: `import debug from 'debug'

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

export { UserService }\n`,
      file: `${projectName}/src/services/User.ts`
    },
    utils: {
      index: {
        content: `export * from './messages'\n`,
        file: `${projectName}/src/services/utils/index.ts`
      },
      messages: {
        index: {
          content: `const GenericErrors = {
  INTERNAL_SERVER_ERROR: 'Something went wrong'
} as const

export { GenericErrors as GE }
export * from './user'\n`,
          file: `${projectName}/src/services/utils/messages/index.ts`
        },
        user: {
          content: `const ErrorForUser = {
  NOT_FOUND: 'The requested user does not exists',
  NOTHING_TO_DELETE: 'There is no user to be deleted'
} as const

const MessageForUser = {
  ALL_USERS_DELETED: 'All the users were deleted successfully',
  USER_DELETED: 'The requested user was successfully deleted'
} as const

export { ErrorForUser as EFU, MessageForUser as MFU }\n`,
          file: `${projectName}/src/services/utils/messages/user.ts`
        }
      }
    }
  }

  await Promise.all([
    writeFile(services.index.file, services.index.content),
    writeFile(services.base.file, services.base.content),
    writeFile(services.user.file, services.user.content),
    writeFile(services.utils.index.file, services.utils.index.content),
    writeFile(
      services.utils.messages.index.file,
      services.utils.messages.index.content
    ),
    writeFile(
      services.utils.messages.user.file,
      services.utils.messages.user.content
    )
  ])
}
