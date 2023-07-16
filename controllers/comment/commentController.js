const {
  checkForProfaneWords,
  checkForCrossSiteScripting,
} = require("../../middlewares/profaneWords/profaneWords");
const expressAsyncHandler = require("express-async-handler");
const Comment = require("../../model/comment/Comment");
const validateMongoDbID = require("../../utils/validateMongoDbID");

// create a comment
const createCommentController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error("Your account is not verified! You cannot create comment.");
  }

  // get user
  const user = req.user;

  // get the post id
  const { postId, description } = req.body;

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(
    user?._id,
    req,
  );
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  if (!description) {
    throw new Error("Comment must be provided to post");
  } else if (!/^[^<>]*$/.test(description)) {
    throw new Error("Comment cannot contain characters < or >");
  } else if (description.length < 10) {
    throw new Error("Comment must be at least 10 characters long");
  } else if (description.length > 300) {
    throw new Error("Comment must be at most 300 characters long");
  }

  try {
    const comment = await Comment.create({
      post: postId,
      user,
      description,
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json(error);
  }
});

//fetch all comments
const fetchAllCommentsController = expressAsyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find({}).sort("-created");
    res.json(comments);
  } catch (error) {
    res.status(500).json(error);
  }
});

// comment details
const commentDetailsController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);

  try {
    const comment = await Comment.findById(id);
    res.json(comment);
  } catch (error) {
    res.status(500).json(error);
  }
});

//update a comment
const updateCommentController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error("Your account is not verified! You cannot update comment.");
  }

  const { id } = req.params;
  const { _id } = req?.user;
  validateMongoDbID(id);

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(
    req?.user?._id,
    req,
  );
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  try {
    //check if userID is the same as the user who created the comment
    const commentPermission = await Comment.findById(id);
    if (
      commentPermission?.user?._id.toString() !== _id?.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not allowed to update this comment." });
    } else {
      if (!req?.body?.description) {
        res.status(404).json({ message: "Comment must be provided to post" });
      } else if (!/^[^<>]*$/.test(req?.body?.description)) {
        res
          .status(404)
          .json({ message: "Comment cannot contain characters < or >" });
      } else if (req?.body?.description?.length < 10) {
        res
          .status(404)
          .json({ message: "Comment must be at least 10 characters long" });
      } else if (req?.body?.description?.length > 300) {
        res
          .status(404)
          .json({ message: "Comment must be at most 300 characters long" });
      }
      const update = await Comment.findByIdAndUpdate(
        id,
        {
          description: req?.body?.description,
        },
        { new: true, runValidators: true },
      );
      res.json(update);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//delete a comment
const deleteCommentController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id } = req?.user;
  validateMongoDbID(id);

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error("Your account is not verified! You cannot delete comment.");
  }

  try {
    //check if userID is the same as the user who created the comment
    const commentPermission = await Comment.findById(id);
    if (
      commentPermission?.user?._id.toString() !== _id?.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not allowed to delete this comment." });
    } else {
      const comment = await Comment.findByIdAndDelete(id);
      res.json(comment);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//like comment
const likeCommentController = expressAsyncHandler(async (req, res) => {
  const { commentId } = req.body;
  const comment = await Comment.findById(commentId);
  const loginUserId = req?.user?._id;

  const isLiked = comment?.isLiked;
  const isAlreadyDisliked = comment?.disLikes?.find(
    (userId) => userId.toString() === loginUserId.toString(),
  );

  if (isAlreadyDisliked) {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { disLikes: loginUserId },
        $push: { likes: loginUserId },
        isLiked: true,
        isDisLiked: false,
      },
      { new: true },
    );
    return res.json(comment);
  }

  if (isLiked) {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true },
    );
    return res.json(comment);
  } else {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true },
    );
    return res.json(comment);
  }
});

//dislike comment
const dislikeCommentController = expressAsyncHandler(async (req, res) => {
  const { commentId } = req.body;
  const comment = await Comment.findById(commentId);
  const loginUserId = req?.user?._id;

  const isDisLiked = comment?.isDisLiked;
  const isAlreadyLiked = comment?.likes?.find(
    (userId) => userId.toString() === loginUserId.toString(),
  );

  if (isAlreadyLiked) {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { likes: loginUserId },
        $push: { disLikes: loginUserId },
        isDisLiked: true,
        isLiked: false,
      },
      { new: true },
    );
    return res.json(comment);
  }

  if (isDisLiked) {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true },
    );
    return res.json(comment);
  } else {
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: { disLikes: loginUserId },
        isDisLiked: true,
      },
      { new: true },
    );
    return res.json(comment);
  }
});

module.exports = {
  createCommentController,
  fetchAllCommentsController,
  likeCommentController,
  dislikeCommentController,
  commentDetailsController,
  updateCommentController,
  deleteCommentController,
};
