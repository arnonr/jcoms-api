var path = require("path");
// const sharp = require('sharp');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');

const methods = {
    async onUploadFile(req, real_path, attribute_name) {

        try {

        let pathFile = null;

        if (!req.files || Object.keys(req.files).length === 0) {

        } else {

            // console.log(Object.keys(req.files));
            // console.log(req.files);
            // console.log(attribute_name);
            // let fileObject = Object.keys(req.files);
            // console.log(typeof fileObject); //;
            if(req.files[attribute_name] == undefined) {
                return null;
            }

            let uploadFile = req.files[attribute_name];
            let typeFile = uploadFile.mimetype.split("/");
            let d = new Date();
            let date = d.getFullYear() + "" + d.getMonth() + "" + d.getDate();
            let nameFile = date + "_" + uuidv4() + "." + typeFile[1];

            let uploadFolder = "/../public/uploads" + real_path;

            let pathUpload = path.resolve(
                __dirname + uploadFolder + nameFile
            );

            /* Create path if not exists */
            // if (!fs.existsSync(uploadFolder)) {
            // console.log("Create path: " + uploadFolder);
            // fs.mkdirSync(uploadFolder);
            // }

            // console.log(pathUpload);

            // console.log(uploadFile.data.buffer);

            // /* Resize and save to path */
            // sharp(uploadFile.data.buffer)
            // .resize(300)
            // .toFile(pathUpload, (err, info) => {
            //     console.log(info);
            //     if (err) return err;
            // });

            /* Move to path */
            uploadFile.mv(pathUpload, function (err) {
                if (err) return err;
            });

            pathFile = real_path + nameFile;

            // console.log(pathFile);
            // sharp(pathUpload)
            // .resize(100, 100)
            // // .toBuffer();
            // .toFile(pathUpload, (err, info) => {

            // })
        }

        return pathFile;

        } catch (error) {
            return "error";
            // return error;
        }
    },
};

module.exports = { ...methods };
