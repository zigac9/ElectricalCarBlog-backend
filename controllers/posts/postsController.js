const Post = require("../../model/post/Post");
const EvCharger = require("../../model/evCharger/EvCharger");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbID = require("../../utils/validateMongoDbID");
const {
  checkForProfaneWords,
  checkForCrossSiteScripting,
} = require("../../middlewares/profaneWords/profaneWords");
const cloudinaryUpload = require("../../utils/cloudinary");
const fs = require("fs");
const { Types } = require("mongoose");
const Yup = require("yup");

const formSchema = Yup.object().shape({
  title: Yup.string()
    .required("Title is required")
    .matches(/^[a-zA-Z0-9 ]*$/, "Cannot contain special characters")
    .min(5, "Title must be at least 5 characters long")
    .max(40, "Title cannot be more than 40 characters"),
  description: Yup.string()
    .required("Description is required")
    .matches(/^[^<>]*$/, "Cannot contain characters < or >")
    .min(100, "Description must be at least 100 characters long")
    .max(1000, "Description cannot be more than 1000 characters"),
  carName: Yup.string()
    .required("Car name is required")
    .matches(/^[^<>]*$/, "Cannot contain characters < or >")
    .min(2, "Car name must be at least 2 characters long")
    .max(30, "Car name cannot be more than 30 characters"),
  usableBatterySize: Yup.number()
    .required("Usable battery is required")
    .min(15, "Usable battery must be at least 15 kWh")
    .max(140, "Usable battery cannot be more than 140 kWh"),
  efficiency: Yup.number()
    .required("Efficiency is required")
    .min(130, "Efficiency must be at least 130 Wh/km")
    .max(320, "Efficiency cannot be more than 320 Wh/km"),
  mainCategory: Yup.string()
    .required("Category is required")
    .matches(/^[^<>]*$/, "Cannot contain characters < or >"),
  image: Yup.string().required("Image is required"),
  startingLocation: Yup.object().required("Starting location is required"),
  endLocation: Yup.object().required("End location is required"),
  recommendedChargers: Yup.object().required(
    "Recommended chargers is required",
  ),
});

// Create a post
const createPostController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;

  //get the path to the image
  const localPath = `public/img/posts/${req.file.filename}`;

  //check if user is verified
  if (!req?.user?.isAccountVerified) {
    //delete the image from the local storage
    fs.unlinkSync(localPath);
    throw new Error("Your account is not verified! You cannot create a post.");
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    //delete the image from the local storage
    fs.unlinkSync(localPath);
    throw new Error(returnMessage);
  }

  //update the user profile photo
  const imgUploaded = await cloudinaryUpload(localPath);

  //delete the image from the local storage
  fs.unlinkSync(localPath);

  let convertedChargers = [];
  if (req?.body?.chargers) {
    const chargerSplit = req.body.chargers.split(",");
    convertedChargers = chargerSplit.map((charger) => {
      return new Types.ObjectId(charger);
    });
  }

  if (convertedChargers?.length > 23) {
    throw new Error("You can only add up to 23 chargers!");
  }

  const startLocation = JSON.parse(req?.body?.startingLocation);
  const endingLocation = JSON.parse(req?.body?.endLocation);
  const recommendedChargers = JSON.parse(req?.body?.recommendedChargers);

  const data = {
    title: req?.body?.title,
    description: req?.body?.description,
    mainCategory: req?.body?.mainCategory,
    startingLocation: startLocation,
    endLocation: endingLocation,
    image: imgUploaded.url,
    carName: req?.body?.carName,
    usableBatterySize: req?.body?.usableBatterySize,
    efficiency: req?.body?.efficiency,
    recommendedChargers: recommendedChargers,
  };

  try {
    await formSchema.validate(data);

    const post = await Post.create({
      ...data,
      isPublic: req?.body?.public,
      user: _id,
    });

    convertedChargers?.length > 0 &&
      convertedChargers?.map(async (charger, index) => {
        await EvCharger.findByIdAndUpdate(charger?._id, {
          sequenceNumber: index,
          post: post?._id,
          isAssigned: true,
        });
      });

    res.json(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

//update a post
const updatePostController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;
  const { id } = req.params;
  validateMongoDbID(id);

  //check if user is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error("Your account is not verified! You cannot update post.");
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  let convertedChargers = [];
  if (req?.body?.chargers) {
    const chargerSplit = req.body.chargers.split(",");
    convertedChargers = chargerSplit.map((charger) => {
      return new Types.ObjectId(charger);
    });
  }

  const needToUpdate = typeof req?.body?.image !== "string";
  const startLocation = JSON.parse(req?.body?.startingLocation);
  const endingLocation = JSON.parse(req?.body?.endLocation);
  const recommendedChargers = JSON.parse(req?.body?.recommendedChargers);

  const data = {
    title: req?.body?.title,
    description: req?.body?.description,
    mainCategory: req?.body?.mainCategory,
    startingLocation: startLocation,
    endLocation: endingLocation,
    carName: req?.body?.carName,
    usableBatterySize: req?.body?.usableBatterySize,
    efficiency: req?.body?.efficiency,
  };

  if (recommendedChargers?.chargersAuto && recommendedChargers?.routeDetails) {
    data.recommendedChargers = recommendedChargers;
  }

  if (needToUpdate) {
    const localPath = `public/img/posts/${req.file.filename}`;
    const imgUploaded = await cloudinaryUpload(localPath);
    fs.unlinkSync(localPath);
    try {
      //check if userID is the same as the user who created the post
      const postPermission = await Post.findById(id);

      if (
        postPermission?.user?._id.toString() !== _id.toString() &&
        !req?.user?.isAdmin
      ) {
        res
          .status(404)
          .json({ message: "You are not authorized to update this post" });
      } else {
        if (!imgUploaded.url) {
          res.status(404).json({ message: "Image is required" });
        }
        await formSchema.validate({
          ...data,
          recommendedChargers: { update: null },
          image: imgUploaded.url,
        });

        const post = await Post.findByIdAndUpdate(
          id,
          {
            ...data,
            isPublic: req?.body?.public,
            image: imgUploaded.url,
          },
          { new: true, runValidators: true },
        );

        convertedChargers?.length > 0 &&
          convertedChargers?.map(async (charger, index) => {
            await EvCharger.findByIdAndUpdate(charger?._id, {
              sequenceNumber: index,
              post: post?._id,
              isAssigned: true,
            });
          });

        res.json(post);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  } else {
    try {
      //check if userID is the same as the user who created the post
      const postPermission = await Post.findById(id);

      if (
        postPermission?.user?._id.toString() !== _id.toString() &&
        !req?.user?.isAdmin
      ) {
        res
          .status(404)
          .json({ message: "You are not authorized to update this post" });
      } else {
        await formSchema.validate({
          ...data,
          recommendedChargers: { update: null },
          image: req?.body?.image,
        });

        const post = await Post.findByIdAndUpdate(
          id,
          {
            ...data,
            isPublic: req?.body?.public,
          },
          { new: true, runValidators: true },
        );

        convertedChargers?.length > 0 &&
          convertedChargers?.map(async (charger, index) => {
            await EvCharger.findByIdAndUpdate(charger?._id, {
              sequenceNumber: index,
              post: post?._id,
              isAssigned: true,
            });
          });
        res.json(post);
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
});

//delete a post
const deletePostController = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  const { id } = req.params;
  validateMongoDbID(id);

  try {
    const postPermission = await Post.findById(id);
    if (
      postPermission?.user?._id.toString() !== _id.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not authorized to delete this post" });
    } else {
      const post = await Post.findByIdAndDelete(id);
      res.json(post);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//Fetch all posts
const fetchAllPostsController = expressAsyncHandler(async (req, res) => {
  try {
    const posts = await Post.find({}).populate("user").populate("comments");
    res.json(posts);
  } catch (error) {
    res.status(500).json(error);
  }
});

//Fetch a single post
const fetchSinglePostController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);

  try {
    const post = await Post.findById(id)
      .populate("user")
      .populate("disLikes")
      .populate("likes")
      .populate("comments")
      .populate("chargers");
    //update number of views
    await Post.findByIdAndUpdate(id, { $inc: { numViews: 1 } }, { new: true });

    res.json(post);
  } catch (error) {
    res.status(500).json(error);
  }
});

//like a post
const likePostController = expressAsyncHandler(async (req, res) => {
  //find post id in the body
  const { postId } = req.body;
  const post = await Post.findById(postId);

  //find the login user
  const loginUserId = req?.user?._id;

  //check if the user has already liked the post
  const isLiked = post?.isLiked;

  //check if user disliked post
  const isAlreadyDisliked = post?.disLikes?.find(
    (userId) => userId.toString() === loginUserId.toString(),
  );

  if (isAlreadyDisliked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        $push: { likes: loginUserId },
        isLiked: true,
        isDisLiked: false,
      },
      { new: true },
    );
    return res.json(post);
  }

  if (isLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        isLiked: false,
      },
      { new: true },
    );
    return res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loginUserId },
        isLiked: true,
      },
      { new: true },
    );
    return res.json(post);
  }
});

//dislike a post
const dislikePostController = expressAsyncHandler(async (req, res) => {
  //find post id in the body
  const { postId } = req.body;
  const post = await Post.findById(postId);

  //find the login user
  const loginUserId = req?.user?._id;

  //check if the user has already disliked the post
  const isDisLiked = post?.isDisLiked;

  //check if user liked post
  const isAlreadyLiked = post?.likes?.find(
    (userId) => userId.toString() === loginUserId.toString(),
  );

  if (isAlreadyLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loginUserId },
        $push: { disLikes: loginUserId },
        isDisLiked: true,
        isLiked: false,
      },
      { new: true },
    );
    return res.json(post);
  }

  if (isDisLiked) {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { disLikes: loginUserId },
        isDisLiked: false,
      },
      { new: true },
    );
    return res.json(post);
  } else {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { disLikes: loginUserId },
        isDisLiked: true,
      },
      { new: true },
    );
    return res.json(post);
  }
});

module.exports = {
  createPostController,
  fetchAllPostsController,
  fetchSinglePostController,
  updatePostController,
  deletePostController,
  likePostController,
  dislikePostController,
};
