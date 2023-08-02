const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.dbIsSQL
 * @param {Boolean} args.graphql
 */
module.exports = async ({ projectName, dbIsSQL, graphQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/src/schemas`

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const schemas = {
    index: {
      content: graphQL
        ? `import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv/dist/2019.js'
import addFormats from 'ajv-formats'

const id = ${
            dbIsSQL
              ? `Type.Number()`
              : `Type.String({ pattern: '^[a-zA-Z0-9]{24,}$' })`
          }
type ID = Static<typeof id>

const idSchema = Type.Object({ id })

type IDSchema = Static<typeof idSchema>

const ajv = addFormats(new Ajv(), ['email'])
  .addKeyword('kind')
  .addKeyword('modifier')

export { id, ID, idSchema, IDSchema, ajv }
export * from './user'
`
        : `export * from './id'\nexport * from './user'\n`,
      file: `${projectName}/src/schemas/index.ts`
    },
    user: {
      content: `import { Static, Type } from '@sinclair/typebox'

import { id } from './id'

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
    },
    id: {
      content: `import { Static, Type } from '@sinclair/typebox'

const id = ${dbIsSQL ? 'Type.Number()' : 'Type.String()'}

type Id = Static<typeof id>

const idSchema = Type.Object({ id })

type IdSchema = Static<typeof idSchema>

export { id, Id, idSchema, IdSchema }\n`,
      file: `${projectName}/src/schemas/id.ts`
    }
  }

  const processes = [
    writeFile(schemas.index.file, schemas.index.content),
    writeFile(schemas.user.file, schemas.user.content)
  ]

  if (!graphQL) processes.push(writeFile(schemas.id.file, schemas.id.content))

  await Promise.all(processes)
}
