const User = require("../../model/user/User");
const Post = require("../../model/post/Post");
const Comment = require("../../model/comment/Comment");
const EvCharger = require("../../model/evCharger/EvCharger");
const Category = require("../../model/category/Category");
const expressAsyncHandler = require("express-async-handler");
const generateToken = require("../../config/token/generateToken");
const validateMongoDbID = require("../../utils/validateMongoDbID");
const crypto = require("crypto");
const sendGridEmail = require("@sendgrid/mail");
sendGridEmail.setApiKey(process.env.SENDGRID_API_KEY);
const cloudinaryUpload = require("../../utils/cloudinary");
const fs = require("fs");
const {
  checkForCrossSiteScripting,
  checkForProfaneWords,
} = require("../../middlewares/profaneWords/profaneWords");
const Filter = require("bad-words");

//Register
const userRegisterController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  //Check if the user already exists
  const userExists = await User.findOne({
    email: req?.body && req?.body?.email,
  });
  const filter = new Filter();
  if (userExists) {
    throw new Error("User already exists");
  }

  // check profane words
  const isProfaneFirstName = filter.isProfane(req?.body?.firstName);
  const isProfaneLastName = filter.isProfane(req?.body?.lastName);
  const isProfaneEmail = filter.isProfane(req?.body?.email);

  if (isProfaneFirstName || isProfaneLastName || isProfaneEmail) {
    throw new Error("Please use appropriate words");
  }

  if (!req?.body?.firstName) {
    throw new Error("First name is required");
  } else if (!/^[a-zA-Z0-9 ]*$/.test(req?.body?.firstName)) {
    throw new Error("First name cannot contain special characters");
  }

  if (!req?.body?.lastName) {
    throw new Error("Last name is required");
  } else if (!/^[a-zA-Z0-9 ]*$/.test(req?.body?.lastName)) {
    throw new Error("Last name cannot contain special characters");
  }

  if (!req?.body?.email) {
    throw new Error("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(req?.body?.email)) {
    throw new Error("Invalid email");
  } else if (!/^[^<>]*$/.test(req?.body?.email)) {
    throw new Error("Comment cannot contain characters < or >");
  }

  if (!req?.body?.password) {
    throw new Error("Password is required");
  } else if (req?.body?.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  } else if (!/\d/.test(req?.body?.password)) {
    throw new Error("Password requires a number");
  } else if (!/[a-z]/.test(req?.body?.password)) {
    throw new Error("Password requires a lowercase letter");
  } else if (!/[A-Z]/.test(req?.body?.password)) {
    throw new Error("Password requires an uppercase letter");
  } else if (!/\W/.test(req?.body?.password)) {
    throw new Error("Password requires a symbol");
  } else if (!/^[^<>]*$/.test(req?.body?.password)) {
    throw new Error("Password cannot contain characters < or >");
  }

  if (!req?.body?.confirmPassword) {
    throw new Error("Confirm password is required");
  } else if (!/^[^<>]*$/.test(req?.body?.confirmPassword)) {
    throw new Error("Confirm password cannot contain characters < or >");
  }

  if (req?.body?.password !== req?.body?.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  try {
    const user = await User.create({
      firstName:
        req?.body?.firstName?.charAt(0).toUpperCase() +
        req?.body?.firstName?.slice(1).toLowerCase(),
      lastName:
        req?.body?.lastName?.charAt(0).toUpperCase() +
        req?.body?.lastName?.slice(1).toLowerCase(),
      email: req?.body?.email,
      password: req?.body?.password,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Login
const userLoginController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  //check if the user exists
  const { email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists?.isBlocked) {
    throw new Error("Can't login. You are blocked");
  }

  const { allowRequest, returnMessage } = await checkForProfaneWords(
    userExists?._id,
    req,
  );
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  //check if the password is correct
  if (userExists && (await userExists.isPasswordMatched(password))) {
    await User.findByIdAndUpdate(
      userExists?._id,
      {
        $set: { loginWarningsCount: 0 },
      },
      { new: true },
    );
    res.json({
      id: userExists?._id,
      firstName: userExists?.firstName,
      lastName: userExists?.lastName,
      email: userExists?.email,
      profilePicture: userExists?.profilePicture,
      isAdmin: userExists?.isAdmin,
      token: generateToken(userExists?._id),
      isAccountVerified: userExists?.isAccountVerified,
    });
  } else if (userExists) {
    const user = await User.findByIdAndUpdate(
      userExists?._id,
      {
        $inc: { loginWarningsCount: 1 },
      },
      { new: true },
    );
    if (user.loginWarningsCount >= 4) {
      const userBlocked = await User.findByIdAndUpdate(
        userExists?._id,
        {
          $set: { isBlocked: true },
        },
        { new: true },
      );
      userBlocked.save();
      throw new Error(
        "You reached your third warning, you have been blocked! Contact the administrator to unblock you.",
      );
    } else {
      throw new Error(
        `Invalid email or password! Login attempts left - ${
          4 - user.loginWarningsCount
        }`,
      );
    }
  } else {
    throw new Error("Invalid email or password!");
  }
});

//Fetch all users
const getAllUsersController = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).populate("posts").populate("following");
    res.json(users);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Delete user
const deleteUserController = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateMongoDbID(userId);

  //check if login user is admin
  if (!loginUser?.isAdmin) {
    throw new Error("You are not authorized to delete a user");
  }

  try {
    await Post.findByIdAndDelete({ user: userId });
    await EvCharger.findByIdAndDelete({ user: userId });
    await Category.findByIdAndDelete({ user: userId });
    await Comment.findByIdAndDelete({ user: userId });

    const deletedUser = await User.findByIdAndDelete(userId);
    res.json(deletedUser);
  } catch (error) {
    res.status(500).json(error);
  }
});

//user details
const getUserDetailsController = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateMongoDbID(userId);
  try {
    const user = await User.findById(userId);
    res.json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

//user profile
const getUserProfileController = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateMongoDbID(userId);

  const loginUserId = req?.user?._id;

  try {
    const myProfile = await User.findById(userId)
      .populate("posts")
      .populate("viewedBy");
    const alreadyViewed = myProfile?.viewedBy?.find((user) => {
      return user?._id?.toString() === loginUserId?.toString();
    });

    const viewedYourProfile = loginUserId?.toString() === userId?.toString();
    if (alreadyViewed || viewedYourProfile) {
      res.json(myProfile);
    } else {
      const profile = await User.findByIdAndUpdate(myProfile?.id, {
        $push: { viewedBy: loginUserId },
      })
        .populate("posts")
        .populate("viewedBy");
      res.json(profile);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//Update profile
const updateUserProfileController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;

  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  if (!req?.body?.firstName) {
    throw new Error("First name is required");
  } else if (!/^[a-zA-Z0-9 ]*$/.test(req?.body?.firstName)) {
    throw new Error("First name cannot contain special characters");
  }

  if (!req?.body?.lastName) {
    throw new Error("Last name is required");
  } else if (!/^[a-zA-Z0-9 ]*$/.test(req?.body?.lastName)) {
    throw new Error("Last name cannot contain special characters");
  }

  if (!req?.body?.email) {
    throw new Error("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(req?.body?.email)) {
    throw new Error("Invalid email");
  } else if (!/^[^<>]*$/.test(req?.body?.email)) {
    throw new Error("Comment cannot contain characters < or >");
  }

  const userPermission = await User.findById(_id);
  if (
    userPermission?._id.toString() !== _id?.toString() &&
    !req?.user?.isAdmin
  ) {
    res
      .status(404)
      .json({ message: "You are not allowed to update this user profile" });
  }

  validateMongoDbID(_id);
  const user = await User.findByIdAndUpdate(
    _id,
    {
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.json(user);
});

//update password
const updateUserPasswordController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;
  const { oldPassword, password, confirmPassword } = req?.body;
  validateMongoDbID(_id);

  const user = await User.findById(_id);

  //update password check
  if (!(await user.isPasswordMatched(oldPassword))) {
    throw new Error("You entered the wrong password");
  }

  //check if password and confirm password are the same
  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  //update password check
  if (await user.isPasswordMatched(password)) {
    throw new Error("Password cannot be the same as the old one");
  }

  //check if the password is at least 6 characters long and contains at least one number and one uppercase letter and one special character
  const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must be at least 6 characters long and contain at least one number and one uppercase letter and one special character",
    );
  }

  //check if password and confirm password are the same
  if (password !== req?.body?.confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (password) {
    user.password = password;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.json(user);
  }
});

//following
const followUserController = expressAsyncHandler(async (req, res) => {
  // find the user you want to follow
  const { followId } = req.body;
  const loginUserId = req?.user?._id;

  //check if user want to follow himself
  if (followId === loginUserId) {
    throw new Error("You cannot follow yourself");
  }

  //find the target user and check if the login user id exists in the followers array
  const targetUser = await User.findById(followId);
  const isFollowed = targetUser?.followers?.includes(loginUserId);

  if (isFollowed) {
    throw new Error("You already followed this user");
  }

  //update followers array
  await User.findByIdAndUpdate(
    followId,
    {
      $push: { followers: loginUserId },
      isFollowing: true,
    },
    {
      new: true,
    },
  );

  //update following array
  await User.findByIdAndUpdate(
    loginUserId,
    {
      $push: { following: followId },
    },
    {
      new: true,
    },
  );

  res.json({ message: "Followed successfully" });
});

//unfollowing
const unfollowUserController = expressAsyncHandler(async (req, res) => {
  // find the user you want to unfollow
  const { unFollowId } = req.body;
  const loginUserId = req?.user?._id;

  //check if user want to ufollow himself
  if (unFollowId === loginUserId) {
    throw new Error("You cannot unfollow yourself");
  }

  //find the target user and check if the login user id exists in the followers array
  const targetUser = await User.findById(unFollowId);
  const isFollowed = targetUser?.followers?.includes(loginUserId);

  if (!isFollowed) {
    throw new Error("You do not follow this user");
  }

  //update followers array
  await User.findByIdAndUpdate(
    unFollowId,
    {
      $pull: { followers: loginUserId },
      isFollowing: false,
    },
    {
      new: true,
    },
  );

  //update following array
  await User.findByIdAndUpdate(
    loginUserId,
    {
      $pull: { following: unFollowId },
    },
    {
      new: true,
    },
  );

  res.json({ message: "UnFollowed successfully" });
});

//block user
const blockUserController = expressAsyncHandler(async (req, res) => {
  const { blockId } = req.params;
  const loginUser = req?.user;

  //check if login user is admin
  if (!loginUser?.isAdmin) {
    throw new Error("You are not authorized to block this user");
  }

  validateMongoDbID(blockId);

  if (blockId.toString() === loginUser?._id.toString()) {
    const user = await User.findById(blockId);
    res.json(user);
  } else {
    const user = await User.findByIdAndUpdate(
      blockId,
      {
        isBlocked: true,
      },
      {
        new: true,
      },
    );
    res.json(user);
  }
});

//unblock user
const unblockUserController = expressAsyncHandler(async (req, res) => {
  const { blockId } = req.params;
  const loginUser = req?.user;

  //check if login user is admin
  if (!loginUser?.isAdmin) {
    throw new Error("You are not authorized to unblock this user");
  }

  validateMongoDbID(blockId);
  const user = await User.findByIdAndUpdate(
    blockId,
    {
      isBlocked: false,
      warningsCount: 0,
    },
    {
      new: true,
    },
  );
  res.json(user);
});

//generate email verification token
const generateVerificationTokenController = expressAsyncHandler(
  async (req, res) => {
    const loginUser = req?.user?.id;
    const user = await User.findById(loginUser);

    try {
      //generate token
      if (user?.isAccountVerified) {
        res.status(404).json({ message: "Your account is already verified" });
      } else {
        const verificationToken = await user.createAccountVerificationToken();
        await user.save();

        const resetURL = `If you were requested to verify your account, verify now within 10 minutes, otherwise ignore this message: <a href="https://electrical-car-blog.netlify.app/verify-account/${verificationToken}">Click to verify</a>`;

        //build your message
        const msg = {
          to: user?.email,
          from: "ziga.crv@tscng.org",
          subject: "Sending account verification token",
          html: resetURL,
        };
        await sendGridEmail.send(msg);
        res.json(resetURL);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  },
);

//account verification
const accountVerificationController = expressAsyncHandler(async (req, res) => {
  const { verificationToken } = req.body;
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  //find this user by token
  const user = await User.findOne({
    accountVerificationToken: hashedToken,
    accountVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Token is invalid or has expired");
  }

  user.isAccountVerified = true;
  user.accountVerificationToken = undefined;
  user.accountVerificationTokenExpires = undefined;
  await user.save();

  res.json(user);
});

//generate reset password token
const generateResetPasswordTokenController = expressAsyncHandler(
  async (req, res) => {
    //check for cross site scripting
    const { allowRequestErr, returnMessageErr } =
      await checkForCrossSiteScripting(req);
    if (!allowRequestErr) {
      throw new Error(returnMessageErr);
    }

    //find the user by email from body
    const { email } = req.body;
    //get user
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("No user with this email");
    }

    try {
      //generate token
      const resetToken = await user.createPasswordResetToken();
      await user.save();

      const resetURL = `If you requested to reset your password, reset now within 10 minutes, otherwise ignore this message: <a href="https://electrical-car-blog.netlify.app/reset-password/${resetToken}">Click to reset</a>`;

      //build your message
      const msg = {
        to: user?.email,
        from: "ziga.crv@tscng.org",
        subject: "Sending password reset token",
        html: resetURL,
      };

      await sendGridEmail.send(msg);
      res.json({
        message: `Email is successfuly sent to ${email}. Reset now within 10 minutes, ${resetURL}`,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  },
);

//reset password
const resetPasswordController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { token, password, confirmPassword } = req?.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  //find this user by token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Token is invalid or has expired");
  }

  //check if password and confirmPassword are the same
  if (password !== confirmPassword) {
    throw new Error("Password and confirmPassword are not the same");
  }

  if (await user.isPasswordMatched(password)) {
    throw new Error("Password cannot be the same as the old one");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  res.json(user);
});

//Profile photo upload
const uploadProfilePhotoController = expressAsyncHandler(async (req, res) => {
  //find the login user
  const { _id } = req?.user;

  //get the path to the image
  const localPath = `public/img/profile/${req.file.filename}`;

  //update the user profile photo
  const imgUploaded = await cloudinaryUpload(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      profilePicture: imgUploaded?.url,
    },
    {
      new: true,
    },
  );
  //remove the image from the local storage
  fs.unlinkSync(localPath);
  res.json(foundUser);
});

// cover photo upload
const coverPhotoUploadController = expressAsyncHandler(async (req, res) => {
  //find the login user
  const { _id } = req?.user;

  //get the path to the image
  const localPath = `public/img/profile/${req.file.filename}`;

  //update the user profile photo
  const imgUploaded = await cloudinaryUpload(localPath);

  const foundUser = await User.findByIdAndUpdate(
    _id,
    {
      coverPhoto: imgUploaded?.url,
    },
    {
      new: true,
    },
  );
  //remove the image from the local storage
  fs.unlinkSync(localPath);
  res.json(foundUser);
});

module.exports = {
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
};
