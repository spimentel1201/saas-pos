export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface NotificationParams {
  id: string;
  tenantId: string;
  userId?: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipient: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

export class Notification {
  private constructor(
    private readonly _id: string,
    private readonly _tenantId: string,
    private readonly _userId: string | undefined,
    private readonly _type: NotificationType,
    private readonly _subject: string,
    private readonly _body: string,
    private readonly _recipient: string,
    private readonly _priority: NotificationPriority,
    private readonly _metadata: Record<string, unknown>,
    private _status: NotificationStatus,
    private readonly _createdAt: Date,
    private _sentAt: Date | undefined,
    private _readAt: Date | undefined,
  ) {}

  static create(params: NotificationParams): Notification {
    if (!params.subject || params.subject.trim().length === 0) {
      throw new Error('Notification subject cannot be empty');
    }

    if (!params.body || params.body.trim().length === 0) {
      throw new Error('Notification body cannot be empty');
    }

    if (!params.recipient || params.recipient.trim().length === 0) {
      throw new Error('Notification recipient cannot be empty');
    }

    return new Notification(
      params.id,
      params.tenantId,
      params.userId,
      params.type,
      params.subject.trim(),
      params.body.trim(),
      params.recipient.trim(),
      params.priority || NotificationPriority.NORMAL,
      params.metadata || {},
      NotificationStatus.PENDING,
      new Date(),
      undefined,
      undefined,
    );
  }

  static rehydrate(params: {
    id: string;
    tenantId: string;
    userId?: string;
    type: NotificationType;
    subject: string;
    body: string;
    recipient: string;
    priority: NotificationPriority;
    metadata: Record<string, unknown>;
    status: NotificationStatus;
    createdAt: Date;
    sentAt?: Date;
    readAt?: Date;
  }): Notification {
    return new Notification(
      params.id,
      params.tenantId,
      params.userId,
      params.type,
      params.subject,
      params.body,
      params.recipient,
      params.priority,
      params.metadata,
      params.status,
      params.createdAt,
      params.sentAt,
      params.readAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get type(): NotificationType {
    return this._type;
  }

  get subject(): string {
    return this._subject;
  }

  get body(): string {
    return this._body;
  }

  get recipient(): string {
    return this._recipient;
  }

  get priority(): NotificationPriority {
    return this._priority;
  }

  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get readAt(): Date | undefined {
    return this._readAt;
  }

  get isPending(): boolean {
    return this._status === NotificationStatus.PENDING;
  }

  get isSent(): boolean {
    return (
      this._status === NotificationStatus.SENT || this._status === NotificationStatus.DELIVERED
    );
  }

  get isRead(): boolean {
    return this._status === NotificationStatus.READ;
  }

  markAsSent(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error('Only pending notifications can be marked as sent');
    }
    this._status = NotificationStatus.SENT;
    this._sentAt = new Date();
  }

  markAsDelivered(): void {
    if (this._status !== NotificationStatus.SENT) {
      throw new Error('Only sent notifications can be marked as delivered');
    }
    this._status = NotificationStatus.DELIVERED;
  }

  markAsRead(): void {
    if (this._status === NotificationStatus.FAILED) {
      throw new Error('Failed notifications cannot be marked as read');
    }
    this._status = NotificationStatus.READ;
    this._readAt = new Date();
  }

  markAsFailed(): void {
    this._status = NotificationStatus.FAILED;
  }
}
