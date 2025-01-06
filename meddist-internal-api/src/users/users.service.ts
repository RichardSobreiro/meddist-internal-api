// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { Address } from '@/addresses/entities/address.entity';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    try {
      await this.userRepository.save(newUser);

      if (createUserDto.addresses.length) {
        for (const addressData of createUserDto.addresses) {
          const newAddress = this.addressRepository.create({
            ...addressData,
            user: newUser,
          });
          await this.addressRepository.save(newAddress);
        }
      }
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('E-mail já existe');
      }
      throw error;
    }

    delete newUser.password;
    return newUser;
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuário não existe!');

    const token = randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.save(user);

    await this.sendResetEmail(user.email, token);
  }

  async sendResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.ECOMMERCE_URL}/alterar-senha?token=${token}`;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const mailOptions = {
      from: smtpUser,
      to: email,
      subject: 'MedDist - Redefinição de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <table width="100%" style="max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <thead style="background-color: #0056b3; color: white; text-align: center; padding: 10px;">
              <tr>
                <th style="padding: 20px;">MedDist - Redefinição de Senha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 20px; text-align: center;">
                  <p style="font-size: 18px; margin-bottom: 20px;">Olá,</p>
                  <p style="margin-bottom: 20px;">
                    Recebemos uma solicitação para redefinir sua senha. Para continuar, clique no botão abaixo:
                  </p>
                  <a 
                    href="${resetUrl}" 
                    style="
                      display: inline-block;
                      padding: 10px 20px;
                      font-size: 16px;
                      color: white;
                      background-color: #0056b3;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                    ">
                    Redefinir Senha
                  </a>
                  <p style="margin-top: 20px; font-size: 14px; color: #555;">
                    Ou copie e cole o seguinte link no seu navegador:<br />
                    <a href="${resetUrl}" style="color: #0056b3; text-decoration: none;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #777;">
                  Se você não solicitou esta redefinição de senha, por favor ignore este email.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });
    if (!user) throw new BadRequestException('Invalid or expired token');

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, attrs: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, attrs);
    await this.userRepository.save(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async validateUser(email: string, password: string): Promise<any | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user; // Exclude password from the result
      return result;
    }
    return null;
  }
}
