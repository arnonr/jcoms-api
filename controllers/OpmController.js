const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;
const fs = require('fs');
const fsPromises = require('fs').promises;
const mime = require('mime-types');
const path = require('path');
const $table_complaint = "complaint";
const $table_complainant = "complainant";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const xml2js = require('xml2js');

const $user = "servicejaray";
const $password = "53ad4e7726f820b84c1fa474098e4b6b";

const complaintController = require("./ComplaintController");
const provinceController = require("./ProvinceController");
const districtController = require("./DistrictController");
const subDistrictController = require("./SubDistrictController");
const prefixNameController = require("./PrefixNameController");
const helperController = require("./HelperController");
const uploadController = require("./UploadsController");
const opmUrl = "http://203.113.25.98/CoreService";
const fileDir = "public/uploads";
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
            'authen_from': 'I',
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

const getTimelineHeader = async (req) => {

    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        const timeline_type = req.query.timeline_type;

        if(!timeline_type) {
            throw new Error('Timeline type required');
        }

        let type = timeline_type == "A" ? "A" : "I";
        let params = {
            'last_get_date_time': "",
            'timeline_type': type, //A=ทั้งหมด, I=รายการรับ, P=กำลังดำเนินการ, N=รายการแจ้งเตือน
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

const getFirstOperating = async (complaint_id) => {

    try {
        const operatings = await getOperatings(complaint_id);
        // console.log(operatings.length);
        if (operatings?.length > 0) {
            const firstOperating = operatings[0];
            // console.log("First operating item:", firstOperating);
            return firstOperating;
        } else {
            console.log("No operating items found.");
        }

        return null;

    } catch (error) {
        console.error('Error getting first operating:', error);
        throw error;
    }
}
const addOperating = async (complaint_id, req) => {
    try {

        const jsonData = await getToken();
        const tokenId = jsonData.token_id;

        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
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
        const type_id = req.body.type_id;
        const detail = req.body.detail;
        const contact_detail = req.body.contact_detail;
        const date_opened = req.body.date_opened;
        const date_closed = req.body.date_closed;

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

        if(type_id == null) {
            throw new Error('type_id required');
        }

        if(detail == null) {
            throw new Error('Detail required');
        }

        const operatings = await getFirstOperating(complaint_id);
        if(operatings == null) {
            throw new Error('First operating not found');
        }
        const terminal_org_id = operatings.org_id;
        const terminal_owner_id = operatings.created_by;

        let params = {
            'token_id': tokenId,
            'case_id': case_id,
            'type_id': type_id, /* ประเภทการปฎิบัติงาน: 14=รายงานผลการปฎิบัติงาน(รับ), 15=รายงานผลการพิจารณาเรื่อง(ไม่รับ) */
            'objective_id': '16', /* กำหนดไว้เป็น 6 */
            'terminal_org_id': terminal_org_id, /* created_by_org “110” */
            'terminal_owner_id': terminal_owner_id,
            'channel_id': '5899EE5D72CF3652A4AAE69E429D9DED', /* คู่มือ: ช่องทางระบบ */
            'contact_detail': contact_detail || '',
            'date_opened': formattedDate, // '2015-12-31 15:32:12'
            'date_closed': formattedDate, // '2015-12-31 15:32:12'
            'detail': detail,
            'severity_id': '1',
            'secret_id': '1',
        };

        const url = opmUrl + "/SOAP/Officer.asmx/AddOperating";
        const response = await axios.get(url, { params });
        const data = await parseXmlResponse(response.data);
        const operating_id = extractId(data);

        if(operating_id != null) {
            req.body.operating_id = operating_id;
            await operatingAttachment(complaint_id, req);
        }

        return data;
    } catch (error) {
        console.error('Error adding operating:', error);
        throw error;
    }
};

const extractId = (resultString) => {
    // Split the string at ':'
    const parts = resultString.split(':');

    // Check if we have at least two parts and return the second part (the ID)
    if (parts.length >= 2) {
        return parts[1].trim(); // trim() removes any leading/trailing whitespace
    } else {
        // If the string doesn't contain ':', return null or throw an error
        console.error('Invalid result string format');
        return null;
    }
}

const setOrgSummaryResult = async (complaint_id, req) => {
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
        const status_id = req.body.status_id;
        const result = req.body.result;

        if(status_id == null) {
            throw new Error('Status id required');
        }

        if(result == null) {
            throw new Error('Result required');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id, /* string รหัสเรื่องที่ใช้ในการอ้างอิงภายในระบบ */
            'status_id': status_id, /* string 0=อยู่ระหว่างดําเนินการ, 1=ยุติเรื่อง, 2=รับทราบไว้ขั้นต้น ,3=ไม่อยู่ในอำนาจหน้าที่ */
            'result': result, /* string ผลการปฏิบัติงานแจ้งผู้ร้องเรียน */
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/SetOrgSummaryResult";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        // console.error('Error setting org summary result:', error);
        throw error;
    }
};

const getCase = async (case_id) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetCase";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting case:', error);
        throw error;
    }
};

const getAttachment = async (attachment_id) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'attachment_id ': attachment_id,
            'is_preview': 'true'
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetAttachment";
        const response = await axios.get(url, { params });

        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting attachment:', error);
        throw error;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const operatingAttachment = async (complaint_id, req) => {

    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
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

        if(req.body.operating_id == null) {
            throw new Error('operating_id required');
        }

        const case_id = item.case_id;
        const operating_id = req.body.operating_id;

        // const operating_id = "CF280E330E1540E58B5083DA5D75E48F";

        if(req.files == null) {
            throw new Error('No files uploaded');
        }

        const docFilePath = await uploadController.onUploadFile(
            req,
            "/opm/",
            "doc_file"
        );

        if(docFilePath == "error") {
            throw new Error('Error uploading file');
        }

        const filePath = fileDir + docFilePath;

        // console.log('fileDir:', fileDir);
        // console.log('docFilePath:', docFilePath);
        // console.log('Full filePath:', filePath);

        // After upload
        await delay(1000); // Wait for 1 second

        // Check if the file or directory exists synchronously
        if (!fs.existsSync(filePath)) {
            // console.log(`The file or directory at '${filePath}' does not exist.`);
            throw new Error(`The file or directory at '${filePath}' does not exist.`);
        } else {
            // console.log(`The file or directory at '${filePath}' exists.`);
        }

        // Read the file
        const fileContent = await fsPromises.readFile(filePath);
        // console.log(fileContent);

        // // Convert to base64
        const base64Content = fileContent.toString('base64');

        // // Get the filename
        const fileName = path.basename(filePath);

        // console.log(fileName);

        // Get the file type
        const fileType = mime.lookup(filePath) || 'application/octet-stream';
        // console.log(fileType);

        const doc_no = req.body.doc_no || '';
        const doc_date = req.body.doc_date != null ? new Date(req.body.doc_date + ' 00:00:00') : '';

        // console.log(doc_no, doc_date);

        const params = {
            'token_id': tokenId,
            'case_id': case_id, /* string รหัสเรื่องที่ใช้ในการอ้างอิงภายในระบบ */
            'operating_id': operating_id,
            'file_name': fileName,
            'file_content': base64Content, /* string (base64)  */
            'file_description': '',
            'doc_type_id': '8', /* เอกสารประกอบ */
            'doc_type': 'X', /* ประเภทรายการเอกสาร I=หนังสือรับ,O=หนังสือส่งออก,X=ไม่ระบุ */
            'doc_no': doc_no, /* เลขที่หนังสือ (รับ/ส่ง) */
            'doc_date': doc_date, /* วันที่ของหนังสือ ตัวอย่าง 2015-12-31 15:23:59 */
            'doc_ref_no': '', /* เลขที่หนังสืออ้างอิง  (ไม่จำเป็นต้องระบุ) */
            'doc_ref_date': '', /* วันที่ของหนังสืออ้างอิง  (ไม่จำเป็นต้องระบุ) */
            'document_no': '', /* เลขที่เอกสาร (ไม่จำเป็นต้องระบุ) */
            'document_date': '', /* วันที่เอกสาร (ไม่จำเป็นต้องระบุ) */
        };

        // console.log(params);

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const url = opmUrl + "/SOAP/Officer.asmx/OperatingAttachment";
        const response = await axios.post(url, params, config);
        // console.log(response);
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error upload operatingAttachment:', error);
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
                complainant_id: complainant_id,
            }
        });

        // console.log(upsertedCase);

        if(upsertedCase.jcoms_no == null) {
            const JcomsCode = await complaintController.generateJcomsYearCode(complaint_id);
            upsertedCase.jcoms_no = JcomsCode.jcoms_code;
        }

    } catch (error) {
        console.error('Error saving complaint:', error);
        throw error;
    }
};

const getOperatings = async (complaint_id) => {
    try {
        const item = await prisma[$table_complaint].findUnique({
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

        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id,
            'select_org_id': "",
            'skip': 0,
            'take': 10,
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetOperatings";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting operatings:', error);
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

            // res.status(200).json({ token_id: tokenId, msg: "success" });
            res.status(200).json({ token: jsonData, msg: "success" });
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

    async onGetAllCase(req, res) {
        try {
            const jsonData = await getTimelineHeader(req);
            const cases = jsonData;
            // console.log(cases);
            const results = await Promise.all(cases.map(async (caseItem, index) => {

                console.log(`Processing Case ${index + 1}:`);
                try{
                    const caseDetail = await getCase(caseItem.case_id);
                    // console.log(caseDetail);
                    await saveComplaint(caseDetail);

                    return { case_id: caseItem.case_id};
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
    },

    async onSetOrgSummaryResult(req, res) {
        try {
            const jsonData = await setOrgSummaryResult(req.params.id, req);
            const OrgSummaryResult = jsonData;
            res.status(200).json({ "OrgSummaryResult": OrgSummaryResult, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetCase(req, res) {

        if(req.params.id == null) {
            throw new Error('complaint id required');
        }

        // console.log(req.params.id);

        try {

            const item = await prisma[$table_complaint].findUnique({
                where: {
                    id: Number(req.params.id),
                },
            });

            if (!item) {
                throw new Error('Complaint not found');
            }

            if(item.case_id == null) {
                throw new Error('Case not found');
            }

            const case_id = item.case_id;

            const jsonData = await getCase(case_id);
            const caseDetail = jsonData;
            res.status(200).json({ "caseDetail": caseDetail, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetOperatings(req, res) {
        try {
            const jsonData = await getOperatings(req.params.id);
            const operatings = jsonData;
            res.status(200).json({ "operatings": operatings, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetAttachment(req, res) {
        try {
            const jsonData = await getAttachment(req.params.id);
            const attachment = jsonData;
            res.status(200).json({ "attachment": attachment, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onListAttachments(req, res) {

        if(req.params.id == null) {
            throw new Error('complaint id required');
        }

        try {

            const jsonData = await getFirstOperating(req.params.id);
            const caseDetail = jsonData;

            // console.log('Case detail:', caseDetail);

            let attachments = [];
            if (caseDetail.attachments?.length > 0) {
                for (let i = 0; i < caseDetail.attachments.length; i++) {
                    const attachment = caseDetail.attachments[i];
                    // console.log(`Attachment ${i + 1}:`, attachment);

                    try {
                        const attachmentData = await getAttachment(attachment.attachment_id);

                        // Combine the original attachment info with the fetched data
                        const processedAttachment = {
                            // ...attachment,
                            ...attachmentData
                        };

                        attachments.push(processedAttachment);
                    } catch (error) {
                        console.error(`Error processing attachment ${i + 1}:`, error);
                        // You might want to add the original attachment with an error flag
                        attachments.push({ ...attachment, error: true, errorMessage: error.message });
                    }
                }
            }

            // console.log('All processed attachments:', attachments);

            res.status(200).json({ "attachments": attachments, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onOperatingAttachment(req, res) {

        try {
            const jsonData = await operatingAttachment(req.params.id, req);
            const attachment = jsonData;
            res.status(200).json({ "operatingAttachment": attachment, msg: "success" });

        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

};

module.exports = { ...methods };
