import { UserController } from '@/controllers/user-controller';
import { Router } from 'express';

const router: Router = Router();

router.get('/profile', UserController.getUserProfile);
router.put('/profile', UserController.updateProfile);
router.get('/search', UserController.searchUsers);
router.get('/:id', UserController.getUserById);
router.post('/:id/follow', UserController.followUser);
router.delete('/:id/follow', UserController.unfollowUser);
router.get('/:id/followers', UserController.getFollowers);
router.get('/:id/following', UserController.getFollowing);
router.get('/:id/account-stats', UserController.getAccountStats);
router.post('/:id/account/deactivate', UserController.deactivateAccount);
router.delete('/:id/account', UserController.deleteAccount);

export default router;