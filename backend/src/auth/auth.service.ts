import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const exists = await this.usersService.findByEmail(email);
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({ email, password: hashed });
    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.refreshToken) throw new UnauthorizedException();

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { refreshToken: null });
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    const { password, refreshToken, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshToken: hashed });

    return { accessToken, refreshToken };
  }
}