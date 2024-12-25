import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('admin', 'product_manager')
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, images);
  }

  @Get()
  @Roles('admin', 'product_viewer')
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'product_viewer')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'product_manager')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, images);
  }

  @Delete(':id')
  @Roles('admin', 'product_manager')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
