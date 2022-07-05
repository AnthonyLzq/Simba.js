const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/**
 * @param {String} projectName
 * @returns {Promise<void>}
 */
module.exports = async projectName => {
  const createFoldersCommand = `mkdir ${projectName}/test`

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
        content: `import axios from 'axios'
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
    let userID = ''

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
        userID = result.data.message.id ?? ''
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
      const getOneUser = Type.Object({
        error: Type.Boolean(),
        message: userDto
      })

      type GetOneUserDTO = Static<typeof getOneUser>

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

      test('Should return getOneUser', () => {
        expect(validator(getOneUser, data)).toBe(true)
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
        content: `process.env.MONGO_URI =\n${
          process.env.LOCAL
            ? `  '${process.env.MONGO_URI}'\n`
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
