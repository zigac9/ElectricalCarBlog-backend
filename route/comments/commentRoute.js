const express = require("express");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const commentRouter = express.Router();

const {
  createCommentController,
  fetchAllCommentsController,
  likeCommentController,
  dislikeCommentController,
  commentDetailsController,
  updateCommentController,
  deleteCommentController,
} = require("../../controllers/comment/commentController");

commentRouter.put("/like", authMiddleware, likeCommentController);
commentRouter.put("/dislike", authMiddleware, dislikeCommentController);
commentRouter.post("/", authMiddleware, createCommentController);
commentRouter.get("/", authMiddleware, fetchAllCommentsController);
commentRouter.get("/:id", authMiddleware, commentDetailsController);
commentRouter.put("/:id", authMiddleware, updateCommentController);
commentRouter.delete("/:id", authMiddleware, deleteCommentController);

module.exports = commentRouter;
