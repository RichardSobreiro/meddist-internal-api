import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as AWS from 'aws-sdk';

@Injectable()
export class ProductsService {
  private readonly s3: AWS.S3;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async create(
    createProductDto: CreateProductDto,
    images: Express.Multer.File[],
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { categories, imagesMetadata, ...productData } = createProductDto;

      const categoryArray = Array.isArray(categories)
        ? categories
        : [categories];
      const categoryEntities = categoryArray.map((categoryId) => ({
        id: categoryId,
      }));

      const product = this.productRepository.create({
        ...productData,
        categories: categoryEntities,
      });
      const savedProduct = await queryRunner.manager.save(product);

      const savedImages = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const metadata = Array.isArray(imagesMetadata)
          ? imagesMetadata.find((meta) => meta.position === i)
          : imagesMetadata;

        const uploadedImage = await this.uploadImageToS3(file, savedProduct.id);

        const productImage = this.productImageRepository.create({
          url: `${process.env.AWS_CLOUD_FRONT_URL}/${uploadedImage.fileName}`,
          isPrimary: metadata?.isPrimary || false,
          isListImage: metadata?.isListImage || false,
          product: savedProduct,
        });

        const savedImage = await queryRunner.manager.save(productImage);
        savedImages.push(savedImage);
      }

      savedProduct.images = savedImages;

      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Transaction failed:', error);
      throw new InternalServerErrorException('Failed to create product');
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    uploadedFiles: Express.Multer.File[],
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id },
        relations: ['images'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const { imagesMetadata, ...productData } = updateProductDto;
      Object.assign(product, productData);
      const updatedProduct = await queryRunner.manager.save(product);

      const existingImages = await queryRunner.manager.find(ProductImage, {
        where: { product: { id } },
      });

      const imagesMetadataArray = Array.isArray(imagesMetadata)
        ? imagesMetadata
        : [imagesMetadata];
      const incomingImageIds = new Set(
        imagesMetadataArray.map((meta) => meta.id).filter(Boolean),
      );
      const imagesToDelete = existingImages.filter(
        (img) => !incomingImageIds.has(img.id),
      );

      for (const image of imagesToDelete) {
        const fileKey = image.url.split('.net/')[1];
        await this.deleteImageFromS3(fileKey);
        await queryRunner.manager.remove(image);
      }

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const metadata = imagesMetadataArray.find(
          (meta) => meta.position === i,
        );

        const uploadedImage = await this.uploadImageToS3(
          file,
          updatedProduct.id,
        );

        const productImage = this.productImageRepository.create({
          url: `${process.env.AWS_CLOUD_FRONT_URL}/${uploadedImage.fileName}`,
          isPrimary: metadata?.isPrimary || false,
          isListImage: metadata?.isListImage || false,
          product: updatedProduct,
        });

        await queryRunner.manager.save(productImage);
      }

      // Update metadata for existing images
      for (const metadata of imagesMetadataArray) {
        if (metadata.id) {
          const existingImage = existingImages.find(
            (img) => img.id === metadata.id,
          );
          if (existingImage) {
            Object.assign(existingImage, {
              isPrimary: metadata.isPrimary,
              isListImage: metadata.isListImage,
            });
            await queryRunner.manager.save(existingImage);
          }
        }
      }

      await queryRunner.commitTransaction();
      return updatedProduct;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Transaction failed:', error);
      throw new InternalServerErrorException('Failed to update product');
    } finally {
      await queryRunner.release();
    }
  }

  private async uploadImageToS3(file: Express.Multer.File, productId: string) {
    const fileName = `${productId}/${Date.now()}_${file.originalname}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const uploadResult = await this.s3.upload(params).promise();
      return { url: uploadResult.Location, fileName };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  private async deleteImageFromS3(fileKey: string) {
    const params = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: fileKey };
    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
    category,
  }: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<{ products: Product[]; totalPages: number }> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    queryBuilder
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.categories', 'categories')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('categories.id = :categoryId', {
        categoryId: category,
      });
    }

    const [products, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return { products, totalPages };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'categories'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Product not found');

    for (const image of product.images) {
      const fileKey = image.url.split('.net/')[1];
      await this.deleteImageFromS3(fileKey);
    }

    await this.productRepository.remove(product);
  }
}
