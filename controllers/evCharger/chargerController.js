const EvCharger = require("../../model/evCharger/EvCharger");
const expressAsyncHandler = require("express-async-handler");
const validateMongoDbID = require("../../utils/validateMongoDbID");
const {
  checkForProfaneWords,
  checkForCrossSiteScripting,
} = require("../../middlewares/profaneWords/profaneWords");
const Yup = require("yup");

const formSchema = Yup.object().shape({
  description: Yup.string()
    .required("Description is required")
    .matches(/^[^<>]*$/, "Cannot contain characters < or >")
    .min(50, "Description must be long at least 50 characters.")
    .max(500, "Description must be short at most 500 characters."),
  rating: Yup.number().required("Rating is required"),
  chargerInfo: Yup.object().required("You must select charger"),
  batteryLevel: Yup.number()
    .required("Usable battery level is required")
    .min(0, "Usable battery level must be between 0 and 140")
    .max(140, "Usable battery level must be between 0 and 140"),
  avgConsumption: Yup.number()
    .required("Average consumption is required")
    .min(1, "Average consumption must be at least 1 kWh/100km")
    .max(50, "Average consumption cannot be more than 50 kWh/100km"),
});

// Create new charger point
const createEvCharger = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;

  //check if user is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot create new charger and post."
    );
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  const title =
    req?.body?.chargerInfo?.OperatorInfo?.Title ??
    req?.body?.chargerInfo.AddressInfo.Title;

  try {
    await formSchema.validate(req?.body);

    const evCharger = await EvCharger.create({
      ...req?.body,
      user: req?.user,
      title: title,
    });
    res.json(evCharger);
  } catch (error) {
    res.status(500).json(error);
  }
});

// create new charger point update
const createEvChargerUpdate = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;

  //check if user is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot create new charger."
    );
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  const postChargers = await EvCharger.find({ post: req?.body?.postId });
  if (postChargers.length + 1 > 23) {
    throw new Error("You can only add up to 23 chargers!");
  }

  const title =
    req?.body?.chargerInfo?.OperatorInfo?.Title ??
    req?.body?.chargerInfo.AddressInfo.Title;

  try {
    await formSchema.validate({
      description: req?.body?.description,
      chargerInfo: req?.body?.chargerInfo,
      batteryLevel: req?.body?.batteryLevel,
      avgConsumption: req?.body?.avgConsumption,
      rating: req?.body?.rating,
    });

    const evCharger = await EvCharger.create({
      description: req?.body?.description,
      chargerInfo: req?.body?.chargerInfo,
      batteryLevel: req?.body?.batteryLevel,
      avgConsumption: req?.body?.avgConsumption,
      rating: req?.body?.rating,
      user: req?.user,
      title: title,
      sequenceNumber: req?.body?.number,
      post: req?.body?.postId,
      isAssigned: true,
    });
    res.json(evCharger);
  } catch (error) {
    res.status(500).json(error);
  }
});

//delete charger point
const deleteEvCharger = expressAsyncHandler(async (req, res) => {
  const { _id } = req?.user;
  const { id } = req?.params;

  validateMongoDbID(id);

  try {
    const evChargerPermission = await EvCharger.findById(id);
    if (
      evChargerPermission?.user?._id.toString() !== _id.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not authorized to delete this charger." });
    } else {
      const evCharger = await EvCharger.findByIdAndDelete(id);
      res.json(evCharger);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//fetch charger details
const fetchEvChargerDetails = expressAsyncHandler(async (req, res) => {
  const { id } = req?.params;

  validateMongoDbID(id);

  try {
    const evCharger = await EvCharger.findById(id);
    res.json(evCharger);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update charger
const updateEvCharger = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { _id } = req?.user;
  const { id } = req?.params;
  validateMongoDbID(id);

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(_id, req);
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  try {
    //check if userID is the same as the user who created the post
    const evChargerPermission = await EvCharger.findById(id);

    if (
      evChargerPermission?.user?._id.toString() !== _id.toString() &&
      !req?.user?.isAdmin
    ) {
      res
        .status(404)
        .json({ message: "You are not authorized to update this charger." });
    } else {
      await formSchema.validate({
        description: req?.body?.description,
        chargerInfo: req?.body?.chargerInfo,
        batteryLevel: req?.body?.batteryLevel,
        avgConsumption: req?.body?.avgConsumption,
        rating: req?.body?.rating,
      });

      const title =
        req?.body?.chargerInfo?.OperatorInfo?.Title ??
        req?.body?.chargerInfo.AddressInfo.Title;

      const charger = await EvCharger.findByIdAndUpdate(
        id,
        {
          description: req?.body?.description,
          chargerInfo: req?.body?.chargerInfo,
          rating: req?.body?.rating,
          batteryLevel: req?.body?.batteryLevel,
          avgConsumption: req?.body?.avgConsumption,
          user: req?.user,
          title: title,
        },
        { new: true, runValidators: true }
      );
      res.json(charger);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

//delete all chargers that does not have a post
const deleteAllEvChargers = expressAsyncHandler(async (req, res) => {
  const loginUser = req?.user;

  if (!loginUser?.isAdmin) {
    throw new Error("You are not authorized to perform this action");
  }

  try {
    const evChargers = await EvCharger.deleteMany({
      isAssigned: false,
    });
    res.json(evChargers);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = {
  createEvCharger,
  deleteEvCharger,
  fetchEvChargerDetails,
  updateEvCharger,
  deleteAllEvChargers,
  createEvChargerUpdate,
};
