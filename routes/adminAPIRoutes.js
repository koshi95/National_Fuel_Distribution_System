const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController")

router.post("/login", adminController.login)
router.post("/addPumper", adminController.addPumper)
router.get("/pumperList", adminController.pumperList)
router.post("/deletePumper", adminController.deletePumper)
router.post("/stockupdate", adminController.stockupdate)
router.get("/stockupdateHistory", adminController.stockupdateHistory)
router.get("/analytics", adminController.analytics)
router.post("/EditPumper", adminController.EditPumper)

module.exports = router;