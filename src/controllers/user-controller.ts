import { UserService } from '@/services/user-service';
import { ApiResponse } from '../types/api-types';
import { Request, Response } from 'express';
import { UpdateProfileRequest } from '../types/user-types';
import { ValidationUtils } from '@/utils/validation-utils';

export class UserController {
    static async getUserProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const user = await UserService.getUserById(userId);
            if (!user) return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "User not found",
                }
            });

            return res.status(200).json({ success: true, message: "Fetched user profile successfully", data: { user } });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Error getting user profile",
                },
            } as ApiResponse);
        }
    }

    static async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;

            const user = await UserService.getUserById(userId);
            if (!user) return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "User not found"
                }
            });

            return res.status(200).json({ success: true, message: "Fetched user profile successfully", data: { user } });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get user profil",
                }
            });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const reqBody = req.body as UpdateProfileRequest;
            const validation = ValidationUtils.updateProfileSchema.safeParse(reqBody);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid input data",
                        details: validation.error?.issues.map((err) => ({
                            field: err.path.join("."),
                            message: err.message,
                        })),
                    },
                });
            }

            const updateProfileData: UpdateProfileRequest = validation.data as any;

            const profileUpdated = await UserService.updateUserProfile(userId, updateProfileData);
            if (!profileUpdated) return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "User not found"
                }
            });

            return res.status(200).json({ success: true, message: "User profile updated successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get followings",
                },
                message: "Error getting user profile"
            } as ApiResponse);
        }
    }

    static async searchUsers(req: Request, res: Response) {
        try {
            const { q } = req.query as { q: string };

            const matchedUsers = await UserService.searchUsers(q);
            const message = `${matchedUsers.length ? matchedUsers.length : 'No'} users found`;
            return res.status(200).json({ success: true, message, data: { matchedUsers, count: matchedUsers.length } });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not search for users",
                }
            });
        }
    }

    static async followUser(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;
            const userToFollowId = req.params.id as string;

            const { isFollowing } = await UserService.toggleFollow(userId, userToFollowId);
            if (!isFollowing) return res.status(400).json({
                success: false, error: {
                    code: "BAD_REQUEST",
                    message: "Error following user"
                }
            });

            return res.status(200).json({ success: true, message: "User followed successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured while attempting to follow this user",
                }
            });
        }
    }

    static async unfollowUser(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;
            const followedUserId = req.params.id as string;

            const { isFollowing } = await UserService.toggleFollow(userId, followedUserId);
            if (isFollowing) return res.status(400).json({
                success: false,
                error: {
                    code: "BAD_REQUEST",
                    message: "An error occured wile tryin to unfollow user"
                }
            });

            return res.status(200).json({ success: true, message: "User unfollowed successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get followings",
                },
                message: "A problem occured; could not unfollow user"
            } as ApiResponse);
        }
    }

    static async getFollowers(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const { limit, offset }: { limit: number, offset: number } = req.body;

            const followers = UserService.getFollowers(userId, limit, offset);
            return res.status(200).json({ success: true, data: { followers } })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get followers",
                }
            });
        }
    }

    static async getFollowing(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const { limit, offset }: { limit: number, offset: number } = req.body;

            const following = await UserService.getFollowings(userId, limit, offset);
            return res.status(200).json({ success: true, data: { following } })
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get followings",
                },
            });
        }
    }

    static async getAccountStats(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const data = await UserService.getAccountStats(userId);
            if(!data) return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Account not found"
                }
            });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured. Could not get account statistics",
                },
            });
        }
    }

    static async deactivateAccount(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            await UserService.deactivateAccount(userId);

            return res.status(200).json({ success: true, message: "Account deactivated successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "A problem occured while tryin to deactivate this account",
                },
            });
        }
    }

    static async deleteAccount(req: Request, res: Response) {
        try {
            const userId = req.user?.userId as string;

            const accountDeleted = UserService.deleteAccount(userId);
            if (!accountDeleted) return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Account not found"
                }
            });

            return res.status(200).json({ success: true, message: "Account deleted successfully" });

        } catch (error) {
            console.error("User controller error:", error);
            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "An internal server error occurred",
                },
            });
        }
    }
}
