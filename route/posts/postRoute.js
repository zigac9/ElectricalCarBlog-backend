const express = require("express");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const {
  postPhotoUpload,
  postImagePhotoResize,
} = require("../../middlewares/uploads/photoUpload");
const postRoute = express.Router();
const {
  createPostController,
  fetchAllPostsController,
  fetchSinglePostController,
  updatePostController,
  deletePostController,
  likePostController,
  dislikePostController,
} = require("../../controllers/posts/postsController");

postRoute.put("/like", authMiddleware, likePostController);
postRoute.put("/dislike", authMiddleware, dislikePostController);
postRoute.post(
  "/",
  authMiddleware,
  postPhotoUpload.single("image"),
  postImagePhotoResize,
  createPostController
);
postRoute.get("/", fetchAllPostsController);
postRoute.get("/:id", fetchSinglePostController);
postRoute.put(
  "/:id",
  authMiddleware,
  postPhotoUpload.single("image"),
  postImagePhotoResize,
  updatePostController
);
postRoute.delete("/:id", authMiddleware, deletePostController);

module.exports = postRoute;
