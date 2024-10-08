const express = require("express");
// import api from './api/index.js'
const router = express.Router();
const prefixName = require("./api/prefix-name");
const position = require("./api/position");
const inspector = require("./api/inspector");
// const froala = require("./api/froala");
const bureau = require("./api/bureau");
const division = require("./api/division");
const agency = require("./api/agency");
const role = require("./api/role");
const section = require("./api/section");
const user = require("./api/user");
const complaintType = require("./api/complaint-type");
const occupation = require("./api/occupation");
const complainant = require("./api/complainant");
const province = require("./api/province");
const district = require("./api/district");
const subDistrict = require("./api/sub-district");
const complaintChannel = require("./api/complaint-channel");
const topicCategory = require("./api/topic-category");
const topicType = require("./api/topic-type");
const state = require("./api/state");
const order = require("./api/order");
const proceedStatus = require("./api/proceed-status");
const complaintReport = require("./api/complaint-report");
const complaintForward = require("./api/complaint-forward");
const complaintFollow = require("./api/complaint-follow");
const loginLog = require("./api/login-log");
const complaint = require("./api/complaint");
const accused = require("./api/accused");
const froala = require("./api/froala");
const compiaintFileAttach = require("./api/complaint-file-attach");
const sms = require("./api/sms");
const email = require("./api/email");
const complaintExtend = require("./api/complaint-extend");
const inspectorState = require("./api/inspector-state");
const permission = require("./api/permission");
const userPermission = require("./api/user-permission");
const opm = require("./api/opm");
const visitWebsiteLog = require("./api/visit-website-log");
const OrganizationPermission = require("./api/organization-permission");
const thaid = require("./api/thaid");
const apiUser = require("./api/api-user");
const moi = require("./api/moi");
const authenticateApiKey = require('./middleware/authenticateApiKey');
const customRateLimiter = require('./middleware/customRateLimiter');




  
// Apply authentication middleware
router.use(authenticateApiKey);

// Apply custom rate limiting middleware
router.use(customRateLimiter);



router.use(
  `/api/v${process.env.API_VERSION}`,
  router.use("/prefix-name", prefixName),
  router.use("/position", position),
  router.use("/inspector", inspector),
  // router.use("/froala", froala),
  router.use("/bureau", bureau),
  router.use("/division", division),
  router.use("/agency", agency),
  router.use("/role", role),
  router.use("/section", section),
  router.use("/user", user),
  router.use("/complaint-type", complaintType),
  router.use("/occupation", occupation),
  router.use("/complainant", complainant),
  router.use("/province", province),
  router.use("/district", district),
  router.use("/sub-district", subDistrict),
  router.use("/complaint-channel", complaintChannel),
  router.use("/topic-category", topicCategory),
  router.use("/topic-type", topicType),
  router.use("/state", state),
  router.use("/order", order),
  router.use("/proceed-status", proceedStatus),
  router.use("/complaint-report", complaintReport),
  router.use("/complaint-forward", complaintForward),
  router.use("/complaint-follow", complaintFollow),
  router.use("/login-log", loginLog),
  router.use("/complaint", complaint),
  router.use("/accused", accused),
  router.use("/froala", froala),
  router.use("/complaint-file-attach", compiaintFileAttach),
  router.use("/sms", sms),
  router.use("/email", email),
  router.use("/complaint-extend", complaintExtend),
  router.use("/inspector-state", inspectorState),
  router.use("/permission", permission),
  router.use("/user-permission", userPermission),
  router.use("/opm", opm),
  router.use("/visit-website-log", visitWebsiteLog),
  router.use("/organization-permission", OrganizationPermission),
  router.use("/thaid", thaid),
  router.use("/api-user", apiUser),
  router.use("/moi", moi)
);

module.exports = router;
