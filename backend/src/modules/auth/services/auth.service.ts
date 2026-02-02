import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: RegisterDto & { avatarUrl?: string }) {
        this.logger.log(`Registering user: ${data.email}`);

        // Check for existing email or username
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username }
                ]
            },
        });

        if (existingUser) {
            this.logger.warn(`User already exists: ${data.email} or ${data.username}`);
            throw new BadRequestException('Email or Username already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                name: data.name,
                avatarUrl: data.avatarUrl,
            },
        });

        this.logger.log(`User created successfully: ${user.id}`);
        return this.generateToken(user);
    }

    async login(data: LoginDto) {
        this.logger.log(`Login attempt for: ${data.email}`);

        const user = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            this.logger.warn(`Login failed: User not found for email ${data.email}`);
            throw new UnauthorizedException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            this.logger.warn(`Login failed: Invalid password for ${data.email}`);
            throw new UnauthorizedException('Invalid password');
        }

        this.logger.log(`Login successful for user: ${user.id}`);
        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
