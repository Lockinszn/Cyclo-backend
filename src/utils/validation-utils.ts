import Joi from "joi";

export const ProfileUpdateValidator = Joi.object({
    username: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    bio: Joi.string().optional(),
    website: Joi.string().optional(),
    location: Joi.string().optional()
})