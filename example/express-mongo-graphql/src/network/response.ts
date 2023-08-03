import { type Response } from 'express'

const response = ({
  error,
  message,
  res,
  status
}: {
  error: boolean
  message: unknown
  res: Response
  status: number
}) => {
  res.status(status).send({ error, message })
}

export { response }
