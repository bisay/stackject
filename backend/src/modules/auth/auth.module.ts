import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            useFactory: () => {
                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    throw new Error('FATAL: JWT_SECRET environment variable is not set!');
                }
                return {
                    secret,
                    signOptions: { expiresIn: '1d' },
                };
            }
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
