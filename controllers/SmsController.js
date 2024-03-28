const { PrismaClient } = require("@prisma/client");

const axios = require("axios");
const $table = "otp";
const prisma = new PrismaClient();

const sendSMS = async (msisdn, message) => {
    try {
        let params = {
            msisdn: msisdn,
            message: message,
            sender: "Demo",
            force: "corporate",
            // Shorten_url: true,
            // tracking_url: true,
            // expire:
        };
        let auth = {
            username: process.env.SMS_USERNAME,
            passwordx: process.env.SMS_PASSWORD,
        };

        const sms = await axios.post(
            `https://api-v2.thaibulksms.com/sms`,
            params,{
                auth: auth,
            }
        );

        return true;
    } catch (error) {
        // console.log(error);
        return error;
    }
};

const generateOTP = async () => {

    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number

    // Generate a random number between min and max (inclusive)
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomNumber.toString();
}

const saveOTP = async(phone_number, otp, otp_secret) => {

    try {
        const item = await prisma[$table].create({
            data: {
                phone_number: phone_number,
                otp: otp,
                otp_secret: otp_secret,
                status: 1
            }
        });
        return item;
    } catch (error) {
        console.log(error);
        return error;
    }
}

const methods = {
    async onVerifyOtp(otp_secret, otp) {

        try{
            const item = await prisma[$table].findFirst({
                select: {id: true, phone_number: true},
                where: {
                    otp_secret: otp_secret,
                    otp: otp,
                    status: 1,
                    created_at: {
                        gte: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                    },
                },
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
                    status: 0
                }
            });
            return item;
        } catch (error) {
            return false;
        }
    },

    async onSendOTP(phoneNumber, otpSecret) {

        const phone_number = phoneNumber;
        const secret_phone_number = 'xxx-xxx-' + phone_number.slice(6);

        const otp = await generateOTP();
        const message = `รหัส OTP คือ ${otp} (Ref: ${otpSecret})`;

        await saveOTP(phone_number, otp, otpSecret);

        return {
            otp: otp,
            phone_number: secret_phone_number,
            otp_secret: otpSecret,
            message: message,
        }

        // try {
        //     let result = await sendSMS(phoneNumber, message);
        //     if (result == true) {
        //         return {
        //             otp: otp,
        //             message: message
        //         };
        //     }else{
        //         throw new Error("error");
        //     }
        // } catch (error) {
        //     return "error";
        // }

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
};

module.exports = { ...methods };
