const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const $table_complaint = "complaint";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const xml2js = require('xml2js');
const $user = "servicejaray";
const $password = "53ad4e7726f820b84c1fa474098e4b6b";
// const $authen_from = "S";

    // This function handles getting the token
const getToken = async () => {
    try {
        const user = process.env.USER || $user;
        const password = process.env.PASSWORD || $password;

        let params = {
            'user': user,
            'password': password,
            'authen_from': 'S',
            'ip_address': '202.44.41.31'
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/GetToken";
        const response = await axios.get(url, { params });

        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

const getTimelineHeader = async () => {

    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;

        let params = {
            'last_get_date_time': "",
            'timeline_type': "A", //A=ทั้งหมด, I=รายการรับ, P=กำลังดำเนินการ, N=รายการแจ้งเตือน
            'skip': 0,
            'take': 1,
            'token_id': tokenId
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/GetTimelineHeader";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting timeline header:', error);
        throw error;
    }
};

const getCase = async (case_id) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        let params = {
            'token_id': tokenId,
            'case_id': case_id
        };
        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/GetCase";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting case:', error);
        throw error;
    }
};

const parseXmlResponse = async (xmlData) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xmlData, (err, result) => {
            if (err) {
                console.error('XML parsing error:', err);
                reject(err);
                return;
            }

            if (result && result.string && result.string._) {
                try {
                    const jsonData = JSON.parse(result.string._);
                    const tokenId = jsonData.token_id;
                    // resolve(tokenId);
                    resolve(jsonData);
                } catch (jsonError) {
                    console.error('JSON parsing error:', jsonError);
                    reject(jsonError);
                }
            } else {
                console.log('Unexpected XML structure:', result);
                reject(new Error('Unexpected XML structure'));
            }
        });
    });
};

    const convertTimestampToDate = (dateString) => {

        // Check if the input is a string and matches the expected format
        if (typeof dateString !== 'string' || !/^Date\(\d+\)$/.test(dateString)) {
            throw new Error('Input must be a string in the format Date(timestamp)');
        }

        // Extract the timestamp from the string
        const timestamp = parseInt(dateString.match(/\d+/)[0], 10);

        // Check if the input is a number
        if (typeof timestamp !== 'number') {
            throw new Error('Input must be a number');
        }

        // Check if the timestamp is within a reasonable range
        // Unix timestamp should be positive and not too far in the future
        const currentTime = Date.now();
        const maxFutureTime = currentTime + (100 * 365 * 24 * 60 * 60 * 1000); // 100 years in the future

        if (timestamp < 0 || timestamp > maxFutureTime) {
            throw new Error('Timestamp is out of reasonable range');
        }

        // Create a Date object
        const date = new Date(timestamp);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }

        return date;
    };

const saveComplaint = async (caseItem) => {
    try {

        const case_id = caseItem.case_id;
        const complaint_title = caseItem.summary;
        const complaint_detail = caseItem.detail;
        const is_anonymous = caseItem.is_secret == "T" ? 1 : 0;
        const complaint_channel_id = 3; // ศูนย์รับเรื่องราวร้องทุกข์ของรัฐบาล 1111

        const date_occurrenced_from = caseItem.date_occurrenced_from;
        console.log("date "+date_occurrenced_from);
        // convertTimestampToDate(date_occurrenced_from);

    // // Unix timestamp in milliseconds
    // const timestamp = date_occurrenced_from;

    // // Create a Date object
    // const date = new Date(timestamp);

    // // Now you can use various methods to format the date
    // console.log('Full date string:', date.toString());
    // console.log('ISO format:', date.toISOString());
    // console.log('Local date string:', date.toLocaleDateString());
    // console.log('Local time string:', date.toLocaleTimeString());

    // // You can also extract specific components
    // console.log('Year:', date.getFullYear());
    // console.log('Month:', date.getMonth() + 1); // Note: months are 0-indexed
    // console.log('Day:', date.getDate());
    // console.log('Hours:', date.getHours());
    // console.log('Minutes:', date.getMinutes());
    // console.log('Seconds:', date.getSeconds());

        const upsertedCase = await prisma[$table_complaint].upsert({
            where: {
                // Assuming case_id is unique
                case_id: case_id,
            },
            update: {
                // uuid: uuidv4(),
                complaint_title: complaint_title,
                complaint_detail: complaint_detail,
                is_anonymous: is_anonymous,
                complaint_channel_id: complaint_channel_id,
            },
            create: {
                uuid: uuidv4(),
                case_id: case_id,
                complaint_title: complaint_title,
                complaint_detail: complaint_detail,
                is_anonymous: is_anonymous,
                complaint_channel_id: complaint_channel_id,
            }
        });

        console.log(upsertedCase);
        // const item = await prisma[$table_complaint].findFirst({
        //     select: {
        //         id: true,
        //         case_id: true,
        //     },
        //     where: {
        //         case_id: data.case_id,
        //     },
        // });

        // if(item) {
        //     console.log(`Case ${data.case_id} already exists in database.`);
        // }else{
        //     console.log(`Case ${data.case_id} not found in database. Saving...`);
        // }

        // const result = await prisma.complaint.create({
        //     data: data
        // });
        // return result;
    } catch (error) {
        console.error('Error saving complaint:', error);
        throw error;
    }
};

const methods = {

// Route handler
    async onGetToken(req, res) {
        try {
            const jsonData = await getToken();
            const tokenId = jsonData.token_id;
            res.status(200).json({ token_id: tokenId, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },
    async onGetTimelineHeader(req, res) {

        try {
            const jsonData = await getTimelineHeader();
            const complaint = jsonData;
            res.status(200).json({ "complaint": complaint, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetCaseDetail(req, res) {
        try {
            console.log(req.params.id);
            const jsonData = await getCase(req.params.id);
            const caseDetail = jsonData;
            res.status(200).json({ "caseDetail": caseDetail, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onSyncAll(req, res) {
        try {
            const jsonData = await getTimelineHeader();
            const cases = jsonData;
            // console.log(cases);
            const results = await Promise.all(cases.map(async (caseItem, index) => {

                console.log(`Processing Case ${index + 1}:`);
                try{
                    const caseDetail = await getCase(caseItem.case_id);
                    // console.log(caseDetail);
                    await saveComplaint(caseDetail);

                    return { case_id: caseItem.case_id, case_detail: caseDetail };
                } catch (error) {
                    console.error(`Error processing case ${caseItem.case_id}:`, error);
                    return { caseId: caseItem.case_id, error: error.message };
                }

            }));

            // console.log('All cases processed:', results);
            res.status(200).json({ "results": results, msg: "success" });
            // res.status(200).json({ msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }

};

module.exports = { ...methods };
