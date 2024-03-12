const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const $table = "complaint";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    complaint_code: true,
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
    incident_date: true,
    location_coordinates: true,
    incident_location: true,
    incident_time: true,
    day_time: true,
    file_attach_1: true,
    file_attach_2: true,
    file_attach_3: true,
    file_attach_4: true,
    file_attach_5: true,
    complaint_channel_id: true,
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
    jcoms_no: true,
    pol_no: true,
    receive_doc_no: true,
    receive_doc_date: true,
    forward_doc_no: true,
    forward_doc_date: true,
    receive_status: true,

    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
};

const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

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

    if (req.query.incident_date) {
        $where["incident_date"] = {
            contains: req.query.incident_date,
        }
    }

    if (req.query.incident_time) {
        $where["incident_time"] = {
            contains: req.query.incident_time,
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

const methods = {
    async onGetAll(req, res) {
        try {
            let $where = filterData(req);
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
                msg: " success",
            });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetById(req, res) {
        try {
            const item = await prisma[$table].findUnique({
                select: selectField,
                where: {
                    id: Number(req.params.id),
                },
            });

            res.status(200).json({
                data: item,
                msg: " success",
            });
        } catch (error) {
            res.status(404).json({ msg: error.message });
        }
    },

    // สร้าง
    async onCreate(req, res) {
        try {
            const item = await prisma[$table].create({
                data: {
                    is_active: Number(req.body.is_active),
                    uuid: uuidv4(),
                    complaint_code: req.body.complaint_code,
                    tracking_satisfaction: Number(req.body.tracking_satisfaction),
                    tracking_satisfaction_at: req.body.tracking_satisfaction_at != null ? new Date(req.body.tracking_satisfaction_at) : undefined,
                    complaint_satisfaction: Number(req.body.complaint_satisfaction),
                    complaint_satisfaction_at: req.body.complaint_satisfaction_at != null ? new Date(req.body.complaint_satisfaction_at) : undefined,
                    received_at: req.body.received_at != null ? new Date(req.body.received_at) : undefined,
                    receive_user_id: Number(req.body.receive_user_id),
                    complaint_type_id: Number(req.body.complaint_type_id),
                    complainant_id: Number(req.body.complainant_id),
                    is_anonymous: Number(req.body.is_anonymous),
                    complaint_title: req.body.complaint_title,
                    complaint_detail: req.body.complaint_detail,
                    incident_date: req.body.incident_date != null ? new Date(req.body.incident_date) : undefined,
                    incident_time: req.body.incident_time != null ? new Date(req.body.incident_time) : undefined,
                    location_coordinates: req.body.location_coordinates,
                    incident_location: req.body.incident_location,
                    day_time: parseInt(req.body.day_time),
                    file_attach_1: req.body.file_attach_1,
                    file_attach_2: req.body.file_attach_2,
                    file_attach_3: req.body.file_attach_3,
                    file_attach_4: req.body.file_attach_4,
                    file_attach_5: req.body.file_attach_5,
                    complaint_channel_id: Number(req.body.complaint_channel_id),
                    inspector_id: Number(req.body.inspector_id),
                    bureau_id: Number(req.body.bureau_id),
                    division_id: Number(req.body.division_id),
                    topic_type_id: Number(req.body.topic_type_id),
                    house_number: req.body.house_number,
                    building: req.body.building,
                    moo: req.body.moo,
                    soi: req.body.soi,
                    road: req.body.road,
                    postal_code: req.body.postal_code,
                    sub_district_id: Number(req.body.sub_district_id),
                    district_id: Number(req.body.district_id),
                    province_id: Number(req.body.province_id),
                    state_id: Number(req.body.state_id),
                    notice_type: parseInt(req.body.notice_type),
                    jcoms_no: req.body.jcoms_no,
                    pol_no: req.body.pol_no,
                    receive_doc_no: req.body.receive_doc_no,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    forward_doc_no: req.body.forward_doc_no,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,
                    receive_status: Number(req.body.receive_status),
                    // created_by: null,
                    // updated_by: null,
                },
            });

            res.status(201).json({ ...item, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

    // แก้ไข
    async onUpdate(req, res) {
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
                    received_at: req.body.received_at != null ? new Date(req.body.received_at) : undefined,
                    receive_user_id: req.body.receive_user_id != null ? Number(req.body.receive_user_id) : undefined,
                    complaint_type_id: req.body.complaint_type_id != null ? Number(req.body.complaint_type_id) : undefined,
                    complainant_id: req.body.complainant_id != null ? Number(req.body.complainant_id) : undefined,
                    is_anonymous: req.body.is_anonymous != null ? Number(req.body.is_anonymous) : undefined,
                    complaint_title: req.body.complaint_title != null ? req.body.complaint_title : undefined,
                    complaint_detail: req.body.complaint_detail != null ? req.body.complaint_detail : undefined,
                    incident_date: req.body.incident_date != null ? new Date(req.body.incident_date) : undefined,
                    incident_time: req.body.incident_time != null ? new Date(req.body.incident_time) : undefined,
                    location_coordinates: req.body.location_coordinates != null ? req.body.location_coordinates : undefined,
                    incident_location: req.body.incident_location != null ? req.body.incident_location : undefined,
                    day_time: req.body.day_time != null ? Number(req.body.day_time) : undefined,
                    file_attach_1: req.body.file_attach_1 != null ? req.body.file_attach_1 : undefined,
                    file_attach_2: req.body.file_attach_2 != null ? req.body.file_attach_2 : undefined,
                    file_attach_3: req.body.file_attach_3 != null ? req.body.file_attach_3 : undefined,
                    file_attach_4: req.body.file_attach_4 != null ? req.body.file_attach_4 : undefined,
                    file_attach_5: req.body.file_attach_5 != null ? req.body.file_attach_5 : undefined,
                    complaint_channel_id: req.body.complaint_channel_id != null ? Number(req.body.complaint_channel_id) : undefined,
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
                    jcoms_no: req.body.jcoms_no != null ? req.body.jcoms_no : undefined,
                    pol_no: req.body.pol_no != null ? req.body.pol_no : undefined,
                    receive_doc_no: req.body.receive_doc_no != null ? req.body.receive_doc_no : undefined,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    forward_doc_no: req.body.forward_doc_no != null ? req.body.forward_doc_no : undefined,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,
                    receive_status: req.body.receive_status != null ? req.body.receive_status : undefined,
                },
            });

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
