import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscussionsModule } from './modules/discussions/discussions.module';
import { BlogModule } from './modules/blog/blog.module';
import { UsersModule } from './modules/users/users.module';

import { FilesModule } from './modules/files/files.module';
import { MessagesModule } from './modules/messages/messages.module';

import { AdminModule } from './modules/admin/admin.module';

@Module({
    imports: [
        // Rate Limiting: 60 requests per minute per IP
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 60,  // 60 requests
        }]),
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        PrismaModule, ProjectsModule, AuthModule, DiscussionsModule, BlogModule, UsersModule, FilesModule, MessagesModule, AdminModule
    ],
    controllers: [],
    providers: [
        // Apply throttling globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
