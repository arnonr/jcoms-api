const { PrismaClient } = require("@prisma/client");

const axios = require("axios");
const $table = "otp";
const prisma = new PrismaClient();


const randomOTP = async () => {

    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number

    // Generate a random number between min and max (inclusive)
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomNumber.toString();
};

const sendSMS = async (msisdn, message) => {

    try {
        let params = {
            msisdn: msisdn,
            message: message,
            // sender: "Demo",
            sender: "Teams",
            force: "corporate",
            // Shorten_url: true,
            // tracking_url: true,
            // expire:
        };
        let auth = {
            username: process.env.SMS_USERNAME,
            password: process.env.SMS_PASSWORD,
        };

        const sms = await axios.post(
            `https://api-v2.thaibulksms.com/sms`,
            params,{
                auth: auth,
            }
        );
        console.log(sms);
        return true;
    } catch (error) {
        // console.log(error.code);
        // console.log(error.name);
        // console.log(error.message);
        console.log(error.response.data.error);
        return error;
    }
};

const saveOTP = async(phone_number, otp, otp_secret) => {

    try {
        const item = await prisma[$table].create({
            data: {
                phone_number: phone_number,
                otp: otp,
                otp_secret: otp_secret,
                status: 0
            }
        });
        return item;
    } catch (error) {
        console.log(error);
        return error;
    }
}

const genarateOTP = async(phoneNumber, otpScretet) => {

    const debug = process.env.SMS_DEBUG == "true" ? true : false;

    const otp_secret = otpScretet;
    const phone_number = phoneNumber;
    const secret_phone_number = 'xxx-xxx-' + phone_number.slice(6, 10);

    const otp = await randomOTP();
    const message = `Your OTP is ${otp} (Ref: ${otp_secret})`;

    await saveOTP(phone_number, otp, otp_secret);

    if(debug){
        return {
            otp: otp,
            phone_number: secret_phone_number,
            // otp_secret: otp_secret,
            message: message,
        }
    }

    try {
        let result = await sendSMS(phoneNumber, message);
        if (result == true) {
            return {
                otp: otp,
                message: message
            };
        }else{
            throw new Error("error");
        }
    } catch (error) {
        return "error";
    }
}

const methods = {
    async verifyOTP(otp_secret, otp, phone_number = null) {

        let $where = {};
        $where["otp_secret"] = otp_secret;
        $where["otp"] = otp;
        $where["status"] = 0;

        if(phone_number){
            $where["phone_number"] = phone_number;
        }

        // $where["created_at"] = {
        //     gte: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        // }

        try{
            const item = await prisma[$table].findFirst({
                select: {id: true, phone_number: true},
                where: $where,
            });

            if(item){
                return item;
            }

            return false;
        } catch (error) {
            return false;
        }
    },

    async onUpdateOTP(id) {
        try {
            const item = await prisma[$table].update({
                where: {id: id},
                data: {
                    status: 1,
                    updated_at: new Date()
                }
            });
            return item;
        } catch (error) {
            return false;
        }
    },

    async onSendSms(req, res) {
        // console.log(req.body)
        let msisdn = req.body.msisdn;
        let message = req.body.message;

        if (msisdn == undefined) {
            return res.status(400).json({ msg: "msisdn is undefined" });
        }

        if (message == undefined) {
            return res.status(400).json({ msg: "message is undefined" });
        }

        try {
            let result = await sendSMS(msisdn, message);
            if (result) {
                return res.status(200).json({ msg: "success" });
            }else{
                return res.status(400).json({ msg: "error" });

            }

        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }

    },

    async onSendOTP(req, res) {

        if(!req.body.otp_secret) {
            return res.status(400).json({ msg: "otp_secret is required" });
        }

        if(!req.body.phone_number) {
            return res.status(400).json({ msg: "phone_number is required" });
        }

        const otp_secret = req.body.otp_secret;
        const phone_number = req.body.phone_number;

        try {
            const otp = await genarateOTP(phone_number, otp_secret);

            if(otp == "error") {
                return res.status(500).json({ msg: "error" });
            }

            res.status(200).json({
                data: otp,
                msg: "success",
            })
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onVerifyOTP (req, res) {

        if(!req.body.otp) {
            return res.status(400).json({ msg: "otp is required" });
        }

        if(!req.body.otp_secret) {
            return res.status(400).json({ msg: "otp_secret is required" });
        }

        if(!req.body.phone_number) {
            return res.status(400).json({ msg: "phone_number is required" });
        }

        const otp = req.body.otp;
        const otp_secret = req.body.otp_secret;
        const phone_number = req.body.phone_number;

        try {
            const otp_item = await methods.verifyOTP(otp_secret, otp, phone_number);
            if(otp_item == false) {
                return res.status(400).json({ msg: "OTP is invalid" });
            }

            await methods.onUpdateOTP(otp_item.id);

            return res.status(200).json({
                data: {
                    phone_number: phone_number,
                    otp_secret: otp_secret
                },
                msg: "success" });
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
    }
};

module.exports = { ...methods, genarateOTP };
