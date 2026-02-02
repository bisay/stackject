
import { Module } from '@nestjs/common';
import { MessagesController } from './controllers/messages.controller';
import { MessagesService } from './services/messages.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [MessagesController],
    providers: [MessagesService],
})
export class MessagesModule { }
