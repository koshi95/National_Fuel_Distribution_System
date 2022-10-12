const express = require("express");
const router = express.Router();
const adminController = require("../controllers/pumperController")

router.post("/pumperlogin", adminController.pumperLogin)
router.post("/pumperLoginVerification", adminController.pumperLoginVerification)
router.post("/pumperDetails", adminController.pumperDetails)
router.post("/searchVehicle", adminController.searchVehicle)
router.post("/pump", adminController.pump)

module.exports = router;