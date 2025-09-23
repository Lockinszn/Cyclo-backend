import { UserController } from '@/controllers/user-controller';
import { Router, Request, Response } from 'express';

const router: Router = Router();

// GET /api/v1/users/profile
router.get('/profile', UserController.getUserProfile);

// PUT /api/v1/users/profile
router.put('/profile', UserController.updateUserProfile);

// GET /api/v1/users/:id 
router.get('/:id', UserController.getUserById);

// POST /api/v1/users/:id/follow (Optional)
router.post('/:id/follow', UserController.followUser);

// DELETE /api/v1/users/:id/follow (Optional)
router.delete('/:id/follow', UserController.unfollowUser);

// GET /api/v1/users/:id/followers (Optional)
router.get('/:id/followers', UserController.getFollowers);

// GET /api/v1/users/:id/following (Optional)
router.get('/:id/following', UserController.getFollowing);

export default router;