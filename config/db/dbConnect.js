const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (error) {
    console.log("Error connecting to database " + error);
  }
};

module.exports = dbConnect;
