type ExpressRequest = import('express').Request

interface CustomRequest extends ExpressRequest {
  body: {
    args?: DtoUser
  }
  // We can add custom headers via intersection, remember that for some reason
  // headers must be in Snake-Pascal-Case
  headers: import('http').IncomingHttpHeaders & {
    'Custom-Header'?: string
  }
}
