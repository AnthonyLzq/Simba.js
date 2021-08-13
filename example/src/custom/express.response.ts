import { Response } from 'express'

/*
 * With this piece of code we can personalize the attributes of the response,
 * in case we need it.
 */

interface CustomResponse extends Response {
  newValue?: string
}

export { CustomResponse as Response }
