const expressAsyncHandler = require("express-async-handler");

const jwt = require("jsonwebtoken");

const User = require("../../model/user/User");

const authMiddleware = expressAsyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //find the user by id (exclude the password)
        req.user = await User.findById(decoded.id).select("-password");
        next();
      }
    } catch (error) {
      throw new Error(
        "Not authorized, login token expire. Please login again!!"
      );
    }
  } else {
    throw new Error("Not authorized, no token");
  }
});

module.exports = authMiddleware;
