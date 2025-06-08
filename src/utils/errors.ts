import { HttpStatus } from './api';

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR',
    public statusCode: number = HttpStatus.Unauthorized
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
