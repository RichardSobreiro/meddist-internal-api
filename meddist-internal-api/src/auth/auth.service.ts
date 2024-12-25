// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(email, password);
    if (user) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
      expiresIn: '1d', // 15 minutes access token
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: '7d', // 7 days refresh token
    });
    return {
      access_token,
      refresh_token,
    };
  }

  async getNewAccessToken(refresh_token: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });
      const access_token = this.jwtService.sign(
        { email: payload.email, sub: payload.sub },
        {
          secret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
          expiresIn: '15m', // 15 minutes access token
        },
      );
      return access_token;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: any) {
      throw new Error('Refresh token invalid');
    }
  }
}
