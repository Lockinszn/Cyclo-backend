import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/posts
router.get('/', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Get all posts endpoint - To be implemented',
    endpoint: 'GET /api/v1/posts',
    queryParams: {
      page: 'number (optional)',
      limit: 'number (optional)',
      category: 'string (optional)',
      tag: 'string (optional)',
      author: 'string (optional)',
      search: 'string (optional)'
    }
  });
});

// POST /api/v1/posts
router.post('/', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Create new post endpoint - To be implemented',
    endpoint: 'POST /api/v1/posts',
    expectedBody: {
      title: 'string',
      content: 'string',
      excerpt: 'string (optional)',
      categoryId: 'string',
      tags: 'string[]',
      status: 'draft | published | scheduled',
      scheduledAt: 'datetime (optional)'
    }
  });
});

// GET /api/v1/posts/:id
router.get('/:id', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Get post by ID endpoint - To be implemented',
    endpoint: 'GET /api/v1/posts/:id',
    postId: req.params.id
  });
});

// PUT /api/v1/posts/:id
router.put('/:id', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Update post endpoint - To be implemented',
    endpoint: 'PUT /api/v1/posts/:id',
    postId: req.params.id
  });
});

// DELETE /api/v1/posts/:id
router.delete('/:id', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Delete post endpoint - To be implemented',
    endpoint: 'DELETE /api/v1/posts/:id',
    postId: req.params.id
  });
});

// POST /api/v1/posts/:id/like
router.post('/:id/like', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Like post endpoint - To be implemented',
    endpoint: 'POST /api/v1/posts/:id/like',
    postId: req.params.id
  });
});

// DELETE /api/v1/posts/:id/like
router.delete('/:id/like', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Unlike post endpoint - To be implemented',
    endpoint: 'DELETE /api/v1/posts/:id/like',
    postId: req.params.id
  });
});

// GET /api/v1/posts/categories
router.get('/categories', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Get all categories endpoint - To be implemented',
    endpoint: 'GET /api/v1/posts/categories'
  });
});

// GET /api/v1/posts/tags
router.get('/tags', (req: Request, res: Response) => {
  res.status(501).json({
    message: 'Get all tags endpoint - To be implemented',
    endpoint: 'GET /api/v1/posts/tags'
  });
});

export default router;