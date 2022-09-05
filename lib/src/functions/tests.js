const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')
const { ENVIRONMENTS_WITH_DB_URI } = require('../utils/constants')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphql
 * @param {Boolean} args.dbIsSQL
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName, graphql, dbIsSQL }) => {
  const createFoldersCommand = `mkdir ${projectName}/test`
  const dbURI = dbIsSQL ? process.env.DB_URI : process.env.MONGO_URI

  if (platform() === 'win32')
    await exec(createFoldersCommand.replaceAll('/', '\\'))
  else await exec(createFoldersCommand)

  const data = {
    jestConfig: {
      content: `import { Config } from '@jest/types'

const config: Config.InitialOptions = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 1 * 60 * 1000,
  globalSetup: './test/jestGlobalSetup.ts',
  modulePaths: ['<rootDir>/src', '<rootDir>/node_modules'],
  roots: ['.'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.test.ts$',
  transform: {
    '^.+\\\\.(t|j)s$': 'ts-jest'
  }
}

export default config
`,
      file: `${projectName}/jest.config.ts`
    },
    test: {
      index: {
        content: graphql
          ? `import axios from 'axios'
import { Static, TObject, TProperties, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const ajv = addFormats(new Ajv(), ['email'])
  .addKeyword('kind')
  .addKeyword('modifier')

const BASE_URL = 'http://localhost:1996'
const validator = <T extends TProperties>(
  schema: TObject<T>,
  object: unknown
) => {
  const validate = ajv.compile(schema)

  return validate(object)
}
const baseResponseDto = Type.Object({
  error: Type.Boolean(),
  message: Type.String()
})

type BaseResponseDTO = Static<typeof baseResponseDto>

describe('Simba.js tests', () => {
  beforeAll(async () => {
    await Server.start()
  })

  describe('API endpoints tests', () => {
    let userID = ${dbIsSQL ? 0 : "''"}

    describe('API: GET /', () => {
      let data: BaseResponseDTO

      test('Should return 200 as status code', async () => {
        const result = await axios.get<BaseResponseDTO>(BASE_URL)

        data = result.data
        expect(result.status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should be return baseResponseDto', () => {
        expect(validator(baseResponseDto, data)).toBe(true)
      })
    })

    describe('API: storeUser mutation', () => {
      const storeUserResponse = Type.Object({
        data: Type.Object({
          user: userDto
        })
      })

      type StoreUserDTO = Static<typeof storeUserResponse>

      let data: StoreUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.post<StoreUserDTO>(\`\${BASE_URL}/api\`, {
          query: \`mutation storeUser($user: StoreUserInput!) {
            user: storeUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`,
          variables: {
            user: {
              lastName: 'Lzq',
              name: 'Anthony'
            }
          }
        })

        data = result.data
        status = result.status
        userID = result.data.data.user.id ?? userID
        expect(status).toBe(200)
      })

      test('Should return storeUserResponse', () => {
        expect(validator(storeUserResponse, data)).toBe(true)
      })
    })

    describe('API: getUsers query', () => {
      const getUsersResponse = Type.Object({
        data: Type.Object({
          users: Type.Array(userDto)
        })
      })

      type GetAllUsersDTO = Static<typeof getUsersResponse>

      let data: GetAllUsersDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.post<GetAllUsersDTO>(\`\${BASE_URL}/api\`, {
          query: \`query getUsers {
            users: getUsers {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`
        })

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should return getUsersResponse', () => {
        expect(validator(getUsersResponse, data)).toBe(true)
      })
    })

    describe('API: getUser query', () => {
      const getUserResponse = Type.Object({
        data: Type.Object({
          user: userDto
        })
      })

      type GetOneUserDTO = Static<typeof getUserResponse>

      let data: GetOneUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.post<GetOneUserDTO>(\`\${BASE_URL}/api\`, {
          query: \`query getUser($id: ${dbIsSQL ? 'Int' : 'ID'}!) {
            user: getUser(id: $id) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`,
          variables: {
            id: userID
          }
        })

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should return getOneUserResponse', () => {
        expect(validator(getUserResponse, data)).toBe(true)
      })
    })

    describe('API: updateUser mutation', () => {
      const updateUserResponse = Type.Object({
        data: Type.Object({
          user: userDto
        })
      })

      type UpdateUserDTO = Static<typeof updateUserResponse>

      let data: UpdateUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.post<UpdateUserDTO>(\`\${BASE_URL}/api\`, {
          query: \`mutation updateUser($user: UpdateUserInput!) {
            user: updateUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`,
          variables: {
            user: {
              id: userID,
              lastName: 'Luzquiños',
              name: 'Anthony'
            }
          }
        })

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should return updateUserResponse', () => {
        expect(validator(updateUserResponse, data)).toBe(true)
      })
    })

    describe('API: deleteUser mutation', () => {
      const deleteUserResponse = Type.Object({
        data: Type.Object({
          result: Type.String()
        })
      })

      type DeleteUserDTO = Static<typeof deleteUserResponse>

      let data: DeleteUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.post<DeleteUserDTO>(\`\${BASE_URL}/api\`, {
          query: \`mutation deleteUser($id: ${dbIsSQL ? 'Int' : 'ID'}!) {
            result: deleteUser(id: $id)
          }\`,
          variables: {
            id: userID
          }
        })

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should return deleteUserResponse', () => {
        expect(validator(deleteUserResponse, data)).toBe(true)
      })
    })

    describe('API: deleteAllUsers mutation', () => {
      const deleteAllUserResponse = Type.Object({
        data: Type.Object({
          result: Type.String()
        })
      })

      type DeleteAllUsersDTO = Static<typeof deleteAllUserResponse>

      let data: DeleteAllUsersDTO
      let status: number

      test('Should return 200 as status code', async () => {
        await axios.post(\`\${BASE_URL}/api\`, {
          query: \`mutation storeUser($user: StoreUserInput!) {
            user: storeUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`,
          variables: {
            user: {
              lastName: 'Lzq',
              name: 'Anthony'
            }
          }
        })

        const result = await axios.post<DeleteAllUsersDTO>(\`\${BASE_URL}/api\`, {
          query: \`mutation deleteAllUsers {
            result: deleteAllUsers
          }\`
        })

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should return deleteAllUsersResponse', () => {
        expect(validator(deleteAllUserResponse, data)).toBe(true)
      })
    })
  })

  afterAll(async () => {
    await Server.stop()
  })
})
`
          : `import axios from 'axios'
import { Static, TObject, TProperties, Type } from '@sinclair/typebox'
import Ajv from 'ajv'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const ajv = new Ajv({
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  nullable: true
})

const BASE_URL = 'http://localhost:1996'
const validator = <T extends TProperties>(
  schema: TObject<T>,
  object: unknown
) => {
  const validate = ajv.compile(schema)

  return validate(object)
}
const baseResponseDto = Type.Object({
  error: Type.Boolean(),
  message: Type.String()
})

type BaseResponseDTO = Static<typeof baseResponseDto>

describe('Simba.js tests', () => {
  beforeAll(async () => {
    await Server.start()
  })

  describe('API endpoints tests', () => {
    let userID = ${dbIsSQL ? 0 : "''"}

    describe('API: GET /', () => {
      let data: BaseResponseDTO

      test('Should return 200 as status code', async () => {
        const result = await axios.get<BaseResponseDTO>(BASE_URL)

        data = result.data
        expect(result.status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should be return baseResponseDto', () => {
        expect(validator(baseResponseDto, data)).toBe(true)
      })
    })

    describe('API: POST /api/users', () => {
      const storeUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type StoreUserDTO = Static<typeof storeUserResponse>

      let data: StoreUserDTO
      let status: number

      test('Should return 201 as status code', async () => {
        const result = await axios.post<StoreUserDTO>(\`\${BASE_URL}/api/users\`, {
          args: {
            lastName: 'Lzq',
            name: 'Anthony'
          }
        })

        data = result.data
        status = result.status
        userID = result.data.message.id ?? userID
        expect(status).toBe(201)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return storeUserResponse', () => {
        expect(validator(storeUserResponse, data)).toBe(true)
      })
    })

    describe('API: GET /api/users', () => {
      const getAllUsersResponse = Type.Object({
        error: Type.Boolean(),
        message: Type.Array(userDto)
      })

      type GetAllUsersDTO = Static<typeof getAllUsersResponse>

      let data: GetAllUsersDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.get<GetAllUsersDTO>(\`\${BASE_URL}/api/users\`)

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return getAllUsersResponse', () => {
        expect(validator(getAllUsersResponse, data)).toBe(true)
      })
    })

    describe('API: GET /api/user/:id', () => {
      const getOneUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type GetOneUserDTO = Static<typeof getOneUserResponse>

      let data: GetOneUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.get<GetOneUserDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`
        )

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return getOneUserResponse', () => {
        expect(validator(getOneUserResponse, data)).toBe(true)
      })
    })

    describe('API: PATCH /api/user/:id', () => {
      const updateUserResponse = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type UpdateUserDTO = Static<typeof updateUserResponse>

      let data: UpdateUserDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.patch<UpdateUserDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`,
          {
            args: {
              lastName: 'Luzquiños',
              name: 'Anthony'
            }
          }
        )

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return updateUserResponse', () => {
        expect(validator(updateUserResponse, data)).toBe(true)
      })
    })

    describe('API: DELETE /api/user/:id', () => {
      let data: BaseResponseDTO
      let status: number

      test('Should return 200 as status code', async () => {
        const result = await axios.delete<BaseResponseDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`
        )

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return deleteUserResponse', () => {
        expect(validator(baseResponseDto, data)).toBe(true)
      })
    })

    describe('API: DELETE /api/users', () => {
      let data: BaseResponseDTO
      let status: number

      test('Should return 200 as status code', async () => {
        await axios.post(\`\${BASE_URL}/api/users\`, {
          args: {
            lastName: 'Lzq',
            name: 'Anthony'
          }
        })

        const result = await axios.delete<BaseResponseDTO>(
          \`\${BASE_URL}/api/users\`
        )

        data = result.data
        status = result.status
        expect(status).toBe(200)
      })

      test('Should be a successfully operation', () => {
        expect(data.error).toBe(false)
      })

      test('Should return deleteAllUsersResponse', () => {
        expect(validator(baseResponseDto, data)).toBe(true)
      })
    })
  })

  afterAll(async () => {
    await Server.stop()
  })
})
`,
        file: `${projectName}/test/index.test.ts`
      },
      jestGlobalSetup: {
        content: `module.exports = () => {
  if (process.env.NODE_ENV === 'local') require('./setEnvVars')
}
`,
        file: `${projectName}/test/jestGlobalSetup.ts`
      },
      setEnvVars: {
        content: `process.env.DB_URI =\n${
          ENVIRONMENTS_WITH_DB_URI.includes(process.env.NODE_ENV)
            ? `  '${dbURI}'\n`
            : dbIsSQL
            ? `  'postgres://postgres:postgres@postgres:5432/${projectName}'\n`
            : `  'mongodb://mongo:mongo@mongo:27017/${projectName}'\n`
        }`,
        file: `${projectName}/test/setEnvVars.ts`
      }
    }
  }

  await Promise.all([
    writeFile(data.jestConfig.file, data.jestConfig.content),
    writeFile(data.test.index.file, data.test.index.content),
    writeFile(
      data.test.jestGlobalSetup.file,
      data.test.jestGlobalSetup.content
    ),
    writeFile(data.test.setEnvVars.file, data.test.setEnvVars.content)
  ])
}
