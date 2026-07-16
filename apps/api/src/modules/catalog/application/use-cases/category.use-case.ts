import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import type { CategoryRepositoryPort } from '../ports/catalog.repository.port.js';
import { Category } from '../../domain/entities/category.entity.js';
import { CATEGORY_REPO, TENANT_SCHEMA } from '../../catalog.tokens.js';

@Injectable()
export class CategoryUseCases {
  constructor(
    @Inject(CATEGORY_REPO) private readonly categoryRepo: CategoryRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
  ) {}

  async create(tenantId: string, dto: any): Promise<any> {
    const existing = await this.categoryRepo.findByName(dto.name, tenantId);
    if (existing) {
      throw new ConflictException('Categoría con ese nombre ya existe');
    }

    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Categoría padre no encontrada');
      if (parent.tenantId !== tenantId) throw new BadRequestException('Categoría padre inválida');
    }

    const category = Category.create({
      tenantId,
      name: dto.name,
      parentId: dto.parentId,
      description: dto.description,
      sortOrder: dto.sortOrder ?? 0,
    });

    return (await this.categoryRepo.save(category)).toDTO();
  }

  async findById(id: string): Promise<any> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category.toDTO();
  }

  async findAll(tenantId: string, includeInactive = false) {
    return (await this.categoryRepo.findAll(tenantId, includeInactive)).map(c => c.toDTO());
  }

  async getTree(tenantId: string): Promise<any[]> {
    const categories = await this.categoryRepo.findTree(tenantId);
    const map = new Map(categories.map(c => [c.id.toString(), { ...c.toDTO(), children: [] as any[] }]));
    const roots: any[] = [];

    for (const cat of categories) {
      const node = map.get(cat.id.toString())!;
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async getActive(tenantId: string) {
    return (await this.categoryRepo.findActiveByTenant(tenantId)).map(c => c.toDTO());
  }

  async getChildren(parentId: string) {
    return (await this.categoryRepo.findChildren(parentId)).map(c => c.toDTO());
  }

  async update(id: string, dto: any): Promise<any> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (dto.name) {
      if (dto.name !== category.name) {
        const existing = await this.categoryRepo.findByName(dto.name, category.tenantId);
        if (existing && existing.id.toString() !== id) {
          throw new ConflictException('Categoría con ese nombre ya existe');
        }
      }
      category.updateName(dto.name);
    }

    if (dto.description !== undefined) category.updateDescription(dto.description);
    if (dto.parentId !== undefined) {
      category.updateParent(dto.parentId);
    }
    if (dto.sortOrder !== undefined) category.updateSortOrder(dto.sortOrder);
    if (dto.isActive === true) category.activate();
    if (dto.isActive === false) category.deactivate();

    return (await this.categoryRepo.save(category)).toDTO();
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const hasChildren = await this.categoryRepo.hasChildren(id);
    if (hasChildren) {
      throw new ConflictException('La categoría tiene subcategorías. Elimínelas o muévalas primero.');
    }

    await this.categoryRepo.delete(id);
  }
}
