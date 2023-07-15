const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      required: [true, "Please enter your first name"],
      type: String,
    },
    lastName: {
      required: [true, "Please enter your last name"],
      type: String,
    },
    profilePicture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    coverPhoto: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    warningsCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isFollowing: {
      type: Boolean,
      default: false,
    },
    isUnfollowing: {
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    accountVerificationToken: String,
    accountVerificationTokenExpires: Date,
    viewedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    followers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    following: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    //populate the actual id of the user -> convert ID to json and object
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true, //when user was created
  }
);

//virtual populate
userSchema.virtual("posts", {
  ref: "Post",
  foreignField: "user",
  localField: "_id",
});

//hash password before saving to database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  //hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//compare password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//verify account
userSchema.methods.createAccountVerificationToken = async function () {
  //create token
  const accountVerificationToken = crypto.randomBytes(32).toString("hex");
  this.accountVerificationToken = crypto
    .createHash("sha256")
    .update(accountVerificationToken)
    .digest("hex");
  this.accountVerificationTokenExpires = Date.now() + 10 * 60 * 1000; //10 minutes
  return accountVerificationToken;
};

//password reset
userSchema.methods.createPasswordResetToken = async function () {
  //create token
  const accountPasswordResetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(accountPasswordResetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; //10 minutes
  return accountPasswordResetToken;
};

//compile schema into model
const User = mongoose.model("User", userSchema);

module.exports = User;
