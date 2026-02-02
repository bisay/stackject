import { Controller, Get, Post, Body, Param, UseGuards, Req, UsePipes } from '@nestjs/common';
import { BlogService } from '../services/blog.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { articleSchema, CreateArticleDto } from '../dto/blog.dto';

@Controller('blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) { }

    @Get()
    findAll() {
        return this.blogService.findAll();
    }

    @Get(':slug')
    findOne(@Param('slug') slug: string) {
        return this.blogService.findOne(slug);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ZodValidationPipe(articleSchema))
    create(@Req() req: any, @Body() data: CreateArticleDto) {
        return this.blogService.create(req.user.id, data);
    }
}
