import { Router, Request, Response } from "express";

const router: Router = Router();

// GET /api/v1/bookmarks - Get user bookmarks
router.get("/", (req: Request, res: Response) => {
  res.status(501).json({
    message: "Get bookmarks endpoint not implemented",
    query_params: {
      page: "number (optional)",
      limit: "number (optional)",
      sort: "string (optional) - created_at, title",
    },
  });
});

// POST /api/v1/bookmarks - Add bookmark
router.post("/", (req: Request, res: Response) => {
  res.status(501).json({
    message: "Add bookmark endpoint not implemented",
    expected_body: {
      post_id: "string (required)",
      notes: "string (optional)",
    },
  });
});

// DELETE /api/v1/bookmarks/:id - Remove bookmark
router.delete("/:id", (req: Request, res: Response) => {
  res.status(501).json({
    message: "Remove bookmark endpoint not implemented",
    bookmark_id: req.params.id,
  });
});

// PUT /api/v1/bookmarks/:id - Update bookmark
router.put("/:id", (req: Request, res: Response) => {
  res.status(501).json({
    message: "Update bookmark endpoint not implemented",
    bookmark_id: req.params.id,
    expected_body: {
      notes: "string (optional)",
    },
  });
});

export default router;
