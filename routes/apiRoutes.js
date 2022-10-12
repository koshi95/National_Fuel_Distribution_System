const express = require("express");
const router = express.Router();
const apiController = require("../controllers/userController")

router.post("/register", apiController.register);
router.post("/verification", apiController.verification);
router.post("/vehicleInfo", apiController.vehicleInfo);
router.get("/userVehicleList", apiController.userVehicleList);
router.post("/userVehicleInfoGet", apiController.userVehicleInfoGet);
router.post("/driverLogin", apiController.driverLogin);
router.get("/vehicleTypes", apiController.vehicleTypes);
router.post("/manufactureurers", apiController.manufactureurers);
router.post("/Loginverification", apiController.Loginverification);
router.post("/logOut", apiController.logOut);

module.exports = router;