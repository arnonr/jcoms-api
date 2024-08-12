const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;
const prisma2 = prisma_config
const path = require('path');
const $table_complaint = "complaint";
const $table_complainant = "complainant";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');

const complaintController = require("./ComplaintController");
const provinceController = require("./ProvinceController");
const districtController = require("./DistrictController");
const subDistrictController = require("./SubDistrictController");
const prefixNameController = require("./PrefixNameController");
const helperController = require("./HelperController");
const uploadController = require("./UploadsController");
const { Console } = require('console');

const apiHost = "http://damrongdham-api-uat.moi.go.th";
const apiSecretKey = "iSOfG6mYMr";
const agentId = "A01";

const getToken = async () => {
    try {
        // const user = process.env.USER || $user;
        // const password = process.env.PASSWORD || $password;

        const headers = {
            "Content-Type": "application/json",
            "secret-key": apiSecretKey
        };

        const url = apiHost + "/agency/v1/auth/token/" + agentId;
        const response = await axios.get(url, { headers});

        if(response.data.data.accessToken != null) {
            return response.data.data.accessToken;
        }
        return null;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

const getData = async () => {
    try {
        const accessToken = await getToken();

        if(accessToken == null) {
            throw new Error('Token not found');
        }

        const headers = {
            "Content-Type": "application/json",
            "Token": accessToken
        };

        const params = {
            // "page": 1,
            "showAll": true
        };

        const url = apiHost + "/agency/v1/case/get-data-list";
        const response = await axios.get(url, { headers, params });

        if(response.data.data != null) {
            return response.data.data;
        }

        return null;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

const updateStatus = async (complaint_id) => {
    try {
        const item = await prisma[$table_complaint].findUnique({
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.moi_id == null) {
            throw new Error('MOI id not found');
        }

        const accessToken = await getToken();
        if(accessToken == null) {
            throw new Error('Token not found');
        }

        const headers = {
            "Content-Type": "application/json",
            "Token": accessToken
        };

        const params = {
            "complaintKey": item.moi_id,
            "code": 3, /* รับเรื่อง */
            "refId": "100",
            "refCode": item.jcoms_no, /* เลขที่หนังสือ ฝรท. หรือเลข JComs */
            "refDescription": "รับเรื่องแล้วกำลังดำเนินการ"
        }

        const url = apiHost + "/agency/v1/case/status";
        let response = await axios.put(url, params, { headers });
        response.data.moi_id = item.moi_id;
        return response.data;
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

const getFile = async (complaint_id) => {
    try{
        const item = await prisma[$table_complaint].findUnique({
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.moi_id == null) {
            throw new Error('MOI id not found');
        }

        const accessToken = await getToken();
        if(accessToken == null) {
            throw new Error('Token not found');
        }

        const headers = {
            "Content-Type": "application/json",
            "Token": accessToken
        };

        const url = apiHost + "/agency/v1/case/files/" + item.moi_id;
        let response = await axios.get(url, { headers });

        if(response.data != null) {
            return response.data;
        }
        return null;

    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};


const getMultipleIds = async (data) => {
    const complainant_prefix_name = data.complaintBy.prefix;
    const province = data.complaintIncident.province;
    let district = data.complaintIncident.district;
    district = district.startsWith("เขต") ? district.slice(3) : district;
    const sub_district = data.complaintIncident.subDistrict;
    const postal_code = data.complaintIncident.zipCode;

    const [
        provinceResult,
        districtResult,
        subDistrictResult,
        complainantPrefixNameResult,
    ] = await Promise.all([
        prisma2.province.findFirst({ where: { name_th: province }, select: { id: true } }),
        prisma2.district.findFirst({ where: { name_th: district}, select: { id: true } }),
        prisma2.sub_district.findFirst({ where: { name_th: sub_district}, select: { id: true } }),
        prisma2.prefix_name.findFirst({ where: {name_th: complainant_prefix_name }, select: { id: true } }),
    ]);

    return {
        province_id:  provinceResult ? provinceResult?.id: null,
        sub_district_id: subDistrictResult ? subDistrictResult?.id: null,
        district_id: districtResult ? districtResult?.id: null,
        postal_code: postal_code,
        complainant_province_id: provinceResult ? provinceResult?.id: null,
        complainant_district_id: districtResult ? districtResult?.id: null,
        complainant_sub_district_id: subDistrictResult ? subDistrictResult?.id: null,
        complainant_prefix_name_id: complainantPrefixNameResult ? complainantPrefixNameResult?.id : null,
    }
};

const saveComplaint = async (caseItem) => {

    try {

        const coordinates = (caseItem.complaintIncident.latitude && caseItem.complaintIncident.longitude) ? caseItem.complaintIncident.longitude + "," + caseItem.complaintIncident.latitude: null;
        // const province = caseItem.complaintIncident.province;
        // const district = caseItem.complaintIncident.district;
        // const subDistrict = caseItem.complaintIncident.subDistrict;

        const ids = await getMultipleIds(caseItem);
        // console.log(ids);

        let complainant_id = null;
        let complaint_id = null;
        let item_complaint = null;
        let item_complainant = null;
        const complainant_phone_number = caseItem.complaintBy.phone;
        const moi_id = caseItem.complaintKey.keyId;

        const complainant = {
            card_type: 1, /* ประเภทบัตร 1=บัตรประชาชน, 2=หนังสือเดินทาง */
            id_card:  caseItem.complaintBy.idCard != null ? helperController.base64EncodeWithKey(caseItem.complaintBy.idCard) : undefined,
            prefix_name_id: ids.complainant_prefix_name_id,
            phone_number: complainant_phone_number,
            firstname: caseItem.complaintBy.firstName,
            lastname: caseItem.complaintBy.lastName,
            birthday: caseItem.complaintBy.birthday != null ? new Date(caseItem.complaintBy.birthday) : undefined,
            email: caseItem.complaintBy.email,
            postal_code: ids.postal_code != null ? ids.postal_code : undefined,
            sub_district_id: ids.complainant_sub_district_id != null ? ids.complainant_sub_district_id : undefined,
            district_id: ids.complainant_district_id != null ? ids.complainant_district_id : undefined,
            province_id: ids.complainant_province_id != null ? ids.complainant_province_id : undefined,
        }

        const complaint = {
            moi_id: caseItem.complaintKey.keyId,
            complaint_channel_id: 11, /* ศูนย์ดำรงธรรม */
            complainant_id: null, /* ผู้ร้องเรียน */
            is_anonymous: 1,
            complaint_type_id: 2, /* ร้องทุกข์ขอความช่วยเหลือ/แจ้งเบาะแส */
            complaint_title: caseItem.complaintBody.name,
            complaint_detail: caseItem.complaintBody.description,
            incident_datetime: new Date(caseItem.complaintIncident.incidentDate),
            location_coordinates: coordinates,
            incident_location: caseItem.complaintIncident.desription,
            house_number: caseItem.complaintIncident.address,
            province_id: ids.province_id,
            district_id: ids.district_id,
            sub_district_id: ids.sub_district_id,
            postal_code: ids.postal_code,
            topic_type_id: 44, /* ไม่ระบุ */
        }

        if(complainant_phone_number != null && complainant_phone_number != "") {
            item_complainant = await prisma[$table_complainant].findUnique({
                where: {
                    phone_number: complainant_phone_number
                },
            });

            if(item_complainant != null) {
                complainant_id = item_complainant.id;
            }else{
                item_complainant = await prisma[$table_complainant].create({
                    data: complainant
                });
                complainant_id = item_complainant.id;
            }
        }

        if(complainant_id != null) {
            item_complaint = await prisma[$table_complaint].upsert({
                where: {
                    moi_id: moi_id
                },
                create: {
                    ...complaint,
                    uuid: uuidv4(),
                    complainant_id: complainant_id,
                    state_id: 1, /* เรื่องรอการตรวจสอบ */
                },
                update: {
                    ...complaint,
                }
            });

            complaint_id = item_complaint.id;
        }

        //console.log(item_complaint);

        // Check if the operation was an insert or update
        const complaint_upsert_status = item_complaint.created_at === item_complaint.updated_at ? 'inserted' : 'updated';

        if(item_complaint.jcoms_no == null) {
            const JcomsCode = await complaintController.generateJcomsYearCode(complaint_id);
            item_complaint.jcoms_no = JcomsCode.jcoms_code;
        }

        if(complaint_id != null && caseItem.complaintPerson && complaint_upsert_status == 'inserted') {

            for (let i = 0; i < caseItem.complaintPerson.length; i++) {
                let accused_prefix_name_id = null;

                if(caseItem.complaintPerson[i].prefix != null){
                    accused_prefix_name_id = await  prisma2.prefix_name.findFirst({ where: {name_th: caseItem.complaintPerson[i].prefix }, select: { id: true } });
                }

                let accused = {
                    prefix_name_id: accused_prefix_name_id?.id ?? undefined,
                    firstname: caseItem.complaintPerson[i].firstName != undefined && caseItem.complaintPerson[i].firstName != null ? caseItem.complaintPerson[i].firstName : undefined,
                    lastname: caseItem.complaintPerson[i].lastName != undefined && caseItem.complaintPerson[i].lastName != null ? caseItem.complaintPerson[i].lastName : undefined,
                };

                item_accused = await prisma[$table_accused].create({
                    data: {
                        ...accused,
                        complaint_id: complaint_id
                    }
                });

            }
        }

    } catch (error) {
        console.error(error);
    }
}

const methods = {

    // Route handler
    async onGetToken(req, res) {
        try {
            const accessToken = await getToken();

            if(accessToken == null) {
                res.status(500).json({ msg: "Token not found" });
            }
            res.status(200).json({ accessToken, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetData(req, res) {
        try {
            const data = await getData();
            res.status(200).json({ data: data, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onSyncData(req, res) {

        try {
            const data = await getData();
            const results = await Promise.all(data.map(async (caseItem, index) => {

                console.log(`Processing Case ${index + 1}:`);
                // console.log(caseItem);
                const moi_id = caseItem.complaintKey.keyId;

                try{

                    // console.log(moi_id)
                    // const caseDetail = await getCase(caseItem.case_id);
                    await saveComplaint(caseItem);

                    return { moi_id: moi_id};
                } catch (error) {
                    console.error(`Error processing case ${moi_id}:`, error);
                    // return { caseId: caseItem.case_id, error: error.message };
                }

            }));

            res.status(200).json({ "results": results, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onUpdateStatus(req, res) {

        try {
            if(req.params.id === undefined) {
                throw new Error('complaint id required');
            }

            const data = await updateStatus(req.params.id);
            res.status(200).json({ data: data, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetFile(req, res) {
        try {
            const data = await getFile(req.params.id);
            res.status(200).json({ data: data, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    }

};

module.exports = methods