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
      content: `export * from './id'\nexport * from './user'\n`,
      file: `${projectName}/src/schemas/index.ts`
    },
    user: {
      content: `import z from 'zod'

import { id } from './id'

const user = z.object({
  lastName: z.string(),
  name: z.string()
})

type User = z.infer<typeof user>

const userWithId = user.extend({ id })

type UserWithId = z.infer<typeof userWithId>

const userDto = z.object({
  id: id.optional(),
  lastName: z.string(),
  name: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

type UserDTO = z.infer<typeof userDto>

const storeUserDto = z.object({
  args: user
})

type StoreUserDTO = z.infer<typeof storeUserDto>

export {
  userDto,
  UserDTO,
  userWithId,
  UserWithId,
  user,
  User,
  storeUserDto,
  StoreUserDTO
}\n`,
      file: `${projectName}/src/schemas/user.ts`
    },
    id: {
      content: `import z from 'zod'

const id = ${
        dbIsSQL ? 'z.preprocess(val => Number(val), z.number())' : 'z.string()'
      }

type Id = z.infer<typeof id>

const idSchema = z.object({ id })

type IdSchema = z.infer<typeof idSchema>

export { id, Id, idSchema, IdSchema }\n`,
      file: `${projectName}/src/schemas/id.ts`
    }
  }

  const processes = [
    writeFile(schemas.index.file, schemas.index.content),
    writeFile(schemas.user.file, schemas.user.content),
    writeFile(schemas.id.file, schemas.id.content)
  ]

  await Promise.all(processes)
}
