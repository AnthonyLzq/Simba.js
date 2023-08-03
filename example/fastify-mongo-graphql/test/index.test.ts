import axios from 'axios'
import z from 'zod'

import { Server } from '../src/network'
import { userDto } from '../src/schemas'

const BASE_URL = `http://localhost:${process.env.PORT || 1996}`
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
    let userID = ''

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
        const result = await axios.post<StoreUserDTO>(`${BASE_URL}/graphql`, {
          query: `mutation store($user: UserInput!) {
            user: store(user: $user) {
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
        const result = await axios.post<GetOneUserDTO>(`${BASE_URL}/graphql`, {
          query: `query getById($id: String!) {
            user: getById(id: $id) {
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
        const result = await axios.post<UpdateUserDTO>(`${BASE_URL}/graphql`, {
          query: `mutation update($id: String!, $user: UserInput!) {
            user: update(id: $id, user: $user) {
              id
              name
              lastName
              createdAt
              updatedAt
            }
          }`,
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
        const result = await axios.post<DeleteUserDTO>(`${BASE_URL}/graphql`, {
          query: `mutation deleteById($id: String!) {
            result: deleteById(id: $id)
          }`,
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
})
