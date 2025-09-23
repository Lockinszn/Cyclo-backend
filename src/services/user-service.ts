import db from "@/db";
import { userFollows, users } from "@/db/schemas";
import { UserProfile } from "../types/user-types";
import { eq, or, like, and, desc } from "drizzle-orm";

export class UserService {

    static async getUserById(userId: string): Promise<UserProfile | null> {
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        return user ?? null;
    }

    static async searchUsers(searchTerm: string): Promise<UserProfile[]> {
        if (!searchTerm.trim()) return [];

        const searchPattern = `%${searchTerm.trim()}%`;

        const matchedUsers = await db.select().from(users).where(
            and(
                eq(users.isBanned, false),
                eq(users.isEmailVerified, true),
                or(
                    like(users.username, searchPattern),
                    like(users.firstName, searchPattern),
                    like(users.lastName, searchPattern)
                )
            )
        ).limit(20);

        return matchedUsers;
    }

    static async toggleFollow(userId: string, followedUserId: string): Promise<{ isFollowing: boolean }> {
        const followerExists = await db.query.userFollows.findFirst({
            where: and(
                eq(userFollows.followerId, followedUserId),
                eq(userFollows.followingId, userId)
            )
        });

        if (followerExists) {
            await db.delete(userFollows).where(
                and(
                    eq(userFollows.followerId, userId),
                    eq(userFollows.followingId, followedUserId)
                )
            );
            return { isFollowing: false }
        }

        await db.insert(userFollows).values({
            followerId: userId,
            followingId: followedUserId
        });

        return { isFollowing: true };
    }

    static async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<UserProfile[]> {
        
        const followers = await db.select().from(userFollows)
        .where(eq(userFollows.followingId, userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(limit)
        .innerJoin(users, eq(userFollows.followerId, users.id));

        return followers;
    }

    static async getFollowings(userId: string, limit: number = 20, offset: number = 0): Promise<UserProfile[]> {

        const followings = await db.select().from(userFollows)
        .where(eq(userFollows.followerId, userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(limit)
        .innerJoin(users, eq(userFollows.followingId, users.id));

        return followings;
    }
}