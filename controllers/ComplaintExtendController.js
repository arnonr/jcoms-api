const { PrismaClient } = require("@prisma/client");
const uploadController = require("./UploadsController");
const $table = "complaint_extend";

// const prisma = new PrismaClient();
const prisma = new PrismaClient().$extends({
    result: {
        complaint_extend: { //extend Model name
            extend_doc_filename: { // the name of the new computed field
                needs: { extend_doc_filename: true }, /* field */
                compute(complaint_extend) {

                    let extend_doc_filename = null;

                    if (complaint_extend.extend_doc_filename != null) {
                        extend_doc_filename = process.env.PATH_UPLOAD + complaint_extend.extend_doc_filename;
                    }

                    return extend_doc_filename;
                },

            },
            approved_doc_filename: { // the name of the new computed field
                needs: { approved_doc_filename: true }, /* field */
                compute(complaint_extend) { /* field */

                    let approved_doc_filename = null;

                    if (complaint_extend.approved_doc_filename != null) {
                        approved_doc_filename = process.env.PATH_UPLOAD + complaint_extend.approved_doc_filename;
                    }

                    return approved_doc_filename;

                },

            }

        }
    }
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    complaint_id: true,
    extend_comment: true,
    extend_user_id: true,
    bureau_id: true,
    extend_doc_no: true,
    extend_doc_date: true,
    extend_doc_filename: true,

    approved_at: true,
    approved_user_id: true,
    approved_comment: true,
    inspector_id: true,
    approved_doc_no: true,
    approved_doc_date: true,
    approved_doc_filename: true,
    status: true,
    time_no: true,
    extend_day: true,
    due_date: true,

    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    extend_user: {
        select: {
            firstname: true,
            lastname: true
        }
    },
    approved_user: {
        select: {
            firstname: true,
            lastname: true
        }
    },
    approved_inspector: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    extend_bureau: {
        select: {
            name_th: true,
            name_th_abbr: true
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

    if (req.query.extend_comment) {
        $where["extend_comment"] = {
            contains: req.query.extend_comment,
        };
    }

    if (req.query.extend_doc_no) {
        $where["extend_doc_no"] = {
            contains: req.query.extend_doc_no,
        };
    }

    if (req.query.extend_doc_date) {
        $where["extend_doc_date"] = {
            contains: req.query.extend_doc_date,
        };
    }

    if(req.query.approved_doc_no){
        $where["approved_doc_no"] = {
            contains: req.query.approved_doc_no,
        };
    }

    if(req.query.approved_doc_date){
        $where["approved_doc_date"] = {
            contains: req.query.approved_doc_date,
        };
    }

    if (req.query.status) {
        $where["status"] = parseInt(req.query.status);
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

            let extendDocPathFile = await uploadController.onUploadFile(req,"/complaint-extend/","extend_doc_filename");
            let approvedDocPathFile = await uploadController.onUploadFile(req,"/complaint-extend/","approved_doc_filename");

            if (extendDocPathFile == "error" || approvedDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].create({
                data: {
                    complaint_id: Number(req.body.complaint_id),
                    extend_comment: req.body.extend_comment,
                    extend_user_id: Number(req.body.extend_user_id),
                    bureau_id: Number(req.body.bureau_id),
                    extend_doc_no: req.body.extend_doc_no,
                    extend_doc_date: req.body.extend_doc_date != null ? new Date(req.body.extend_doc_date) : undefined,
                    extend_doc_filename: extendDocPathFile,

                    approved_at: req.body.approved_at != null ? new Date(req.body.approved_at) : undefined,
                    approved_user_id: Number(req.body.approved_user_id),
                    approved_comment: req.body.approved_comment,
                    inspector_id: Number(req.body.inspector_id),
                    approved_doc_no: req.body.approved_doc_no,
                    approved_doc_date: req.body.approved_doc_date != null ? new Date(req.body.approved_doc_date) : undefined,
                    approved_doc_filename: approvedDocPathFile,

                    status: Number(req.body.status),
                    time_no: req.body.time_no != null ? Number(req.body.time_no) : undefined,
                    extend_day: req.body.extend_day != null ? Number(req.body.extend_day) : undefined,
                    due_date: req.body.due_date != null ? new Date(req.body.due_date) : undefined,

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

            let extendDocPathFile = await uploadController.onUploadFile(req,"/complaint-extend/","extend_doc_filename");
            let approvedDocPathFile = await uploadController.onUploadFile(req,"/complaint-extend/","approved_doc_filename");

            if (extendDocPathFile == "error" || approvedDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    extend_comment: req.body.extend_comment,
                    extend_user_id: Number(req.body.extend_user_id),
                    bureau_id: Number(req.body.bureau_id),
                    extend_doc_no: req.body.extend_doc_no,
                    extend_doc_date: req.body.extend_doc_date != null ? new Date(req.body.extend_doc_date) : undefined,
                    extend_doc_filename: extendDocPathFile,

                    approved_at: req.body.approved_at != null ? new Date(req.body.approved_at) : undefined,
                    approved_user_id: Number(req.body.approved_user_id),
                    approved_comment: req.body.approved_comment,
                    inspector_id: Number(req.body.inspector_id),
                    approved_doc_no: req.body.approved_doc_no,
                    approved_doc_date: req.body.approved_doc_date != null ? new Date(req.body.approved_doc_date) : undefined,
                    approved_doc_filename: approvedDocPathFile,

                    status: req.body.status != null ? Number(req.body.status) : undefined,
                    time_no: req.body.time_no != null ? Number(req.body.time_no) : undefined,
                    extend_day: req.body.extend_day != null ? Number(req.body.extend_day) : undefined,
                    due_date: req.body.due_date != null ? new Date(req.body.due_date) : undefined,

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
