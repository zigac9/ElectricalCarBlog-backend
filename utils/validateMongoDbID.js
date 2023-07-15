const mongoose = require("mongoose");

const validateMongoDbID = (userId) => {
  const isValid = mongoose.Types.ObjectId.isValid(userId);
  if (!isValid) {
    throw new Error("Invalid ID or not found");
  }
};

module.exports = validateMongoDbID;
