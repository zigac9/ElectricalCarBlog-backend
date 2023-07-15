//mongoDB secure connection
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

//server
const express = require("express");
const app = express();
const cors = require("cors");

//database
const dbConnect = require("./config/db/dbConnect");
dbConnect().then(() => console.log("Database connected"));

//Middleware - to check if the request is in json format
app.use(express.json());

//cors
app.use(cors());

//Register with use route middleware (app.use)
const userRoute = require("./route/users/userRoute.js");
app.use("/api/users", userRoute);

//post route
const postRoute = require("./route/posts/postRoute.js");
app.use("/api/posts", postRoute);

//comment route
const commentRoute = require("./route/comments/commentRoute.js");
app.use("/api/comments", commentRoute);

//send email route
const emailMessageRoute = require("./route/emailMessage/emailMessageRoute.js");
app.use("/api/email", emailMessageRoute);

//category route
const categoryRoute = require("./route/category/categoryRoute.js");
app.use("/api/category", categoryRoute);

//charger route
const chargerRoute = require("./route/evCharger/chargerRoute.js");
app.use("/api/charger", chargerRoute);

//Error handler
const { errorHandler, notFound } = require("./middlewares/error/errorHandler");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
