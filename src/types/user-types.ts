import { User } from "@/db/schemas";

export type UserProfile = User;

export type UpdateProfileRequest =  {
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    location?: string;
}

export type AccountStats = {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location: string;
    postsCount: number;
    followersCount: number;
    followingsCount: number;
}
export type BasicUserInfo =  Pick<UserProfile, "avatar" | "username" | "firstName" |"lastName" | "bio" |"email">
export type Followers = BasicUserInfo;
export type Followings = BasicUserInfo;
