const Category = require("../../model/category/Category");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbID = require("../../utils/validateMongoDbID");
const {
  checkForProfaneWords,
  checkForCrossSiteScripting,
} = require("../../middlewares/profaneWords/profaneWords");
require("bad-words");
const Yup = require("yup");

const formSchema = Yup.object({
  title: Yup.string()
    .required("Category title is required")
    .matches(/^[a-zA-Z0-9 ]*$/, "Cannot contain special characters")
    .min(5, "Category title must be at least 5 characters long")
    .max(20, "Category title cannot be more than 20 characters"),
});

//create category
const createCategoryController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot create a category."
    );
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(
    req?.user?._id,
    req
  );

  //trim spaces
  const title = req?.body?.title.trim();

  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  //check if category already exists
  const categoryExists = await Category.findOne({
    title: title,
  });

  if (categoryExists) {
    throw new Error("Category already exists.");
  }

  try {
    await formSchema.validate({ title });

    const category = await Category.create({
      user: req.user._id,
      title: title,
    });
    res.json(category);
  } catch (error) {
    res.status(500).json(error);
  }
});

//fetch all categories
const fetchAllCategoriesController = expressAsyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("user")
      .sort("-createdAt");
    res.json(categories);
  } catch (error) {
    res.status(500).json(error);
  }
});

//fetch a single category
const fetchCategoryController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbID(id);

  try {
    const category = await Category.findById(id)
      .populate("user")
      .sort("-createdAt");

    if (category === null) {
      res.status(404).json({ message: "Category not found." });
    } else {
      res.json(category);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//update a category
const updateCategoryController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { id } = req.params;
  const { _id } = req?.user;
  validateMongoDbID(id);

  //check if user is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot update category."
    );
  }

  const title = req?.body?.title.trim();

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  try {
    const categoryPermission = await Category.findById(id);
    if (
      categoryPermission?.user?._id.toString() !== _id?.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not allowed to update this category" });
    } else {
      await formSchema.validate({ title });

      const categoryExists = await Category.findOne({
        title: title,
      });
      if (categoryExists) {
        res.status(404).json({ message: "Category already exists." });
      } else {
        const category = await Category.findByIdAndUpdate(
          id,
          {
            title: title,
          },
          {
            new: true,
            runValidators: true,
          }
        );
        res.json(category);
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//delete a category
const deleteCategoryController = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id } = req?.user;
  validateMongoDbID(id);

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot delete category."
    );
  }

  try {
    const categoryPermission = await Category.findById(id);
    if (
      categoryPermission?.user?._id.toString() !== _id?.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not allowed to update this category" });
    } else {
      const category = await Category.findByIdAndDelete(id);

      if (category === null) {
        res.status(404).json({ message: "Category not found." });
      } else {
        res.json(category);
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  createCategoryController,
  fetchAllCategoriesController,
  fetchCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
