export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = 'APP_ERROR',
  ) {
    super(message)
  }
}

export const notFound = (what = 'Recurso') => new AppError(404, `${what} não encontrado`, 'NOT_FOUND')
export const conflict = (message: string) => new AppError(409, message, 'CONFLICT')
export const unauthorized = (message = 'Não autorizado') => new AppError(401, message, 'UNAUTHORIZED')
