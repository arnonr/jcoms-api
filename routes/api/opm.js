const express = require("express");
const router = express.Router();

const controllers = require("../../controllers/OpmController");


router.get("/get-token", controllers.onGetToken);
router.get('/get-case/:id', controllers.onGetCase);
router.get('/get-timeline-header', controllers.onGetTimelineHeader);
router.get('/get-case-detail/:id', controllers.onGetCaseDetail);
router.get('/sync-all', controllers.onSyncAll);
router.get('/sync-all-case', controllers.onGetAllCase);
router.get('/get-operatings/:id', controllers.onGetOperatings);
router.post('/add-operating/:id', controllers.onAddOperating);
router.post('/set-org-summary-result/:id', controllers.onSetOrgSummaryResult);
module.exports = router;
