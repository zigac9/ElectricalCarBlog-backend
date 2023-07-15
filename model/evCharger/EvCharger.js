const mongoose = require("mongoose");

const evChargerSchema = new mongoose.Schema(
  {
    user: {
      type: Object,
      required: [true, "User is required"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    rating: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    chargerInfo: {
      type: Object,
      required: [true, "Charger info is required"],
    },
    sequenceNumber: {
      type: Number,
      required: true,
      default: 0,
    },
    batteryLevel: {
      type: Number,
      required: true,
      default: 0,
    },
    avgConsumption: {
      type: Number,
      required: true,
      default: 0,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true, //when user was created
  }
);

const EvCharger = mongoose.model("EvCharger", evChargerSchema);

module.exports = EvCharger;
