const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/ThaidController");


router.get("/token-request", controllers.tokenRequest);

module.exports = router;
