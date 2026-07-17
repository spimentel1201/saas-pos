export enum FileCategory {
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  RECEIPT = 'RECEIPT',
  REPORT = 'REPORT',
  AVATAR = 'AVATAR',
  DOCUMENT = 'DOCUMENT',
}

export interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  publicId: string;
  folder: string;
  category: FileCategory;
  createdAt: Date;
}

export class FileEntity {
  private constructor(
    private readonly _id: string,
    private readonly _originalName: string,
    private readonly _mimeType: string,
    private readonly _size: number,
    private readonly _url: string,
    private readonly _publicId: string,
    private readonly _folder: string,
    private readonly _category: FileCategory,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    publicId: string;
    folder: string;
    category: FileCategory;
  }): FileEntity {
    if (params.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(params.mimeType)) {
      throw new Error(`Unsupported MIME type: ${params.mimeType}`);
    }

    return new FileEntity(
      params.id,
      params.originalName,
      params.mimeType,
      params.size,
      params.url,
      params.publicId,
      params.folder,
      params.category,
      new Date(),
    );
  }

  static rehydrate(params: UploadedFile): FileEntity {
    return new FileEntity(
      params.id,
      params.originalName,
      params.mimeType,
      params.size,
      params.url,
      params.publicId,
      params.folder,
      params.category,
      params.createdAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get originalName(): string {
    return this._originalName;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get size(): number {
    return this._size;
  }

  get url(): string {
    return this._url;
  }

  get publicId(): string {
    return this._publicId;
  }

  get folder(): string {
    return this._folder;
  }

  get category(): FileCategory {
    return this._category;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isImage(): boolean {
    return this._mimeType.startsWith('image/');
  }

  get isPdf(): boolean {
    return this._mimeType === 'application/pdf';
  }

  get sizeInKB(): number {
    return this._size / 1024;
  }

  get sizeInMB(): number {
    return this._size / (1024 * 1024);
  }
}
