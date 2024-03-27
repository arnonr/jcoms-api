const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/SmsController");


router.post("/", controllers.onSendSms);

module.exports = router;
