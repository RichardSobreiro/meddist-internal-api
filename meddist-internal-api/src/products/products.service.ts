import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as AWS from 'aws-sdk';

@Injectable()
export class ProductsService {
  private readonly s3: AWS.S3;

  constructor(
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
    const { categories, images: dtoImages, ...productData } = createProductDto;

    const categoryEntities = categories.map((categoryId) => ({
      id: categoryId,
    }));

    const product = this.productRepository.create({
      ...productData,
      categories: categoryEntities,
    });

    const savedProduct = await this.productRepository.save(product);

    const savedImages = [];
    for (const image of images) {
      const uploadedImage = await this.uploadImageToS3(image, savedProduct.id);
      const productImage = this.productImageRepository.create({
        url: uploadedImage.url,
        isPrimary: !!dtoImages.find(
          (img) => img.url === image.originalname && img.isPrimary,
        ),
        isListImage: !!dtoImages.find(
          (img) => img.url === image.originalname && img.isListImage,
        ),
        product: savedProduct,
      });
      savedImages.push(await this.productImageRepository.save(productImage));
    }

    savedProduct.images = savedImages;
    return savedProduct;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    uploadedFiles: Express.Multer.File[],
  ): Promise<Product> {
    const product = await this.findOne(id);

    const { images: incomingImages, ...productData } = updateProductDto;
    Object.assign(product, productData);
    const updatedProduct = await this.productRepository.save(product);

    if (incomingImages || uploadedFiles) {
      const existingImages = await this.productImageRepository.find({
        where: { product: { id } },
      });

      const incomingImageIds = new Set(
        incomingImages?.map((img) => img.id) || [],
      );

      const imagesToDelete = existingImages.filter(
        (img) => !incomingImageIds.has(img.id),
      );

      for (const image of imagesToDelete) {
        const fileKey = image.url.split('.com/')[1];
        await this.deleteImageFromS3(fileKey);
        await this.productImageRepository.remove(image);
      }

      for (const file of uploadedFiles) {
        const uploadedImage = await this.uploadImageToS3(
          file,
          updatedProduct.id,
        );

        const imageDto = incomingImages?.find(
          (img) => img.url === uploadedImage.url,
        );

        const productImage = this.productImageRepository.create({
          url: uploadedImage.url,
          isPrimary: imageDto?.isPrimary || false,
          isListImage: imageDto?.isListImage || false,
          product: updatedProduct,
        });
        await this.productImageRepository.save(productImage);
      }

      if (incomingImages) {
        for (const imageDto of incomingImages) {
          const existingImage = existingImages.find(
            (img) => img.id === imageDto.id,
          );
          if (existingImage) {
            Object.assign(existingImage, {
              isPrimary: imageDto.isPrimary,
              isListImage: imageDto.isListImage,
            });
            await this.productImageRepository.save(existingImage);
          }
        }
      }
    }

    return updatedProduct;
  }

  private async uploadImageToS3(file: Express.Multer.File, productId: string) {
    const fileName = `${productId}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    try {
      const uploadResult = await this.s3.upload(params).promise();
      return { url: uploadResult.Location };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async findAll({
    page = 1,
    limit = 10,
  }: {
    page: number;
    limit: number;
  }): Promise<{ products: Product[]; totalPages: number }> {
    const [products, total] = await this.productRepository.findAndCount({
      relations: ['images'],
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return { products, totalPages };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
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

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Product not found');

    for (const image of product.images) {
      const fileKey = image.url.split('.com/')[1];
      await this.deleteImageFromS3(fileKey);
    }

    await this.productRepository.remove(product);
  }
}
