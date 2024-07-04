const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/OpmController");


router.get("/get-token", controllers.onGetToken);
router.get('/get-timeline-header', controllers.onGetTimelineHeader);
router.get('/get-case-detail/:id', controllers.onGetCaseDetail);
router.get('/sync-all', controllers.onSyncAll);
router.post('/add-operating/:id', controllers.onAddOperating);

module.exports = router;
