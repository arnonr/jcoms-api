const { PrismaClient } = require("@prisma/client");
const uploadController = require("./UploadsController");
const $table = "complaint_follow";

// const prisma = new PrismaClient();
const prisma = new PrismaClient().$extends({
    result: {
        complaint_follow: { //extend Model name
            follow_doc_filename: { // the name of the new computed field
                needs: { follow_doc_filename: true }, /* field */
                compute(complaint_follow) {

                    let follow_doc_filename = null;

                    if (complaint_follow.follow_doc_filename != null) {
                        follow_doc_filename = process.env.PATH_UPLOAD + complaint_follow.follow_doc_filename;
                    }

                    return follow_doc_filename;
                },
            },
            receive_doc_filename: { // the name of the new computed field
                needs: { receive_doc_filename: true }, /* field */
                compute(complaint_follow) {

                    let receive_doc_filename = null;

                    if (complaint_follow.receive_doc_filename != null) {
                        receive_doc_filename = process.env.PATH_UPLOAD + complaint_follow.receive_doc_filename;
                    }

                    return receive_doc_filename;
                }
            }
        },
    },
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    complaint_id: true,
    detail: true,
    follow_doc_no: true,
    follow_doc_date: true,
    follow_doc_filename: true,
    follow_user_id: true,
    follow_at: true,

    receive_doc_no: true,
    receive_doc_date: true,
    receive_doc_filename: true,
    receive_user_id: true,
    receive_at: true,
    receive_comment: true,

    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    follow_user: {
        select: {
            firstname: true,
            lastname: true
        }
    },
    receive_user: {
        select: {
            firstname: true,
            lastname: true
        }
    },
    inspector: {
        select: {
            name_th: true
        }
    }
};

const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.complaint_id) {
        $where["complaint_id"] = parseInt(req.query.complaint_id);
    }

    if (req.query.inspector_id) {
        $where["inspector_id"] = parseInt(req.query.inspector_id);
    }

    if (req.query.detail) {
        $where["detail"] = {
            contains: req.query.detail,
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

    if (req.query.follow_user_id) {
        $where["follow_user_id"] = parseInt(req.query.follow_user_id);
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

    if (req.query.receive_user_id) {
        $where["receive_user_id"] = parseInt(req.query.receive_user_id);
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
                msg: "success",
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
                msg: "success",
            });
        } catch (error) {
            res.status(404).json({ msg: error.message });
        }
    },

    // สร้าง
    async onCreate(req, res) {
        try {

            let followDocPathFile = await uploadController.onUploadFile(req,"/complaint-follow/","follow_doc_filename");
            let receiveDocPathFile = await uploadController.onUploadFile(req,"/complaint-follow/","receive_doc_filename");

            if (followDocPathFile == "error" || receiveDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].create({
                data: {
                    complaint_id: Number(req.body.complaint_id),
                    inspector_id: Number(req.body.inspector_id),
                    detail: req.body.detail,

                    follow_doc_no: req.body.follow_doc_no,
                    follow_doc_date: req.body.follow_doc_date != null ? new Date(req.body.follow_doc_date) : undefined,
                    follow_doc_filename: followDocPathFile,

                    follow_user_id: Number(req.body.follow_user_id),
                    follow_at: req.body.follow_at != null ? new Date(req.body.follow_at) : undefined,

                    receive_doc_no: req.body.receive_doc_no,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    receive_doc_filename: receiveDocPathFile,

                    receive_user_id: Number(req.body.receive_user_id),
                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    receive_comment: req.body.receive_comment,

                    is_active: Number(req.body.is_active),
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

            let followDocPathFile = await uploadController.onUploadFile(req,"/complaint-follow/","follow_doc_filename");
            let receiveDocPathFile = await uploadController.onUploadFile(req,"/complaint-follow/","receive_doc_filename");

            if (followDocPathFile == "error" || receiveDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    complaint_id: req.body.complaint_id != null ? Number(req.body.complaint_id) : undefined,
                    proceed_status_id: req.body.proceed_status_id != null ? Number(req.body.proceed_status_id) : undefined,

                    follow_doc_no: req.body.follow_doc_no != null ? req.body.follow_doc_no : undefined,
                    follow_doc_date: req.body.follow_doc_date != null ? new Date(req.body.follow_doc_date) : undefined,
                    follow_doc_filename: followDocPathFile != null ? followDocPathFile : undefined,
                    follow_user_id: req.body.follow_user_id != null ? Number(req.body.follow_user_id) : undefined,
                    follow_at: req.body.follow_at != null ? new Date(req.body.follow_at) : undefined,

                    from_inspector_id: req.body.from_inspector_id != null ? Number(req.body.from_inspector_id) : undefined,
                    from_bureau_id: req.body.from_bureau_id != null ? Number(req.body.from_bureau_id) : undefined,
                    from_division_id: req.body.from_division_id != null ? Number(req.body.from_division_id) : undefined,
                    from_agency_id: req.body.from_agency_id != null ? Number(req.body.from_agency_id) : undefined,
                    to_inspector_id: req.body.to_inspector_id != null ? Number(req.body.to_inspector_id) : undefined,
                    to_bureau_id: req.body.to_bureau_id != null ? Number(req.body.to_bureau_id) : undefined,
                    to_division_id: req.body.to_division_id != null ? Number(req.body.to_division_id) : undefined,
                    to_agency_id: req.body.to_agency_id != null ? Number(req.body.to_agency_id) : undefined,

                    receive_doc_no: req.body.receive_doc_no != null ? req.body.receive_doc_no : undefined,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    receive_doc_filename: receiveDocPathFile != null ? receiveDocPathFile : undefined,

                    receive_user_id: req.body.receive_user_id != null ? Number(req.body.receive_user_id) : undefined,
                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    receive_comment: req.body.receive_comment != null ? req.body.receive_comment : undefined,

                    state_id: req.body.state_id != null ? Number(req.body.state_id) : undefined,

                    is_active: req.body.is_active != null ? Number(req.body.is_active) : undefined,
                    // updated_by: null,
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
