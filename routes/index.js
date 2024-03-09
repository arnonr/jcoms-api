const express = require("express");
// import api from './api/index.js'
const assetLocationHistory = require("./api/asset-location-history");
const assetPhoto = require("./api/asset-photo");
const asset = require("./api/asset");
const department = require("./api/department");
const holderHistory = require("./api/holder-history");
const repairHistory = require("./api/repair-history");
const budgetType = require("./api/budget-type");
const assetType = require("./api/asset-type");
const user = require("./api/user");
const froala = require("./api/froala");

const router = express.Router();

router.use(
  `/api/v${process.env.API_VERSION}`,
  router.use("/asset-location-history", assetLocationHistory),
  router.use("/asset-photo", assetPhoto),
  router.use("/asset-type", assetType),
  router.use("/asset", asset),
  router.use("/budget-type", budgetType),
  router.use("/department", department),
  router.use("/holder-history", holderHistory),
  router.use("/repair-history", repairHistory),
  router.use("/user", user),
  router.use("/froala", froala),

  // router.use("/news", news),
  // router.use("/news-type", newsType),


  // router.use("/news-gallery", newsGallery),

);

module.exports = router;
