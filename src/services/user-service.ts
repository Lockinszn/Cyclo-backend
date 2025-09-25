import db from "@/db";
import { accounts, posts, userFollows, users } from "@/db/schemas";
import { AccountStats, BasicUserInfo, Followers, Followings, UpdateProfileRequest, UserProfile } from "../types/user-types";
import { eq, or, ilike, and, desc, count, sql } from "drizzle-orm";

export class UserService {

    static async getUserById(userId: string): Promise<UserProfile | null> {
        try {
            const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            return user ?? null;
        } catch (error) {
            throw error;
        }
    }

    static async updateUserProfile(userId: string, data: UpdateProfileRequest) {
        try {
            const userExists = db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            if (!userExists) return false;

            await db.update(users)
                .set({ updatedAt: new Date, ...data })
                .where(eq(users.id, userId));

            return true;

        } catch (error) {
            throw error;
        }
    }

    static async searchUsers(searchTerm: string): Promise<BasicUserInfo[]> {
        try {
            if (!searchTerm.trim()) return [];

            const searchPattern = `%${searchTerm.trim()}%`;

            const matchedUsers = await db.select().from(users).where(
                and(
                    eq(users.isBanned, false),
                    eq(users.isEmailVerified, true),
                    or(
                        ilike(users.username, searchPattern),
                        ilike(users.firstName, searchPattern),
                        ilike(users.lastName, searchPattern)
                    )
                )
            ).limit(20);

            return matchedUsers;
        } catch (error) {
            throw error;
        }
    }

    static async toggleFollow(userId: string, followedUserId: string): Promise<{ isFollowing: boolean }> {
        try {
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
        } catch (error) {
            throw error;
        }
    }

    static async getFollowers(userId: string, limit: number = 20, offset: number = 0): Promise<Followers[] | null> {
        try {
            const userExists = db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            if (!userExists) return null;

            const followers = await db.select({
                username: users.displayUsername,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                bio: users.bio,
                avatar: users.avatar
            }).from(userFollows)
                .where(eq(userFollows.followingId, userId))
                .orderBy(desc(userFollows.createdAt))
                .limit(limit)
                .innerJoin(users, eq(userFollows.followerId, users.id));

            return followers;
        } catch (error) {
            throw error;
        }
    }

    static async getFollowings(userId: string, limit: number = 20, offset: number = 0): Promise<Followings[] | null> {
        try {
            const userExists = db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            if (!userExists) return null;

            const followings = await db.select({
                username: users.displayUsername,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                bio: users.bio,
                avatar: users.avatar
            }).from(userFollows)
                .where(eq(userFollows.followerId, userId))
                .orderBy(desc(userFollows.createdAt))
                .limit(limit)
                .innerJoin(users, eq(userFollows.followingId, users.id));

            return followings;
        } catch (error) {
            throw error;
        }
    }

    static async getAccountStats(userId: string): Promise<AccountStats | null> {
        try {
            const user = db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            if (!user) return null;

            const result = await db.execute(sql`
                    SELECT u.email, u.username, u.bio, u.location, u.avatar,
                    u.first_name as firstName,
                    u.last_name as lastName,
                    (SELECT count(*) FROM posts WHERE posts.author_id = ${userId}) as postsCount,
                    (SELECT count(*) FROM user_follows WHERE user_follows.following_id = ${userId}) as followersCount,
                    (SELECT count(*) FROM user_follows WHERE user_follows.follower_id = ${userId}) as followingCount
                    from users u
                    where u.id = ${userId}
                    LIMIT 1;
                `);
            return (result as any)[0] as AccountStats;
        } catch (error) {
            throw error;
        }
    }

    static async deactivateAccount(userId: string): Promise<boolean> {
        try {
            const userExists = db.query.users.findFirst({
                where: eq(users.id, userId)
            });
            if (!userExists) return false;

            // await db.update("users").set({ })



            return true;
        } catch (error) {
            throw error;
        }
    }

    static async deleteAccount(userId: string): Promise<boolean> {
        try {
            const accountExists = db.query.accounts.findFirst({
                where: eq(accounts.userId, userId)
            });
            if (!accountExists) return false;

            await db.delete(accounts).where(eq(accounts.userId, userId));

            return true;
        } catch (error) {
            throw error;
        }
    }
}