const mongoose = require("mongoose");

const emailMessageSchema = new mongoose.Schema(
  {
    fromEmail: {
      type: String,
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: false,
    },
    subject: {
      type: String,
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const EmailMessage = mongoose.model("EmailMessage", emailMessageSchema);

module.exports = EmailMessage;
