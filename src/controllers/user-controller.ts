import { UserService } from '@/services/user-service';
import { ApiResponse } from '../types/api-types';
import { Request, Response } from 'express';
import { UpdateProfile } from '../types/user-types';
import { ProfileUpdateValidator } from '@/utils/validation-utils';

export class UserController {
    static async getUserProfile(req: Request, res: Response) {
        try {
            const userId = /* req.user.id as string */ "";

            const user = await UserService.getUserById(userId);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            return res.status(200).json({ success: true, message: "Fetched user profile successfully", data: { user } });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error getting user profile"
            } as ApiResponse);
        }
    }

    static async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id as string;

            const user = await UserService.getUserById(userId);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            return res.status(200).json({ success: true, message: "Fetched user profile successfully", data: { user } });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error getting user profile"
            } as ApiResponse);
        }
    }

    static async updateUserProfile(req: Request, res: Response) {
        try {
            // const userId = req.user.id;
            const reqBody = req.body as UpdateProfile;
            const _ = ProfileUpdateValidator.validate(reqBody);

            return res.status(200).json({ success: true, message: "User profile updated successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
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
                message: "A problem occured during search"
            } as ApiResponse);
        }
    }

    static async followUser(req: Request, res: Response) {
        try {
            const userId = /*req.user.id as string */ "";
            const userToFollowId = req.params.id as string;

            const { isFollowing } = await UserService.toggleFollow(userId, userToFollowId);
            if (!isFollowing) return res.status(400).json({ success: false, message: "Error following user" });

            return res.status(200).json({ success: true, message: "User followed successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "A problem occured while attempting to follow this user"
            } as ApiResponse);
        }
    }

    static async unfollowUser(req: Request, res: Response) {
        try {
            const userId = /*req.user.id*/ "";
            const followedUserId = req.params.id as string;

            const { isFollowing } = await UserService.toggleFollow(userId, followedUserId);
            if (isFollowing) return res.status(400).json({ success: false, message: "Error unfollwing user" });

            return res.status(200).json({ success: true, message: "User unfollowed successfully" });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "A problem occured; could not unfollow user"
            } as ApiResponse);
        }
    }

    static async getFollowers(req: Request, res: Response) {
        try {
            const userId = /* req.user.id as string */ "";
            const followers = UserService.getFollowers(userId);
            return res.status(200).json({ success: true, data: { followers } })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "A problem occured. Could not get followers"
            } as ApiResponse);
        }
    }

    static async getFollowing(req: Request, res: Response) {
        try {
            const userId = /*req.user.id*/ "";

            const { limit, offset }: { limit: number, offset: number } = req.body;

            const following = await UserService.getFollowings(userId, limit, offset);
            return res.status(200).json({ success: true, data: { following } })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "A problem occured. Could not get followings"
            } as ApiResponse);
        }
    }

    // ! todo => move this to accounts controller
    static async deleteAccount(req: Request, res: Response) { }
}
