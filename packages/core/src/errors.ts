export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Acesso negado ou papel insuficiente.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}
