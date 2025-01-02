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
  Query,
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
    @Body('imagesMetadata') imagesMetadata: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const parsedMetadata = JSON.parse(imagesMetadata);
    return this.productsService.create(
      { ...createProductDto, imagesMetadata: parsedMetadata },
      images,
    );
  }

  @Get()
  @Roles('admin', 'product_viewer')
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.productsService.findAll({
      page: +page,
      limit: +limit,
      search,
      category,
    });
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
    @Body('imagesMetadata') imagesMetadata: string,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const parsedMetadata = JSON.parse(imagesMetadata);
    return this.productsService.update(
      id,
      { ...updateProductDto, imagesMetadata: parsedMetadata },
      images,
    );
  }

  @Delete(':id')
  @Roles('admin', 'product_manager')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
