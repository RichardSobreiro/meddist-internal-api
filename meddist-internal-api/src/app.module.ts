import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { User } from './users/user.entity';
import { Address } from './addresses/address.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
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
          entities: [User, Address],
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
    ProductsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
