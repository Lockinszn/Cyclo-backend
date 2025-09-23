import { User } from "@/db/schemas";

export type UserProfile = User;

export interface UpdateProfile {
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    location?: string;
}