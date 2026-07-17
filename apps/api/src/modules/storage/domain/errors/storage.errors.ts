import { DomainError } from '../../../../shared/domain/errors/domain-error.js';

export class FileUploadError extends DomainError {
  constructor(message: string) {
    super({
      type: 'about:blank',
      title: 'File Upload Error',
      status: 422,
      detail: message,
    });
  }
}

export class FileDeleteError extends DomainError {
  constructor(message: string) {
    super({
      type: 'about:blank',
      title: 'File Delete Error',
      status: 422,
      detail: message,
    });
  }
}

export class FileNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      type: 'about:blank',
      title: 'File Not Found',
      status: 404,
      detail: `File with ID ${id} not found`,
    });
  }
}

export class InvalidFileTypeError extends DomainError {
  constructor(mimeType: string) {
    super({
      type: 'about:blank',
      title: 'Invalid File Type',
      status: 400,
      detail: `File type ${mimeType} is not allowed`,
    });
  }
}

export class FileTooLargeError extends DomainError {
  constructor(size: number, limit: number) {
    super({
      type: 'about:blank',
      title: 'File Too Large',
      status: 400,
      detail: `File size ${size} exceeds limit of ${limit} bytes`,
    });
  }
}
