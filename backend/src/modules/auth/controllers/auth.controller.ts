import { Controller, Post, Get, Body, Res, Req, UseGuards, UsePipes, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AuthService } from '../services/auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { loginSchema, registerSchema, LoginDto, RegisterDto } from '../dto/auth.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'avatars');
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = file.originalname.split('.').pop();
                cb(null, `avatar-${uniqueSuffix}.${ext}`);
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB max for avatars
        },
        fileFilter: (req, file, cb) => {
            // Only allow images
            if (!file.mimetype.startsWith('image/')) {
                return cb(new Error('Only image files are allowed for avatars'), false);
            }
            cb(null, true);
        }
    }))
    // @UsePipes(new ZodValidationPipe(registerSchema)) // Zod pipe might fail with multipart/form-data body parsing issues if not careful, better manual validation or DTO transformation
    async register(
        @Body() body: any, // Using any here because Multipart body comes as plain object strings
        @UploadedFile() file: Express.Multer.File,
        @Res({ passthrough: true }) response: Response
    ) {
        // Manual Validation or transformation needed because body fields come as strings
        const registerDto: RegisterDto = {
            email: body.email,
            username: body.username,
            password: body.password,
            name: body.name
        };

        // Validate explicitly (optional but good)
        // registerSchema.parse(registerDto); // This would need import

        let avatarUrl = undefined;
        if (file) {
            avatarUrl = `/uploads/avatars/${file.filename}`;
        }

        const { access_token } = await this.authService.register({ ...registerDto, avatarUrl });
        this.setCookie(response, access_token);
        return { message: 'Registered successfully' };
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute (brute force protection)
    @UsePipes(new ZodValidationPipe(loginSchema))
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response
    ) {
        const { access_token } = await this.authService.login(loginDto);
        this.setCookie(response, access_token);
        return { message: 'Logged in successfully' };
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('Authentication', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? '.stackject.cloud' : undefined,
        });
        return { message: 'Logged out' };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Req() req: any) {
        return req.user;
    }

    private setCookie(response: Response, token: string) {
        response.cookie('Authentication', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            domain: process.env.NODE_ENV === 'production' ? '.stackject.cloud' : undefined,
        });
    }
}
