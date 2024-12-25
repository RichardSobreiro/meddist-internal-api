// src/users/dto/update-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
export class UpdateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @MinLength(3)
  username: string;
}
