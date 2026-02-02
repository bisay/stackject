import { Module } from '@nestjs/common';
import { DiscussionsController } from './controllers/discussions.controller';
import { DiscussionsService } from './services/discussions.service';

@Module({
    controllers: [DiscussionsController],
    providers: [DiscussionsService],
    exports: [DiscussionsService],
})
export class DiscussionsModule { }
