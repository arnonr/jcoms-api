const { PrismaClient } = require("@prisma/client");
const SmsController = require("./SmsController");
const uploadController = require("./UploadsController");
const { v4: uuidv4 } = require('uuid');
const $table = "complaint";
const $table_file_attach = "complaint_file_attach";

// const prisma = new PrismaClient();

const prisma = new PrismaClient().$extends({
    result: {
        complaint: { //extend Model name
            receive_doc_filename: { // the name of the new computed field
                needs: { receive_doc_filename: true }, /* field */
                compute(model) {

                    let receive_doc_filename = null;

                    if (model.receive_doc_filename != null) {
                        receive_doc_filename = process.env.PATH_UPLOAD + model.receive_doc_filename;
                    }

                    return receive_doc_filename;
                },
            },
        },
    },
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    jcoms_no: true,
    tracking_satisfaction: true,
    tracking_satisfaction_at: true,
    complaint_satisfaction: true,
    complaint_satisfaction_at: true,
    receive_at: true,
    receive_user_id: true,
    complaint_type_id: true,
    complainant_id: true,
    is_anonymous: true,
    complaint_title: true,
    complaint_detail: true,
    incident_datetime: true,
    location_coordinates: true,
    incident_location: true,
    day_time: true,
    complaint_channel_id: true,
    channel_history_text: true,
    inspector_id: true,
    bureau_id: true,
    division_id: true,
    agency_id: true,
    topic_type_id: true,
    house_number: true,
    building: true,
    moo: true,
    soi: true,
    road: true,
    postal_code: true,
    sub_district_id: true,
    district_id: true,
    province_id: true,
    state_id: true,
    notice_type: true,

    /* การรับเรื่อง ฝ่ายรับเรื่องร้องเรียน */
    pol_no: true,
    receive_doc_no: true,
    receive_doc_date: true,
    receive_comment: true,
    receive_doc_filename: true,
    receive_status: true,

    forward_doc_no: true,
    forward_doc_date: true,


    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    complaint_type: {
        select: {
            name_th: true,
        },
    },
    receive_user:{
        select: {
            email: true,
            firstname: true,
            lastname: true,
            officer_code: true,
        }
    },
    complainant: {

    },
    accused: {
        where: {
            deleted_at: null
        }
    },
    channel_history: {
        select: {
            complaint_channel_id: true,
            description: true,
            channel: {
                select: {
                    name_th: true,
                }
            }
        }
    },
    complaint_channel: {
        select: {
            name_th: true,
        },
    },
    inspector: {
        select: {
            name_th: true,
        }
    },
    bureau: {
        select: {
            name_th: true,
        }
    },
    division: {
        select: {
            name_th: true,
        }
    },
    agency: {
        select: {
            name_th: true,
        }
    },
    topic_type: {
        select: {
            name_th: true,
            topic_category: {
                select: {
                    id: true,
                    name_th: true,
                }
            }
        }
    },
    province: {
        select: {
            name_th: true,
        }
    },
    district: {
        select: {
            name_th: true,
        }
    },
    sub_district: {
        select: {
            name_th: true,
        }
    },
    state: {
        select: {
            name_th: true,
        }
    }
};

const filterData = (req) => {
    let $where = {
        deleted_at: null,
        complainant:{},
        accused:{},
        topic_type:{
            topic_category:{}
        }
    };

    if(req.query.topic_category_id){
        $where["topic_type"]["topic_category"]["id"] = parseInt(req.query.topic_category_id);
    }

    if (req.query.accused_fullname) {

        const [firstName, lastName] = req.query.accused_fullname.split(' ');

        $where["accused"] = {
            some: {
                OR: [
                    { firstname: firstName }, { lastname: lastName },
                    { firstname: lastName }, { lastname: firstName },
                ],
            },
        };
    }

    if (req.query.create_year) {
        const year = parseInt(req.query.create_year, 10);
        const startOfYear = new Date(year, 0, 1); // January 1st of the given year
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the given year

        $where["created_at"] = {
            gte: startOfYear,
            lte: endOfYear,
        };
    }

    if (req.query.create_from && req.query.create_to) {

        let date_from = new Date(req.query.create_from + "T00:00:00.000+0000").toISOString();
        let date_to = new Date(req.query.create_to + "T23:59:59.000+0000").toISOString();

        $where["created_at"] = {
            gte: date_from,
            lte: date_to
        }

    } else if (req.query.create_from) {

        let date_from = new Date(req.query.create_from + "T00:00:00.000+0000").toISOString();
        $where["created_at"] = {
            gte: date_from,
        };

    } else if (req.query.create_to) {

        let date_to = new Date(req.query.create_to + "T23:59:59.000+0000").toISOString();
        $where["created_at"] = {
            lte: date_to,
        };
    }

    if (req.query.complainant_fullname) {

        const [firstName, lastName] = req.query.complainant_fullname.split(' ');

        $where["complainant"] = {
                OR: [
                    { firstname: firstName }, { lastname: lastName },
                    { firstname: lastName }, { lastname: firstName },
                ],

        };

    }

    if(req.query.complainant_uuid){
        $where["complainant"] = {
            uuid: req.query.complainant_uuid
        }
    }

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.uuid) {
        $where["uuid"] = {
            contains: req.query.uuid,
        }
    }

    if (req.query.complaint_code) {
        $where["complaint_code"] = {
            contains: req.query.complaint_code,
        }
    }

    if (req.query.tracking_satisfaction) {
        $where["tracking_satisfaction"] = parseInt(req.query.tracking_satisfaction);
    }

    if (req.query.complaint_satisfaction) {
        $where["complaint_satisfaction"] = parseInt(req.query.complaint_satisfaction);
    }

    if (req.query.receive_user_id) {
        $where["receive_user_id"] = parseInt(req.query.receive_user_id);
    }

    if (req.query.complaint_type_id) {
        $where["complaint_type_id"] = parseInt(req.query.complaint_type_id);
    }

    if (req.query.complainant_id) {
        $where["complainant_id"] = parseInt(req.query.complainant_id);
    }

    if (req.query.is_anonymous) {
        $where["is_anonymous"] = parseInt(req.query.is_anonymous);
    }

    if (req.query.complaint_title) {
        $where["complaint_title"] = {
            contains: req.query.complaint_title,
        }
    }

    if (req.query.complaint_detail) {
        $where["complaint_detail"] = {
            contains: req.query.complaint_detail,
        }
    }

    if (req.query.incident_datetime) {
        $where["incident_datetime"] = {
            contains: req.query.incident_datetime,
        }
    }

    if (req.query.location_coordinates) {
        $where["location_coordinates"] = {
            contains: req.query.location_coordinates,
        }
    }

    if (req.query.day_time) {
        $where["day_time"] = parseInt(req.query.day_time);
    }

    if (req.query.incident_location) {
        $where["incident_location"] = {
            contains: req.query.incident_location,
        }
    }

    if (req.query.complaint_channel_id) {
        $where["complaint_channel_id"] = parseInt(req.query.complaint_channel_id);
    }

    if(req.query.channel_history_text) {
        $where["channel_history_text"] = {
            contains: req.query.channel_history_text,
        }
    }

    if (req.query.inspector_id) {
        $where["inspector_id"] = parseInt(req.query.inspector_id);
    }

    if (req.query.bureau_id) {
        $where["bureau_id"] = parseInt(req.query.bureau_id);
    }

    if (req.query.division_id) {
        $where["division_id"] = parseInt(req.query.division_id);
    }

    if (req.query.agency_id) {
        $where["agency_id"] = parseInt(req.query.agency_id);
    }

    if (req.query.topic_type_id) {
        $where["topic_type_id"] = parseInt(req.query.topic_type_id);
    }

    if (req.query.house_number) {
        $where["house_number"] = {
            contains: req.query.house_number,
        }
    }

    if (req.query.building) {
        $where["building"] = {
            contains: req.query.building,
        }
    }

    if (req.query.moo) {
        $where["moo"] = {
            contains: req.query.moo,
        }
    }

    if (req.query.soi) {
        $where["soi"] = {
            contains: req.query.soi,
        }
    }

    if (req.query.road) {
        $where["road"] = {
            contains: req.query.road,
        }
    }

    if (req.query.postal_code) {
        $where["postal_code"] = {
            contains: req.query.postal_code,
        }
    }

    if (req.query.sub_district_id) {
        $where["sub_district_id"] = parseInt(req.query.sub_district_id);
    }

    if (req.query.district_id) {
        $where["district_id"] = parseInt(req.query.district_id);
    }

    if (req.query.province_id) {
        $where["province_id"] = parseInt(req.query.province_id);
    }

    if (req.query.state_id) {
        $where["state_id"] = parseInt(req.query.state_id);
    }

    if (req.query.notice_type) {
        $where["notice_type"] = parseInt(req.query.notice_type);
    }

    if (req.query.jcoms_no) {
        $where["jcoms_no"] = {
            contains: req.query.jcoms_no,
        }
    }

    if (req.query.pol_no) {
        $where["pol_no"] = {
            contains: req.query.pol_no,
        }
    }

    if (req.query.receive_doc_no) {
        $where["receive_doc_no"] = {
            contains: req.query.receive_doc_no,
        }
    }

    if (req.query.receive_doc_date) {
        $where["receive_doc_date"] = {
            contains: req.query.receive_doc_date,
        }
    }

    if (req.query.follow_doc_no) {
        $where["follow_doc_no"] = {
            contains: req.query.follow_doc_no,
        }
    }

    if (req.query.follow_doc_date) {
        $where["follow_doc_date"] = {
            contains: req.query.follow_doc_date,
        }
    }

    if (req.query.receive_status) {
        $where["receive_status"] = parseInt(req.query.receive_status);
    }

    if (req.query.is_active) {
        $where["is_active"] = parseInt(req.query.is_active);
    }

    return $where;
};

// หาจำนวนทั้งหมดและลำดับ
const countDataAndOrder = async (req, $where) => {
    //   Order
    let $orderBy = {};
    if (req.query.orderBy) {
        $orderBy[req.query.orderBy] = req.query.order;
    } else {
        $orderBy = { created_at: "asc" };
    }

  //Count
    let $count = await prisma[$table].count({
        where: $where,
    });

    let $perPage = req.query.perPage ? Number(req.query.perPage) : 10;
    let $currentPage = req.query.currentPage ? Number(req.query.currentPage) : 1;
    let $totalPage = Math.ceil($count / $perPage) == 0 ? 1 : Math.ceil($count / $perPage);
    let $offset = $perPage * ($currentPage - 1);

    return {
        $orderBy: $orderBy,
        $offset: $offset,
        $perPage: $perPage,
        $count: $count,
        $totalPage: $totalPage,
        $currentPage: $currentPage,
    };
};

const excludeSpecificField = (req) => {

    let fields = {...selectField};

    const { exclude } = req.query;

    if (exclude) {
        if(exclude == 'all') {
            // Remove nested select objects
            const keysToRemove = Object.keys(fields).filter(
                (key) => typeof fields[key] === 'object' && fields[key] !== null
            );

            keysToRemove.forEach((key) => {
                delete fields[key];
            });
        }

        const fieldsToExclude = exclude.split(',');
        // Remove fields from selectField
        for (const field of fieldsToExclude) {
            delete fields[field];
        }
    }

    return fields;
};

const deleteComplaintChannelHistory = async (complaint_id) => {
    const complaint_history = await prisma.complaint_channel_history.deleteMany({
        where: {
            complaint_id: Number(complaint_id),
        }
    });
};

const addComplaintChannelHistory = async (complaint_id, complaint_channel_ids, authUsername) => {

    if (complaint_channel_ids) {
        // console.log(channel_ids);
        const complaint_channel_ids_array = complaint_channel_ids.split(',');
        for (let i = 0; i < complaint_channel_ids_array.length; i++) {
            const item = await prisma.complaint_channel_history.create({
                data: {
                    complaint_id: Number(complaint_id),
                    complaint_channel_id: Number(complaint_channel_ids_array[i]),
                    created_by: authUsername,
                    created_at: new Date(),
                }
            });
        }
    }
};

const generateJcomsCode = async (id) => {

    const item = await prisma[$table].findUnique({
        select: {
            jcoms_no: true,
            jcoms_month_running: true
        },
        where: {
            id: Number(id),
        },
    });

    if (item.jcoms_no != null) {
        return null;
    }

    /* Update JCOMS Month Running */
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // Months are zero-based

    const maxRunning = await prisma[$table].aggregate({
        _max: {
            jcoms_month_running: true,
        },
        where: {
            created_at: {
                gte: new Date(currentYear, currentMonth - 1, 1), // Start of the current month
                lt: new Date(currentYear, currentMonth, 1), // Start of the next month
            },
        },
    });

    const newRunningMonth = maxRunning._max.jcoms_month_running + 1;
    const newRunningCode = newRunningMonth.toString().padStart(5, "0");
    const yearCode = (currentYear + 543).toString().substring(2, 4);
    const monthCode = currentMonth.toString().padStart(2, "0");

    const jcoms_code = `jcoms${yearCode}${monthCode}${newRunningCode}`;

    if (item.jcoms_no == null) {
        await prisma[$table].update({
            where: {
                id: Number(id),
            },
            data: {
                jcoms_no: jcoms_code,
                jcoms_month_running: newRunningMonth,
            },
        })
    }

    return {jcoms_code: jcoms_code, jcoms_month_running: newRunningMonth}
};

const generateJcomsYearCode = async (id) => {

    const item = await prisma[$table].findUnique({
        select: {
            jcoms_no: true,
            jcoms_year_running: true
        },
        where: {
            id: Number(id),
        },
    });

    if (item.jcoms_no != null) {
        return null;
    }

    /* Update JCOMS Year Running */

    const currentYear = new Date().getFullYear();

    const maxRunning = await prisma[$table].aggregate({
        _max: {
            jcoms_year_running: true,
        },
        where: {
            created_at: {
                gte: new Date(`${currentYear}-01-01`),
                lt: new Date(`${currentYear + 1}-01-01`),
            },
        },
    });

    const newRunningYear = maxRunning._max.jcoms_year_running + 1;
    const newRunningCode = newRunningYear.toString().padStart(5, "0");
    const yearCode = (currentYear + 543).toString();

    const jcoms_code = `JCOMS${yearCode}${newRunningCode}`;

    if (item.jcoms_no == null) {
        await prisma[$table].update({
            where: {
                id: Number(id),
            },
            data: {
                jcoms_no: jcoms_code,
                jcoms_year_running: newRunningYear,
            },
        })
    }

    return {jcoms_code: jcoms_code, jcoms_year_running: newRunningYear}
};

const getComplainantUUIDbyPhoneNumber = async (phoneNumber) => {
    try {
        const item = await prisma.complainant.findUnique({
            where: {
                phone_number: phoneNumber
            },
            select: {
                uuid: true
            }
        });

        if(item){
            return item.uuid
        }
    } catch (error) {
        return null
    }

}

const methods = {
    async onGetOTPTracking(req, res) {

        if(!req.body.otp_secret) {
            return res.status(400).json({ msg: "otp_secret is required" });
        }

        if(!req.body.jcoms_no && !req.body.phone_number && !req.body.id_card) {
            return res.status(400).json({ msg: "jcoms_no or phone_number or id_card is required" });
        }

        const otpSecret = req.body.otp_secret;

        let $where = {
            complainant: {}
        };

        if (req.body.jcoms_no) {
            $where["jcoms_no"] = req.body.jcoms_no;
        }

        if (req.body.phone_number) {
            $where["complainant"]["phone_number"] = req.body.phone_number;
        }

        if (req.body.id_card) {
            $where["complainant"]["id_card"] = req.body.id_card;
        }

        try {
            const item = await prisma[$table].findFirstOrThrow({
                select: {
                    complainant: {
                        select: {
                            phone_number: true,
                        }
                    }
                },
                where: $where,
            });

            const phoneNumber = item.complainant.phone_number;

            const otp = await SmsController.genarateOTP(phoneNumber, otpSecret);

            if(otp == "error") {
                return res.status(500).json({ msg: "error" });
            }

            res.status(200).json({
                data: otp,
                msg: "success",
            })
        } catch (error) {

            if(error.code == "P2025") {
                return res.status(404).json({ msg: "data not found" });
            }

            res.status(500).json({ msg: error.message });
        }
    },

    async onVertifyOTPTracking(req, res) {

        const otp = req.body.otp;
        const otp_secret = req.body.otp_secret;
        const phone_number = req.body.phone_number;

        if (otp == undefined) {
            return res.status(400).json({ msg: "otp is undefined" });
        }

        if (otp_secret == undefined) {
            return res.status(400).json({ msg: "otp_secret is undefined" });
        }

        try {

            const otp_item = await SmsController.verifyOTP(otp_secret, otp, phone_number);
            if(otp_item == false) {
                return res.status(400).json({ msg: "OTP is invalid" });
            }

            const complainantUUID = await getComplainantUUIDbyPhoneNumber(otp_item.phone_number);

            return res.status(200).json({ data: {complainant_uuid: complainantUUID, otp_secret: otp_secret}, msg: "success" });
        } catch (error) {
            return res.status(400).json({ msg: error.message });
        }
    },

    async onGetAll(req, res) {
        try {
            let $where = filterData(req);
            let other = await countDataAndOrder(req, $where);
            let select = excludeSpecificField(req, selectField);

            const item = await prisma[$table].findMany({
                select: select,
                where: $where,
                orderBy: other.$orderBy,
                skip: other.$offset,
                take: other.$perPage,
            });

            res.status(200).json({
                totalData: other.$count,
                totalPage: other.$totalPage,
                currentPage: other.$currentPage,
                msg: "success",
                data: item,
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetCount(req, res) {
        try {
            let $where = filterData(req);

            const totalCount  = await prisma[$table].count({
                where: $where,
            });

            res.status(200).json({
                msg: "success",
                totalCount: totalCount,
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetAllByOTP(req, res) {

        if(!req.query.complainant_uuid) {
            return res.status(400).json({ msg: "complainant_uuid is required" });
        }

        let $where = {
            deleted_at: null,
            complainant:{}
        };

        if(req.query.complainant_uuid){
            $where["complainant"] = {
                uuid: req.query.complainant_uuid
            }
        }

        try {
            let other = await countDataAndOrder(req, $where);

            const item = await prisma[$table].findMany({
                select: selectField,
                where: $where,
                orderBy: other.$orderBy,
                skip: other.$offset,
                take: other.$perPage,
            });

            res.status(200).json({
                data: item,
                totalData: other.$count,
                totalPage: other.$totalPage,
                currentPage: other.$currentPage,
                msg: "success",
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetById(req, res) {

        let select = excludeSpecificField(req, selectField);

        try {
            const item = await prisma[$table].findUnique({
                select: select,
                where: {
                    id: Number(req.params.id),
                },
            });

            res.status(200).json({
                data: item,
                msg: "success",
            });
        } catch (error) {
            res.status(404).json({ msg: error.message });
        }
    },

    // สร้าง
    async onCreate(req, res) {

        let authUsername = null;
        if(req.headers.authorization !== undefined){
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            authUsername = decoded.username;
        }

        let receiveDocPathFile = await uploadController.onUploadFile(req, "/complaint/", "receive_doc_filename");

        if (receiveDocPathFile == "error") {
            return res.status(500).send("error");
        }

        try {
            const item = await prisma[$table].create({
                data: {
                    is_active: Number(req.body.is_active),
                    uuid: uuidv4(),
                    receive_doc_filename: receiveDocPathFile,
                    complaint_code: req.body.complaint_code,
                    tracking_satisfaction: Number(req.body.tracking_satisfaction),
                    tracking_satisfaction_at: req.body.tracking_satisfaction_at != null ? new Date(req.body.tracking_satisfaction_at) : undefined,
                    complaint_satisfaction: Number(req.body.complaint_satisfaction),
                    complaint_satisfaction_at: req.body.complaint_satisfaction_at != null ? new Date(req.body.complaint_satisfaction_at) : undefined,

                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    receive_user_id: req.body.receive_user_id != null ? Number(req.body.receive_user_id) : undefined,
                    receive_comment: req.body.receive_comment,
                    pol_no: req.body.pol_no,
                    receive_doc_no: req.body.receive_doc_no,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    receive_status: Number(req.body.receive_status),

                    complaint_type_id: req.body.complaint_type_id != null ? Number(req.body.complaint_type_id) : undefined,
                    complainant_id: req.body.complainant_id != null ? Number(req.body.complainant_id) : undefined,
                    is_anonymous: Number(req.body.is_anonymous),

                    complaint_title: req.body.complaint_title,
                    complaint_detail: req.body.complaint_detail,
                    incident_datetime: req.body.incident_datetime != null ? new Date(req.body.incident_datetime) : undefined,
                    location_coordinates: req.body.location_coordinates,
                    incident_location: req.body.incident_location,
                    day_time: parseInt(req.body.day_time),

                    complaint_channel_id: req.body.complaint_channel_id != null ? Number(req.body.complaint_channel_id) : undefined,

                    channel_history_text: req.body.channel_history_text,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    agency_id: req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
                    topic_type_id: req.body.topic_type_id != null ? Number(req.body.topic_type_id) : undefined,
                    house_number: req.body.house_number,
                    building: req.body.building,
                    moo: req.body.moo,
                    soi: req.body.soi,
                    road: req.body.road,
                    postal_code: req.body.postal_code,
                    sub_district_id: req.body.sub_district_id != null ? Number(req.body.sub_district_id) : undefined,
                    district_id: req.body.district_id != null ? Number(req.body.district_id) : undefined,
                    province_id: req.body.province_id != null ? Number(req.body.province_id) : undefined,
                    state_id: req.body.state_id != null ? Number(req.body.state_id) : undefined,
                    notice_type: parseInt(req.body.notice_type),

                    forward_doc_no: req.body.forward_doc_no,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,

                    created_by: authUsername,
                    updated_by: authUsername,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await addComplaintChannelHistory(item.id, req.body.complaint_channel_ids);
            // const JcomsCode = await generateJcomsCode(item.id);
            const JcomsCode = await generateJcomsYearCode(item.id);
            item.jcoms_no = JcomsCode.jcoms_code;

            /* Update File Attach */
            if(req.body.secret_key != null) {
                await prisma[$table_file_attach].updateMany({
                    where: {
                        secret_key: req.body.secret_key,
                    },
                    data: {
                        complaint_id: item.id,
                    },
                });
            }

            res.status(201).json({ ...item, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

    // แก้ไข
    async onUpdate(req, res) {

        let authUsername = null;
        if (req.headers.authorization !== undefined) {
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            authUsername = decoded.username;
        }

        let receiveDocPathFile = await uploadController.onUploadFile(req, "/complaint/", "receive_doc_filename");

        if (receiveDocPathFile == "error") {
            return res.status(500).send("error");
        }

        try {

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    is_active: req.body.is_active != null ? Number(req.body.is_active) : undefined,
                    complaint_code: req.body.complaint_code != null ? req.body.complaint_code : undefined,
                    tracking_satisfaction: req.body.tracking_satisfaction != null ? Number(req.body.tracking_satisfaction) : undefined,
                    tracking_satisfaction_at: req.body.tracking_satisfaction_at != null ? new Date(req.body.tracking_satisfaction_at) : undefined,
                    complaint_satisfaction: req.body.complaint_satisfaction != null ? Number(req.body.complaint_satisfaction) : undefined,
                    complaint_satisfaction_at: req.body.complaint_satisfaction_at != null ? new Date(req.body.complaint_satisfaction_at) : undefined,

                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    receive_user_id: req.body.receive_user_id != null ? Number(req.body.receive_user_id) : undefined,
                    pol_no: req.body.pol_no != null ? req.body.pol_no : undefined,
                    receive_doc_no: req.body.receive_doc_no != null ? req.body.receive_doc_no : undefined,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    receive_status: req.body.receive_status != null ? Number(req.body.receive_status) : undefined,
                    receive_comment: req.body.receive_comment != null ? req.body.receive_comment : undefined,
                    receive_doc_filename: receiveDocPathFile != null ? receiveDocPathFile : undefined,

                    complaint_type_id: req.body.complaint_type_id != null ? Number(req.body.complaint_type_id) : undefined,
                    complainant_id: req.body.complainant_id != null ? Number(req.body.complainant_id) : undefined,
                    is_anonymous: req.body.is_anonymous != null ? Number(req.body.is_anonymous) : undefined,
                    complaint_title: req.body.complaint_title != null ? req.body.complaint_title : undefined,
                    complaint_detail: req.body.complaint_detail != null ? req.body.complaint_detail : undefined,
                    incident_datetime: req.body.incident_datetime != null ? new Date(req.body.incident_datetime) : undefined,
                    location_coordinates: req.body.location_coordinates != null ? req.body.location_coordinates : undefined,
                    incident_location: req.body.incident_location != null ? req.body.incident_location : undefined,
                    day_time: req.body.day_time != null ? Number(req.body.day_time) : undefined,

                    complaint_channel_id: req.body.complaint_channel_id != null ? Number(req.body.complaint_channel_id) : undefined,
                    channel_history_text: req.body.channel_history_text != null ? req.body.channel_history_text : undefined,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    agency_id: req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
                    topic_type_id: req.body.topic_type_id != null ? Number(req.body.topic_type_id) : undefined,
                    house_number: req.body.house_number != null ? req.body.house_number : undefined,
                    building: req.body.building != null ? req.body.building : undefined,
                    moo: req.body.moo != null ? req.body.moo : undefined,
                    soi: req.body.soi != null ? req.body.soi : undefined,
                    road: req.body.road != null ? req.body.road : undefined,
                    postal_code: req.body.postal_code != null ? req.body.postal_code : undefined,
                    sub_district_id: req.body.sub_district_id != null ? Number(req.body.sub_district_id) : undefined,
                    district_id: req.body.district_id != null ? Number(req.body.district_id) : undefined,
                    province_id: req.body.province_id != null ? Number(req.body.province_id) : undefined,
                    state_id: req.body.state_id != null ? Number(req.body.state_id) : undefined,
                    notice_type: req.body.notice_type != null ? req.body.notice_type : undefined,

                    forward_doc_no: req.body.forward_doc_no != null ? req.body.forward_doc_no : undefined,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,

                    updated_by: authUsername,
                    updated_at: new Date(),
                },
            });

            await deleteComplaintChannelHistory(req.params.id);
            await addComplaintChannelHistory(req.params.id, req.body.complaint_channel_ids);

            if(item.jcoms_no == null) {
                // const JcomsCode = await generateJcomsCode(req.params.id);
                const JcomsCode = await generateJcomsYearCode(req.params.id);
                // console.log(JcomsCode);
                if(JcomsCode != null) {
                    item.jcoms_no = JcomsCode.jcoms_no;
                }
            }

            /* Update File Attach */
            if (req.body.secret_key != null) {
                await prisma[$table_file_attach].updateMany({
                    where: {
                        secret_key: req.body.secret_key,
                    },
                    data: {
                        complaint_id: item.id,
                    },
                });
            }

            res.status(200).json({ ...item, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },
    // ลบ
    async onDelete(req, res) {
        try {

            await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    deleted_at: new Date().toISOString(),
                },
            });

            res.status(200).json({
                msg: "success",
            });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },
};

module.exports = { ...methods };
