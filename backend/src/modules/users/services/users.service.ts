import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                projects: {
                    include: { _count: { select: { discussions: true, followers: true } } }
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        discussion: { select: { title: true, id: true } }
                    }
                },
                discussions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                _count: {
                    select: { projects: true, discussions: true, comments: true, followers: true, following: true }
                },
                followers: {
                    select: {
                        follower: { select: { id: true, name: true, username: true, avatarUrl: true } }
                    },
                    take: 5 // Get 5 recent followers
                }
            }
        });

        if (!user) throw new NotFoundException('User not found');

        return {
            stats: {
                totalProjects: user._count.projects,
                totalDiscussions: user._count.discussions,
                totalComments: user._count.comments,
            },
            projects: user.projects,
            recentActivity: {
                comments: user.comments,
                discussions: user.discussions
            },
            followers: user.followers.map(f => f.follower), // Flatten structure
            counts: {
                followers: user._count.followers,
                following: user._count.following
            }
        };
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
            }
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByUsername(username: string, currentUserId?: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
                role: true,
                bio: true,
                createdAt: true,
                projects: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        imageUrl: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        projects: true,
                        followedProjects: true, // following (projects)
                        followers: true,
                        following: true
                    }
                }
            }
        });

        if (!user) throw new NotFoundException('User not found');

        let isFollowing = false;
        if (currentUserId) {
            const follow = await this.prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!follow;
        }

        // Transform to match frontend interface
        return {
            ...user,
            location: null,
            website: null,
            isFollowing,
            _count: {
                projects: user._count.projects,
                following: user._count.following, // User following User
                followers: user._count.followers
            }
        };
    }

    async follow(followerId: string, targetUserId: string) {
        if (followerId === targetUserId) throw new Error("Cannot follow yourself");

        // Check if already following to toggle or just idempotent? Button usually implies toggle or specific action.
        // Let's implement specific Follow action.

        // Prisma create will fail if exists due to composite ID? No, generic unique constraint.
        // We use upsert or just create and catch.
        // Using upsert is safe.

        return this.prisma.follows.upsert({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: targetUserId
                }
            },
            create: {
                followerId,
                followingId: targetUserId
            },
            update: {}
        });
    }

    async unfollow(followerId: string, targetUserId: string) {
        try {
            return await this.prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId: targetUserId
                    }
                }
            });
        } catch (e) {
            // Ignore if not found
            return null;
        }
    }

    async updateProfile(userId: string, data: { name?: string; email?: string; avatarUrl?: string; bio?: string }) {
        // If email is being changed, check for uniqueness
        if (data.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
            if (existing && existing.id !== userId) {
                throw new Error('Email already in use');
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...data
            }
        });
    }

    async deleteAccount(userId: string, deleteData: boolean) {
        if (deleteData) {
            // Hard delete: Cascade will handle relations
            return this.prisma.user.delete({
                where: { id: userId },
            });
        } else {
            // Soft delete: Anonymize
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');

            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);

            // We append timestamp to maintain uniqueness constraints on email/username
            return this.prisma.user.update({
                where: { id: userId },
                data: {
                    name: `${user.name || 'User'} (Unregistered)`,
                    username: `${user.username}_del_${timestamp}`,
                    email: `deleted_${timestamp}_${random}@stackject.com`,
                    password: `DELETED_${timestamp}_${random}`, // Invalidate login
                    avatarUrl: null, // Avatar file should be deleted by controller or here
                }
            });
        }
    }
}
