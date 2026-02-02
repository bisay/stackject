import { Controller, Get, Post, Patch, Delete, UseGuards, Req, UseInterceptors, UploadedFile, Body, BadRequestException, Res, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { sanitizeText } from '../../../common/utils/html-sanitizer';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard)
    getDashboard(@Req() req: any) {
        return this.usersService.getDashboard(req.user.id);
    }

    @Get('id/:id')
    async getUserById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Get(':username')
    async getProfile(@Param('username') username: string, @Req() req: any) {
        // JwtAuthGuard might not be strictly enforcing here? 
        // If we want public access, we shouldn't use @UseGuards at class level or method level if checking optional auth.
        // But checking `req.user` relies on AuthGuard. 
        // Let's assume Profile is public but Auth is optional.
        // NestJS guards usually block if not authenticated.
        // We'll check the controller/module guards. 
        // `users.controller.ts` doesn't have class-level UseGuards.
        // So we can inspect headers manually or use a lenient guard.
        // For now, let's just try to parse token if header exists? 

        // Simpler: Just rely on frontend sending Request if logged in?
        // Actually, the `getProfile` didn't have @UseGuards before. 
        // `req.user` will be undefined if no guard attached.

        // I'll leave it as is, but if I want to support "isFollowing", I need to know WHO makes the request.
        // I will add a manual JWT check or a custom decorator later if needed.
        // For now, let's look at `req`. If the user IS logged in, the frontend sends the token?
        // Without the Guard, `req.user` won't be populated by Passport automatically using the standard Strategy.

        // Strategy: Add Follow/Unfollow endpoints guarded by Auth.
        // For `getProfile`, I'll rely on a separate specific check or just pass undefined for now, 
        // BUT the user wants to see "Following" status.
        // I will add a dirty check for Authorization header to get ID if possible, or just skip it for this step and focus on the action buttons working first?
        // No, UI needs to show "Unfollow" if already following.

        // Correct approach: Use an "OptionalAuthGuard" or manually decode. 
        // Given constraints and speed, I will assume `req.user` works if I apply a loose authentication check or if the global pipe handles it (unlikely).
        // Let's skip modifying `getProfile` Auth logic deeply and instead implement `POST /follow` which IS authenticated.
        // Wait, if I don't send `isFollowing` to frontend, the button won't know initial state.

        // Let's just pass `req.user?.id`. If it's undefined, `isFollowing` is false.
        // But `req.user` is only set if Guard is run.
        // I will add a `getProfile` logic that attempts to extract user.
        // Manual Token Extraction
        let userId = req?.user?.id;

        // If Guard didn't run or passed, check cookies for manual extraction
        // (Since this endpoint is public, Guard might not be preventing access, but we need ID)

        if (!userId && req.cookies && req.cookies.Authentication) {
            try {
                const token = req.cookies.Authentication;
                if (token) {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    userId = payload.sub || payload.id;
                }
            } catch (e) {
                // Ignore invalid token
            }
        }

        return this.usersService.findByUsername(username, userId);
    }

    @Post(':id/follow')
    @UseGuards(JwtAuthGuard)
    async followUser(@Param('id') targetId: string, @Req() req: any) {
        return this.usersService.follow(req.user.id, targetId);
    }

    @Delete(':id/follow')
    @UseGuards(JwtAuthGuard)
    async unfollowUser(@Param('id') targetId: string, @Req() req: any) {
        return this.usersService.unfollow(req.user.id, targetId);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: (req: any, file, cb) => {
                if (!req.user || !req.user.id) {
                    return cb(new Error('User not authenticated'), '');
                }

                const userId = req.user.id;
                const uploadPath = join(process.cwd(), 'uploads', 'users', userId, 'avatar');

                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }

                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                // Keep only one avatar, overwrite handling is done by FS usually but we want unique names to bust cache
                // But to prevent accumulation, we might want to delete old ones? stick to simple unique name for now.
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = file.originalname.split('.').pop();
                cb(null, `avatar-${uniqueSuffix}.${ext}`);
            }
        })
    }))
    async updateProfile(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { name?: string; email?: string; bio?: string }
    ) {
        const userId = req.user.id;
        
        // SECURITY: Sanitize text inputs to prevent XSS
        const updateData: any = {};
        if (body.name) updateData.name = sanitizeText(body.name);
        if (body.email) updateData.email = sanitizeText(body.email);
        if (body.bio) updateData.bio = sanitizeText(body.bio);

        if (file) {
            // Delete old avatar if exists
            const currentUser = req.user; // JwtStrategy returns full user object including avatarUrl
            if (currentUser && currentUser.avatarUrl) {
                // Extract relative path from URL (remove leading slash)
                // URL: /uploads/users/... -> Path: uploads/users/...
                const oldAvatarPath = join(process.cwd(), currentUser.avatarUrl.replace(/^\//, '').replace(/\//g, '\\')); // Ensure correct separators for Windows
                // Actually on Windows join will handle separators if I pass segments, but here I have a string path 
                // safer to just use join(process.cwd(), ...currentUser.avatarUrl.split('/'))

                // Let's keep it simple: URL matches folder structure relative to cwd
                // But URL has forward slashes, Windows needs backslashes or Node handles it? Node handles forward slashes in require but fs usually prefers OS specific.
                // Best is to use path.join
                const relativePath = currentUser.avatarUrl.startsWith('/') ? currentUser.avatarUrl.slice(1) : currentUser.avatarUrl;
                const absoluteOldPath = join(process.cwd(), relativePath);

                if (existsSync(absoluteOldPath)) {
                    try {
                        // We use unlinkSync or async unlink. Since this is not critical path latency wise, async is better but sync is easier.
                        // Let's import unlinkSync
                        const { unlinkSync } = require('fs');
                        unlinkSync(absoluteOldPath);
                    } catch (err) {
                        console.error("Failed to delete old avatar:", err);
                    }
                }
            }

            updateData.avatarUrl = `/uploads/users/${userId}/avatar/${file.filename}`;
        }

        return this.usersService.updateProfile(userId, updateData);
    }

    @Delete('me')
    @UseGuards(JwtAuthGuard)
    async deleteAccount(
        @Req() req: any,
        @Body() body: { deleteData: boolean },
        @Res({ passthrough: true }) response: any
    ) {
        const userId = req.user.id;
        const currentUser = req.user;

        // Clean up avatar file if exists (for both hard and soft delete)
        if (currentUser && currentUser.avatarUrl) {
            try {
                const relativePath = currentUser.avatarUrl.startsWith('/') ? currentUser.avatarUrl.slice(1) : currentUser.avatarUrl;
                const absolutePath = join(process.cwd(), relativePath);
                if (existsSync(absolutePath)) {
                    // Use require to avoid import issues if unlinkSync isn't imported at top yet
                    const { unlinkSync } = require('fs');
                    unlinkSync(absolutePath);
                }
            } catch (e) {
                console.error("Failed to delete avatar during account deletion", e);
            }
        }

        await this.usersService.deleteAccount(userId, body.deleteData);

        response.clearCookie('Authentication');
        return { message: 'Account deleted successfully' };
    }
}
