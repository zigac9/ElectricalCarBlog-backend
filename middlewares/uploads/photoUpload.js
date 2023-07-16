const multer = require("multer");
const sharp = require("sharp");
const { join } = require("path");

const multerStorage = multer.memoryStorage();

//file type checking
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true); //null means no error
  } else {
    cb(
      {
        message: "Please upload an image file",
      },
      false,
    );
  }
};

const profilePhotoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, //5mb
  },
});

const postPhotoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 30, //30mb
  },
});

const coverPhotoUpload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 30, //30mb
  },
});

//image resizing
const profilePhotoResize = async (req, res, next) => {
  //check if there is no file
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}-${
    req.file.originalname
  }`;
  await sharp(req.file.buffer)
    .resize(200, 200)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(join(`public/img/profile/${req.file.filename}`));
  next();
};

//image resizing
const coverPhotoResize = async (req, res, next) => {
  //check if there is no file
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}-${
    req.file.originalname
  }`;
  await sharp(req.file.buffer)
    .resize(820, 312)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(join(`public/img/cover/${req.file.filename}`));
  next();
};

//post image resizing
const postImagePhotoResize = async (req, res, next) => {
  //check if there is no file
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}-${
    req.file.originalname
  }`;
  await sharp(req.file.buffer)
    .resize(820, 312)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(join(`public/img/posts/${req.file.filename}`));
  next();
};

module.exports = {
  profilePhotoUpload,
  postPhotoUpload,
  coverPhotoUpload,
  postImagePhotoResize,
  profilePhotoResize,
  coverPhotoResize,
};
