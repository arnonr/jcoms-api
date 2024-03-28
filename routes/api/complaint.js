const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/ComplaintController");

router.get("/", controllers.onGetAll);

router.post("/get-otp-tracking", controllers.onGetOTPTracking);
router.post("/verify-otp-tracking", controllers.onVertifyOTPTracking);
router.get("/get-complaint-by-otp", controllers.onGetAllByOTP);
router.get("/:id", controllers.onGetById);

router.post("/", controllers.onCreate);

router.put("/:id", controllers.onUpdate);
// router.post("/:id", controllers.onUpdate); /* POST method for Upload file */

router.delete("/:id", controllers.onDelete);

module.exports = router;
