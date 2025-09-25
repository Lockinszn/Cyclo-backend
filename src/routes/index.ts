import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import postRoutes from './posts';
import commentRoutes from './comments';
import bookmarkRoutes from './bookmarks';
import notificationRoutes from './notifications';

const router:Router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/notifications', notificationRoutes);

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Cyclo API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      posts: '/api/v1/posts',
      comments: '/api/v1/comments',
      bookmarks: '/api/v1/bookmarks',
      notifications: '/api/v1/notifications'
    },
    documentation: '',
    status: 'active'
  });
});

export default router;