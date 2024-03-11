const express = require("express");
// import api from './api/index.js'
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

const router = express.Router();

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
  router.use("/proceed-status", proceedStatus)
);

module.exports = router;
