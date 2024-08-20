const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const routes = require("./routes");
var path = require("path");
const bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const requestIp = require('request-ip');
// const helmet = require('helmet');

dotenv.config();

const app = express();
const port = process.env.APP_PORT || 3002;

const corsOptions = {
  origin: "https://jcoms2.police.go.th",
  credentials: true,
};
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        // scriptSrc: ["'self'", "https://trusted.cdn.com"],
        // styleSrc: ["'self'", "https://fonts.googleapis.com"],
        // fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    })
  );

// res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self'; img-src 'self' https://trusted.images.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"); 
// app.disable('x-powered-by');

// app.use(helmet());

// app.use((req, res, next) => {
//     res.setHeader('Referrer-Policy', 'no-referrer');
//     next();
//   });

//   // เพิ่ม Strict-Transport-Security header
// app.use((req, res, next) => {
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
//     next();
//   });

//   app.use((req, res, next) => {
//     res.setHeader(
//       "Content-Security-Policy",
//       "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self';"
//     );
//     next();
//   });
  

app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({ extended: true,limit: '500mb' }));
app.use(cors(corsOptions));
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// app.use((req, res, next) => {
//     res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
//     next();
// });



app.use(fileUpload());

// Middleware สำหรับดึง IP Address
app.use(requestIp.mw());

app.use("/static", express.static(__dirname + "/public"));

app.use(routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
