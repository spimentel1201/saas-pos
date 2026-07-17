import { DomainError } from '../../../../shared/domain/errors/domain-error.js';

export class NotificationSendError extends DomainError {
  constructor(message: string) {
    super({
      type: 'about:blank',
      title: 'Notification Send Error',
      status: 422,
      detail: message,
    });
  }
}

export class NotificationNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      type: 'about:blank',
      title: 'Notification Not Found',
      status: 404,
      detail: `Notification with ID ${id} not found`,
    });
  }
}

export class InvalidNotificationTypeError extends DomainError {
  constructor(type: string) {
    super({
      type: 'about:blank',
      title: 'Invalid Notification Type',
      status: 400,
      detail: `Invalid notification type: ${type}`,
    });
  }
}

export class NotificationRateLimitError extends DomainError {
  constructor(recipient: string) {
    super({
      type: 'about:blank',
      title: 'Notification Rate Limit',
      status: 429,
      detail: `Rate limit exceeded for recipient: ${recipient}`,
    });
  }
}
