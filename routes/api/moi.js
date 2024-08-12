const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/MoiController");

router.get("/get-token", controllers.onGetToken);
router.get('/get-data', controllers.onGetData);
router.post('/sync-data', controllers.onSyncData);
router.post('/update-status/:id', controllers.onUpdateStatus);
router.get('/get-file/:id', controllers.onGetFile);
module.exports = router;
