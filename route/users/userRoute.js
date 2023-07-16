const express = require("express");
const {
  userRegisterController,
  userLoginController,
  getAllUsersController,
  deleteUserController,
  getUserDetailsController,
  getUserProfileController,
  updateUserProfileController,
  updateUserPasswordController,
  followUserController,
  unfollowUserController,
  blockUserController,
  unblockUserController,
  generateVerificationTokenController,
  accountVerificationController,
  generateResetPasswordTokenController,
  resetPasswordController,
  uploadProfilePhotoController,
  coverPhotoUploadController,
} = require("../../controllers/users/usersController");

const authMiddleware = require("../../middlewares/auth/authMiddleware");
const {
  profilePhotoUpload,
  profilePhotoResize,
  coverPhotoUpload,
  coverPhotoResize,
} = require("../../middlewares/uploads/photoUpload");
const userRouter = express.Router();

userRouter.post("/register", userRegisterController);
userRouter.post("/login", userLoginController);
userRouter.put(
  "/upload-profile-photo",
  authMiddleware,
  profilePhotoUpload.single("image"),
  profilePhotoResize,
  uploadProfilePhotoController,
);
userRouter.get("/", getAllUsersController);
userRouter.put(
  "/cover-photo-upload",
  authMiddleware,
  coverPhotoUpload.single("image"),
  coverPhotoResize,
  coverPhotoUploadController,
);
userRouter.put("/password", authMiddleware, updateUserPasswordController); //update password
userRouter.put("/follow", authMiddleware, followUserController);
userRouter.put("/unfollow", authMiddleware, unfollowUserController);
userRouter.post(
  "/generate-verify-email-token",
  authMiddleware,
  generateVerificationTokenController,
);
userRouter.put(
  "/verify-account",
  authMiddleware,
  accountVerificationController,
);
userRouter.post("/forget-password-token", generateResetPasswordTokenController);
userRouter.put("/reset-password", resetPasswordController);
userRouter.post("/block-user/:blockId", authMiddleware, blockUserController);
userRouter.post(
  "/unblock-user/:blockId",
  authMiddleware,
  unblockUserController,
);
userRouter.get("/profile/:userId", authMiddleware, getUserProfileController); //only login user can access this route
userRouter.put("/", authMiddleware, updateUserProfileController); //update profile
userRouter.delete("/:userId", deleteUserController);
userRouter.get("/:userId", getUserDetailsController);

module.exports = userRouter;
