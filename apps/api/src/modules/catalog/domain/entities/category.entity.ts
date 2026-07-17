import { ulid } from 'ulid';

export class CategoryId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): CategoryId {
    return new CategoryId(ulid());
  }

  static fromString(value: string): CategoryId {
    if (!value || value.length !== 26) {
      throw new Error(`CategoryId inválido: ${value}`);
    }
    return new CategoryId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CategoryId): boolean {
    return this.value === other.value;
  }
}

interface CategoryProps {
  id: CategoryId;
  tenantId: string;
  parentId?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  private readonly props: CategoryProps;

  private constructor(props: CategoryProps) {
    this.props = props;
  }

  static create(props: {
    tenantId: string;
    name: string;
    parentId?: string;
    description?: string;
    sortOrder?: number;
  }): Category {
    return new Category({
      id: CategoryId.generate(),
      tenantId: props.tenantId,
      parentId: props.parentId,
      name: props.name.trim(),
      description: props.description?.trim(),
      sortOrder: props.sortOrder ?? 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static rehydrate(props: CategoryProps): Category {
    return new Category(props);
  }

  get id(): CategoryId {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get parentId(): string | undefined {
    return this.props.parentId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateName(name: string): void {
    this.props.name = name.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  updateParent(parentId?: string): void {
    if (parentId === this.props.id.toString()) {
      throw new Error('Una categoría no puede ser padre de sí misma');
    }
    this.props.parentId = parentId;
    this.touch();
  }

  updateSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  toDTO(): CategoryDTO {
    return {
      id: this.props.id.toString(),
      tenantId: this.props.tenantId,
      parentId: this.props.parentId,
      name: this.props.name,
      description: this.props.description,
      sortOrder: this.props.sortOrder,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}

export interface CategoryDTO {
  id: string;
  tenantId: string;
  parentId?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
