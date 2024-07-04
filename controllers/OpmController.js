const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const $table_complaint = "complaint";
const $table_complainant = "complainant";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const xml2js = require('xml2js');

const $user = "servicejaray";
const $password = "53ad4e7726f820b84c1fa474098e4b6b";

const provinceController = require("./ProvinceController");
const districtController = require("./DistrictController");
const subDistrictController = require("./SubDistrictController");
const prefixNameController = require("./PrefixNameController");
const helperController = require("./HelperController");
// const $authen_from = "S";

    // This function handles getting the token
const getToken = async () => {
    try {
        // const user = process.env.USER || $user;
        // const password = process.env.PASSWORD || $password;

        const user = $user;
        const password = $password;

        let params = {
            'user': user,
            'password': password,
            'authen_from': 'S',
            'ip_address': ':::1'
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
            'take': 10,
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

const addOperating = async (complaint_id, req) => {
    try {

        const jsonData = await getToken();
        const tokenId = jsonData.token_id;

        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
            // select: select,
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.case_id == null) {
            throw new Error('Case not found');
        }

        const case_id = item.case_id;
        const detail = req.body.detail;
        const date_opened = req.body.date_opened;
        const date_closed = req.body.date_closed;

        if(detail == null) {
            throw new Error('Detail required');
        }

        if(date_opened == null) {
            throw new Error('Date opened required');
        }

        if(date_closed == null) {
            throw new Error('Date closed required');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id,
            'type_id': '14',
            'objective_id': '1',
            'terminal_org_id': '2608',
            'terminal_owner_id': 'DF28B6CA3C694C959521B3F7180CB236',
            'channel_id': '5899EE5D72CF3652A4AAE69E429D9DED',
            'contact_detail': '',
            'date_opened': date_opened, // '2015-12-31 15:32:12'
            'date_closed': date_closed, // '2015-12-31 15:32:12'
            'detail': detail,
            'severity_id': '1',
            'secret_id': '1',
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/AddOperating";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error adding operating:', error);
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

const convertDateString = (dateString) => {

           // Check if the input is a string and matches the expected format
    if (typeof dateString !== 'string' || !/^\/Date\(\d+\)\/$/.test(dateString)) {
        throw new Error('Input must be a string in the format /Date(timestamp)/');
    }

    // Extract the timestamp from the string
    const timestamp = parseInt(dateString.match(/\d+/)[0], 10);

    // Check if the extracted timestamp is a valid number
    if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp in the input string');
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
        const case_area = caseItem.case_area;

        let complainant_id = null;

        let subdistrict_text = null;
        let district_text = null;
        let province_text = null;
        let postcode = null;
        let prename = null;
        let firstname = null;
        let lastname = null;
        let citizen_id = null;

        if(caseItem.customer != null) {
            subdistrict_text = caseItem.customer.subdistrict_text;
            district_text = caseItem.customer.district_text;
            province_text = caseItem.customer.province_text;
            postcode = caseItem.customer.postcode;

            prename = caseItem.customer.salutation_th;
            firstname = caseItem.customer.firstname_th;
            lastname = caseItem.customer.lastname_th;
            citizen_id = caseItem.customer.citizen_id;
        }

        if(postcode != null) {
            postcode = postcode.trim();
        }

        const date_occurrenced_from = caseItem.date_occurrenced_from;
        const date_from = convertDateString(date_occurrenced_from);
        const date_from_iso = date_from.toISOString();

        const province_id = await provinceController.onGetId(province_text);
        const sub_district_id = await subDistrictController.onGetId(subdistrict_text);
        const district_id = await districtController.onGetId(district_text);
        const prefix_name_id = await prefixNameController.onGetId(prename);

        const upsertComplainant = await prisma[$table_complainant].upsert({
            where: {
                // Assuming case_id is unique
                case_id: case_id,
            },
            update: {
                uuid: uuidv4(),
                prefix_name_id: prefix_name_id != null ? Number(prefix_name_id) : undefined,
                firstname: firstname,
                lastname: lastname,
                phone_number : uuidv4(),
                id_card: citizen_id != null ? helperController.base64EncodeWithKey(citizen_id) : undefined,
            },
            create: {
                uuid: uuidv4(),
                case_id: case_id,
                prefix_name_id: prefix_name_id != null ? Number(prefix_name_id) : undefined,
                firstname: firstname,
                lastname: lastname,
                phone_number : uuidv4(),
                id_card: citizen_id != null ? helperController.base64EncodeWithKey(citizen_id) : undefined,
            }
        });

        // console.log(upsertComplainant);

        if(upsertComplainant) {
            complainant_id = upsertComplainant.id;
            // console.log("decode_id" + helperController.base64DecodeWithKey(upsertComplainant.id_card));
        }

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
                incident_datetime: date_from_iso,
                incident_location: case_area,
                sub_district_id: sub_district_id,
                district_id: district_id,
                province_id: province_id,
                postal_code: postcode,
                complainant_id: complainant_id,
            },
            create: {
                uuid: uuidv4(),
                case_id: case_id,
                complaint_title: complaint_title,
                complaint_detail: complaint_detail,
                is_anonymous: is_anonymous,
                complaint_channel_id: complaint_channel_id,
                incident_datetime: date_from_iso,
                incident_location: case_area,
                sub_district_id: sub_district_id,
                district_id: district_id,
                province_id: province_id,
                postal_code: postcode,
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

            if(tokenId == null) {
                res.status(500).json({ msg: "Token not found" });
            }

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
    },

    async onAddOperating(req, res) {
        try {
            const jsonData = await addOperating(req.params.id, req);
            const operating = jsonData;
            res.status(200).json({ "operating": operating, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }

};

module.exports = { ...methods };
