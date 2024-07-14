const express = require("express");
const router = express.Router();
const requestIp = require('request-ip');

const controllers = require("../../controllers/VisitWebsiteLogController");

// Middleware to get client IP
router.use(requestIp.mw());

router.get("/", controllers.onGetAll);
router.get("/:id", controllers.onGetById);
router.post("/", controllers.onCreate);

router.put("/:id", controllers.onUpdate);

router.delete("/:id", controllers.onDelete);

module.exports = router;
