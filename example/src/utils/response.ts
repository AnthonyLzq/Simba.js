import { Response } from 'express'

const response = (
  error  : boolean,
  message: unknown,
  res    : Response,
  status : number
): void => {
  res.status(status).send({ error, message })
}

export { response }
