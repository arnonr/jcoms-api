const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/SmsController");


router.post("/send-sms", controllers.onSendSms);
router.post("/send-otp", controllers.onSendOTP);
router.post("/verify-otp", controllers.onVerifyOTP);

module.exports = router;
