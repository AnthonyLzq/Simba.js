const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphql
 */
module.exports = async ({ projectName, graphql }) => {
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

const userWithId = Type.Intersect([user, Type.Object({ id })])

type UserWithId = Static<typeof userWithId>

const userDto = Type.Object({
  id: Type.Optional(id),
  lastName: Type.String(),
  name: Type.String(),
  createdAt: Type.Optional(Type.String()),
  updatedAt: Type.Optional(Type.String())
})

type UserDTO = Static<typeof userDto>

const storeUserDto = Type.Object({
  args: user
})

type StoreUserDTO = Static<typeof storeUserDto>

export {
  userDto,
  UserDTO,
  userWithId,
  UserWithId,
  user,
  User,
  storeUserDto,
  StoreUserDTO
}
`,
      file: `${projectName}/src/schemas/user.ts`
    }
  }

  if (graphql)
    schemas.index.content = `import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv/dist/2019.js'
import addFormats from 'ajv-formats'

const id = Type.String({
  pattern: '^[a-zA-Z0-9]{24,}$'
})

type ID = Static<typeof id>

const idSchema = Type.Object({ id })

type IDSchema = Static<typeof idSchema>

const ajv = addFormats(new Ajv(), ['email'])
  .addKeyword('kind')
  .addKeyword('modifier')

export { id, ID, idSchema, IDSchema, ajv }
export * from './user'
`

  await Promise.all([
    writeFile(schemas.index.file, schemas.index.content),
    writeFile(schemas.user.file, schemas.user.content)
  ])
}
