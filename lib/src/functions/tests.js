const { platform } = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const writeFile = require('../utils/writeFile')

/**
 * @param {Object} args
 * @param {String} args.projectName
 * @param {Boolean} args.graphql
 * @param {Boolean} args.dbIsSQL
 * @returns {Promise<void>}
 */
module.exports = async ({ projectName, graphql, dbIsSQL }) => {
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
import z from 'zod'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const BASE_URL = \`http://localhost:\${process.env.PORT || 1996}\`
const baseResponseDto = z.object({
  error: z.boolean(),
  message: z.string()
})

type BaseResponseDTO = z.infer<typeof baseResponseDto>

describe('Simba.js tests', () => {
  beforeAll(async () => {
    await Server.start()
  })

  describe('API endpoints tests', () => {
    let userID = ${dbIsSQL ? 0 : "''"}

    describe('API: GET /', () => {
      it('Should return 200 with a successful operation', async () => {
        const result = await axios.get<BaseResponseDTO>(BASE_URL)

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(baseResponseDto.parse(result.data).error).toBe(false)
      })
    })

    describe('API: storeUser mutation', () => {
      const storeUserResponse = z.object({
        data: z.object({
          user: userDto
        })
      })

      type StoreUserDTO = z.infer<typeof storeUserResponse>

      it('Should create a user successfully', async () => {
        const result = await axios.post<StoreUserDTO>(\`\${BASE_URL}/graphql\`, {
          query: \`mutation store($user: UserInput!) {
            user: store(user: $user) {
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

        userID = result.data.data.user.id ?? userID
        expect(userID).toBeTruthy()
        expect(result.status).toBe(200)
        expect(storeUserResponse.safeParse(result.data).success).toBe(true)
      })
    })

    describe('API: getUser query', () => {
      const getUserResponse = z.object({
        data: z.object({
          user: userDto
        })
      })

      type GetOneUserDTO = z.infer<typeof getUserResponse>

      it('Should return a user', async () => {
        const result = await axios.post<GetOneUserDTO>(\`\${BASE_URL}/graphql\`, {
          query: \`query getById($id: ${dbIsSQL ? 'Float' : 'String'}!) {
            user: getById(id: $id) {
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

        expect(result.status).toBe(200)
        expect(getUserResponse.safeParse(result.data).success).toBe(true)
      })
    })

    describe('API: updateUser mutation', () => {
      const updateUserResponse = z.object({
        data: z.object({
          user: userDto
        })
      })

      type UpdateUserDTO = z.infer<typeof updateUserResponse>

      it('Should update a user successfully', async () => {
        const result = await axios.post<UpdateUserDTO>(\`\${BASE_URL}/graphql\`, {
          query: \`mutation update($id: ${
            dbIsSQL ? 'Float' : 'String'
          }!, $user: UserInput!) {
            user: update(id: $id, user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }\`,
          variables: {
            id: userID,
            user: {
              lastName: 'Luzquiños',
              name: 'Anthony'
            }
          }
        })

        expect(result.status).toBe(200)
        expect(updateUserResponse.safeParse(result.data).success).toBe(true)
      })
    })

    describe('API: deleteUser mutation', () => {
      const deleteUserResponse = z.object({
        data: z.object({
          result: z.string()
        })
      })

      type DeleteUserDTO = z.infer<typeof deleteUserResponse>

      it('Should delete the created user', async () => {
        const result = await axios.post<DeleteUserDTO>(\`\${BASE_URL}/graphql\`, {
          query: \`mutation deleteById($id: ${dbIsSQL ? 'Float' : 'String'}!) {
            result: deleteById(id: $id)
          }\`,
          variables: {
            id: userID
          }
        })

        expect(result.status).toBe(200)
        expect(deleteUserResponse.safeParse(result.data).success).toBe(true)
      })
    })
  })

  afterAll(async () => {
    await Server.stop()
  })
})\n`
          : `import axios from 'axios'
import z from 'zod'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const BASE_URL = \`http://localhost:\${process.env.PORT || 1996}\`
const baseResponseDto = z.object({
  error: z.boolean(),
  message: z.string()
})

type BaseResponseDTO = z.infer<typeof baseResponseDto>

describe('Simba.js tests', () => {
  beforeAll(async () => {
    await Server.start()
  })

  describe('API endpoints tests', () => {
    let userID = ${dbIsSQL ? 0 : "''"}

    describe('API: GET /', () => {
      it('Should return 200 with a successful operation', async () => {
        const result = await axios.get<BaseResponseDTO>(BASE_URL)

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(baseResponseDto.parse(result.data).error).toBe(false)
      })
    })

    describe('API: POST /api/users', () => {
      const storeUserResponse = z.object({
        error: z.boolean(),
        message: userDto
      })

      type StoreUserDTO = z.infer<typeof storeUserResponse>

      it('Should create a user successfully', async () => {
        const result = await axios.post<StoreUserDTO>(\`\${BASE_URL}/api/users\`, {
          args: {
            lastName: 'Lzq',
            name: 'Anthony'
          }
        })

        userID = result.data.message.id ?? userID
        expect(userID).toBeTruthy()
        expect(result.status).toBe(201)
        expect(result.data.error).toBe(false)
        expect(storeUserResponse.parse(result.data).error).toBe(false)
      })
    })

    describe('API: GET /api/user/:id', () => {
      const getOneUserResponse = z.object({
        error: z.boolean(),
        message: userDto
      })

      type GetOneUserDTO = z.infer<typeof getOneUserResponse>

      it('Should return a user', async () => {
        const result = await axios.get<GetOneUserDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(getOneUserResponse.parse(result.data).error).toBe(false)
      })
    })

    describe('API: PATCH /api/user/:id', () => {
      const updateUserResponse = z.object({
        error: z.boolean(),
        message: userDto
      })

      type UpdateUserDTO = z.infer<typeof updateUserResponse>

      it('Should update a user successfully', async () => {
        const result = await axios.patch<UpdateUserDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`,
          {
            args: {
              lastName: 'Luzquiños',
              name: 'Anthony'
            }
          }
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(updateUserResponse.parse(result.data).error).toBe(false)
      })
    })

    describe('API: DELETE /api/user/:id', () => {
      it('Should delete the created user', async () => {
        const result = await axios.delete<BaseResponseDTO>(
          \`\${BASE_URL}/api/user/\${userID}\`
        )

        expect(result.status).toBe(200)
        expect(result.data.error).toBe(false)
        expect(baseResponseDto.parse(result.data).error).toBe(false)
      })
    })
  })

  afterAll(async () => {
    await Server.stop()
  })
})\n`,
        file: `${projectName}/test/index.test.ts`
      }
    }
  }

  await Promise.all([
    writeFile(data.jestConfig.file, data.jestConfig.content),
    writeFile(data.test.index.file, data.test.index.content)
  ])
}
