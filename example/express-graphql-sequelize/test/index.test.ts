import axios from 'axios'
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
    let userID = 0

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
        const result = await axios.post<StoreUserDTO>(`${BASE_URL}/api`, {
          query: `mutation storeUser($user: StoreUserInput!) {
            user: storeUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`,
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
        const result = await axios.post<GetAllUsersDTO>(`${BASE_URL}/api`, {
          query: `query getUsers {
            users: getUsers {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`
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
        const result = await axios.post<GetOneUserDTO>(`${BASE_URL}/api`, {
          query: `query getUser($id: Int!) {
            user: getUser(id: $id) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`,
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
        const result = await axios.post<UpdateUserDTO>(`${BASE_URL}/api`, {
          query: `mutation updateUser($user: UpdateUserInput!) {
            user: updateUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`,
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
        const result = await axios.post<DeleteUserDTO>(`${BASE_URL}/api`, {
          query: `mutation deleteUser($id: Int!) {
            result: deleteUser(id: $id)
          }`,
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
        await axios.post(`${BASE_URL}/api`, {
          query: `mutation storeUser($user: StoreUserInput!) {
            user: storeUser(user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`,
          variables: {
            user: {
              lastName: 'Lzq',
              name: 'Anthony'
            }
          }
        })

        const result = await axios.post<DeleteAllUsersDTO>(`${BASE_URL}/api`, {
          query: `mutation deleteAllUsers {
            result: deleteAllUsers
          }`
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
