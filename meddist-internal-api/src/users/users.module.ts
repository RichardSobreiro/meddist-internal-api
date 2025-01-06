// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Address } from '@/addresses/entities/address.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address])],
  providers: [UsersService, JwtService, ConfigService],
  controllers: [UsersController],
  exports: [UsersService], // Export UsersService if it's used elsewhere
})
export class UsersModule {}
