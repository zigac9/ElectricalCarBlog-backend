const express = require("express");
const {
  sendEmailMessageController,
  sendEmailMessageToAdminController,
} = require("../../controllers/emailMessage/emailMessageController");
const authMiddleware = require("../../middlewares/auth/authMiddleware");
const emailMessageRoute = express.Router();

emailMessageRoute.post("/", authMiddleware, sendEmailMessageController);
emailMessageRoute.post("/toAdmin", sendEmailMessageToAdminController);

module.exports = emailMessageRoute;
