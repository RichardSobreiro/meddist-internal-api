import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, description, parentId } = createCategoryDto;

    const category = this.categoryRepository.create({ name, description });

    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parent', 'children', 'products'],
    });
  }

  async findAllWithPagination(
    page: number,
    limit: number,
  ): Promise<{
    categories: Category[];
    totalPages: number;
    currentPage: number;
  }> {
    const [categories, total] = await this.categoryRepository.findAndCount({
      relations: ['parent', 'children', 'products'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return { categories, totalPages, currentPage: page };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    const { name, description, parentId } = updateCategoryDto;

    if (name) {
      category.name = name;
    }
    if (description) {
      category.description = description;
    }
    if (parentId) {
      if (parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
