import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
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
        })
    ],
    controllers: [FilesController],
    providers: [FilesService],
})
export class FilesModule { }
