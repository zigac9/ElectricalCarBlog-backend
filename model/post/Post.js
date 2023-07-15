const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      required: [true, "Please title is required"],
      type: String,
      trim: true,
    },
    mainCategory: {
      required: [true, "Main Post category is required"],
      type: String,
    },
    numViews: {
      type: Number,
      default: 0,
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    isDisLiked: {
      type: Boolean,
      default: false,
    },
    carName: {
      type: String,
      required: [true, "Please enter car name"],
    },
    usableBatterySize: {
      type: Number,
      required: [true, "Please enter usable battery"],
    },
    efficiency: {
      type: Number,
      required: [true, "Please enter efficiency"],
    },
    recommendedChargers: {
      type: Object,
      required: [true, "Recommended chargers required"],
    },
    startingLocation: {
      type: Object,
      required: [true, "Please enter a starting location"],
    },
    endLocation: {
      type: Object,
      required: [true, "Please enter end location"],
    },
    isPublic: {
      type: Boolean,
      default: true,
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post must belong to a user"],
    },
    description: {
      type: String,
      required: [true, "Please enter a description"],
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1607197109166-3ab4ee4b468f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true, //when user was created
  }
);

// populate comments
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

postSchema.virtual("chargers", {
  ref: "EvCharger",
  foreignField: "post",
  localField: "_id",
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
