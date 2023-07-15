const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post is required"],
    },
    user: {
      type: Object,
      required: [true, "User is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisLiked: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    disLikes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
