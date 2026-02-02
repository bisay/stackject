import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('FATAL: JWT_SECRET environment variable is not set!');
        }
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    return request?.cookies?.Authentication;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user) {
            throw new UnauthorizedException();
        }
        // Return safe user object (exclude password)
        const { password, ...result } = user;
        return result;
    }
}
