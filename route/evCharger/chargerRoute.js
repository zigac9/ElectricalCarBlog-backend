const express = require("express");
const authMiddleware = require("../../middlewares/auth/authMiddleware");

const chargerRoute = express.Router();

const {
  createEvCharger,
  deleteEvCharger,
  fetchEvChargerDetails,
  updateEvCharger,
  deleteAllEvChargers,
  createEvChargerUpdate,
} = require("../../controllers/evCharger/chargerController");

chargerRoute.post("/", authMiddleware, createEvCharger);
chargerRoute.delete("/:id", authMiddleware, deleteEvCharger);
chargerRoute.get("/:id", fetchEvChargerDetails);
chargerRoute.put("/:id", authMiddleware, updateEvCharger);
chargerRoute.delete("/", authMiddleware, deleteAllEvChargers);
chargerRoute.post("/create", authMiddleware, createEvChargerUpdate);

module.exports = chargerRoute;
