const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const routes = require("./routes");
var path = require("path");
const bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const requestIp = require('request-ip');
dotenv.config();

const app = express();
const port = process.env.APP_PORT || 3002;

const corsOptions = {
  origin: "*",
  credentials: true,
};



app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({ extended: true,limit: '500mb' }));
app.use(cors(corsOptions));
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use(fileUpload());

// Middleware สำหรับดึง IP Address
app.use(requestIp.mw());

app.use("/static", express.static(__dirname + "/public"));

app.use(routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
