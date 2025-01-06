import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { User } from './users/user.entity';
import { Address } from './addresses/entities/address.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { Category } from './categories/entities/category.entity';
import { CategoriesModule } from './categories/categories.module';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { LocationsModule } from './locations/locations.module';
import { Location } from './locations/entities/location.entity';
import { InventoryModule } from './inventory/inventory.module';
import { Channel } from './channels/entities/channel.entity';
import { InventoryLog } from './inventory/entities/invetory-log.entity';
import { ProductInventory } from './inventory/entities/product-invetory.entity';
import { ChannelModule } from './channels/channel.module';

@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(), // Ensures files are stored in memory for easy upload
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration globally available
      envFilePath: '../.env', // Default is .env, but you can specify the path
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: parseInt(configService.get<string>('DATABASE_PORT'), 10),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          entities: [
            User,
            Address,
            Product,
            ProductImage,
            Category,
            Location,
            Channel,
            InventoryLog,
            ProductInventory,
          ],
          synchronize: true, // Note: set to false in production
          ssl: {
            rejectUnauthorized: false,
            requestCert: false,
          },
          logging: true,
          logger: 'advanced-console',
        };
        // Debug log to verify environment variables
        console.log('Database Config:', dbConfig);

        return dbConfig as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
    ChannelModule,
    InventoryModule,
    LocationsModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
