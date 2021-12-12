/* eslint-disable no-var */
import { IncomingHttpHeaders } from 'http'
import { Request, Response } from 'express'

import { DtoUser } from 'dto-interfaces'

declare global {
  // This variable is global, so it will be available everywhere in the code
  var response = (
    error: boolean,
    message: unknown,
    res: Response,
    status: number
  ): void => {
    res.status(status).send({ error, message })
  }

  // We can personalize the response and request objects in case we need it by
  // adding new optional attributes to this interface
  interface CustomResponse extends Response {
    newValue?: string
  }

  interface CustomRequest extends Request {
    body: {
      args?: DtoUser
    }
    // We can add custom headers via intersection, remember that for some reason
    // headers must be in Snake-Pascal-Case
    headers: IncomingHttpHeaders & {
      'Custom-Header'?: string
    }
  }
}

export {}
