const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 */
module.exports = async ({ projectName }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/schemas`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const schemas = {
    index: {
      content: `import { Static, Type } from '@sinclair/typebox'

const id = Type.String({
  pattern: '^[a-zA-Z0-9]{24,}$'
})

type Id = Static<typeof id>

const idSchema = Type.Object({ id })

type IdSchema = Static<typeof idSchema>

export { id, Id, idSchema, IdSchema }
export * from './user'
`,
      file: `${projectName}/src/schemas/index.ts`
    },
    user: {
      content: `import { Static, Type } from '@sinclair/typebox'

import { id } from '.'

const user = Type.Object({
  lastName: Type.String(),
  name: Type.String()
})

type User = Static<typeof user>

const userDto = Type.Object({
  id: Type.Optional(id),
  lastName: Type.String(),
  name: Type.String(),
  createdAt: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String())
})

type UserDTO = Static<typeof userDto>

const storeUserSchema = Type.Object({
  args: user
})

type StoreUser = Static<typeof storeUserSchema>

export { userDto, UserDTO, user, User, storeUserSchema, StoreUser }
`,
      file: `${projectName}/src/schemas/user.ts`
    }
  }

  await writeFile(schemas.index.file, schemas.index.content)
  await writeFile(schemas.user.file, schemas.user.content)
}
