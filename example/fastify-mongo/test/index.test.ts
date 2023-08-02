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

    describe('API: POST /api/users', () => {
      const storeUserResponse = z.object({
        error: z.boolean(),
        message: userDto
      })

      type StoreUserDTO = z.infer<typeof storeUserResponse>

      it('Should create a user successfully', async () => {
        const result = await axios.post<StoreUserDTO>(`${BASE_URL}/api/users`, {
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
          `${BASE_URL}/api/user/${userID}`
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
          `${BASE_URL}/api/user/${userID}`,
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
          `${BASE_URL}/api/user/${userID}`
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
})
