const prisma_config = require('../config/prismaClient');
const uploadController = require("./UploadsController");

const $table = "complaint_report";

// const prisma = new PrismaClient();
const prisma = prisma_config.$extends({
    result: {
        complaint_report: { //extend Model name
            report_doc_filename: { // the name of the new computed field
                needs: { report_doc_filename: true }, /* field */
                compute(complaint_report) {

                    let report_doc_filename = null;

                    if (complaint_report.report_doc_filename != null) {
                        report_doc_filename = process.env.PATH_UPLOAD + complaint_report.report_doc_filename;
                    }

                    return report_doc_filename;
                },
            },
            receive_doc_filename: { // the name of the new computed field
                needs: { receive_doc_filename: true }, /* field */
                compute(complaint_report) {

                    let receive_doc_filename = null;

                    if (complaint_report.receive_doc_filename != null) {
                        receive_doc_filename = process.env.PATH_UPLOAD + complaint_report.receive_doc_filename;
                    }

                    return receive_doc_filename;
                }
            },
            return_doc_filename: { // the name of the new computed field
                needs: { return_doc_filename: true }, /* field */
                compute(complaint_report) {

                    let return_doc_filename = null;

                    if (complaint_report.return_doc_filename != null) {
                        return_doc_filename = process.env.PATH_UPLOAD + complaint_report.return_doc_filename;
                    }

                    return return_doc_filename;
                }
            },
        },
    },
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    complaint_id: true,
    proceed_status_id: true,
    report_doc_no: true,
    report_doc_date: true,
    report_doc_filename: true,
    report_user_id: true,
    report_at: true,
    report_detail: true,
    from_inspector_id: true,
    from_bureau_id: true,
    from_division_id: true,
    from_agency_id: true,
    to_inspector_id: true,
    to_bureau_id: true,
    to_division_id: true,
    to_agency_id: true,
    receive_doc_no: true,
    receive_doc_date: true,
    receive_doc_filename: true,
    receive_user_id: true,
    receive_at: true,
    receive_comment: true,
    state_id: true,
    status: true,
    return_detail: true,
    return_at: true,
    return_user_id: true,
    return_doc_no: true,
    return_doc_date: true,
    return_doc_filename: true,
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    proceed_status: {
        select: {
            name_th: true
        }
    },
    state: {
        select: {
            name_th: true
        }
    },
    report_user: {
        select: {
            firstname: true,
            lastname: true
        }
    },
    report_return_user:{
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
    }  ,
    from_inspector: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    from_bureau: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    from_division: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    from_agency: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    to_inspector: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    to_bureau: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    to_division: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
    to_agency: {
        select: {
            name_th: true,
            name_th_abbr: true
        }
    },
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

    if (req.query.proceed_status_id) {
        $where["proceed_status_id"] = parseInt(req.query.proceed_status_id);
    }

    if (req.query.report_doc_no) {
        $where["report_doc_no"] = {
            contains: req.query.report_doc_no,
        }
    }

    if (req.query.report_doc_date) {
        $where["report_doc_date"] = {
            contains: req.query.report_doc_date,
        }
    }

    if (req.query.report_user_id) {
        $where["report_user_id"] = parseInt(req.query.report_user_id);
    }

    if (req.query.from_inspector_id) {
        $where["from_inspector_id"] = parseInt(req.query.from_inspector_id);
    }

    if (req.query.from_bureau_id) {
        $where["from_bureau_id"] = parseInt(req.query.from_bureau_id);
    }

    if (req.query.from_division_id) {
        $where["from_division_id"] = parseInt(req.query.from_division_id);
    }

    if (req.query.from_agency_id) {
        $where["from_agency_id"] = parseInt(req.query.from_agency_id);
    }

    if (req.query.to_inspector_id) {
        $where["to_inspector_id"] = parseInt(req.query.to_inspector_id);
    }

    if (req.query.to_bureau_id) {
        $where["to_bureau_id"] = parseInt(req.query.to_bureau_id);
    }

    if (req.query.to_division_id) {
        $where["to_division_id"] = parseInt(req.query.to_division_id);
    }

    if (req.query.to_agency_id) {
        $where["to_agency_id"] = parseInt(req.query.to_agency_id);
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

    if (req.query.state_id) {
        $where["state_id"] = parseInt(req.query.state_id);
    }

    if (req.query.status) {
        $where["status"] = parseInt(req.query.status);
    }

    if (req.query.return_user_id) {
        $where["return_user_id"] = parseInt(req.query.return_user_id);
    }

    if (req.query.return_doc_no) {
        $where["return_doc_no"] = {
            contains: req.query.return_doc_no,
        }
    }

    if (req.query.return_doc_date) {
        $where["return_doc_date"] = {
            contains: req.query.return_doc_date,
        }
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

            let reportDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","report_doc_filename");
            let receiveDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","receive_doc_filename");
            let returnDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","return_doc_filename");

            if (reportDocPathFile == "error" || receiveDocPathFile == "error" || returnDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].create({
                data: {
                    complaint_id: Number(req.body.complaint_id),
                    proceed_status_id: Number(req.body.proceed_status_id),

                    report_doc_no: req.body.report_doc_no,
                    report_doc_date: req.body.report_doc_date != null ? new Date(req.body.report_doc_date) : undefined,
                    report_doc_filename: reportDocPathFile,

                    report_user_id: Number(req.body.report_user_id),
                    report_at: req.body.report_at != null ? new Date(req.body.report_at) : undefined,
                    report_detail: req.body.report_detail,

                    from_inspector_id: Number(req.body.from_inspector_id),
                    from_bureau_id: Number(req.body.from_bureau_id),
                    from_division_id: Number(req.body.from_division_id),
                    from_agency_id: Number(req.body.from_agency_id),

                    to_inspector_id: Number(req.body.to_inspector_id),
                    to_bureau_id: Number(req.body.to_bureau_id),
                    to_division_id: Number(req.body.to_division_id),
                    to_agency_id: Number(req.body.to_agency_id),

                    receive_doc_no: req.body.receive_doc_no,
                    receive_doc_date: req.body.receive_doc_date != null ? new Date(req.body.receive_doc_date) : undefined,
                    receive_doc_filename: receiveDocPathFile,

                    receive_user_id: Number(req.body.receive_user_id),
                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    receive_comment: req.body.receive_comment,

                    state_id: Number(req.body.state_id),
                    is_active: Number(req.body.is_active),
                    status: Number(req.body.status),
                    return_detail: req.body.return_detail,
                    return_at: req.body.return_at != null ? new Date(req.body.return_at) : undefined,
                    return_user_id: Number(req.body.return_user_id),
                    return_doc_no: req.body.return_doc_no,
                    return_doc_date: req.body.return_doc_date != null ? new Date(req.body.return_doc_date) : undefined,
                    return_doc_filename: returnDocPathFile,
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

            let reportDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","report_doc_filename");
            let receiveDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","receive_doc_filename");
            let returnDocPathFile = await uploadController.onUploadFile(req,"/complaint-report/","return_doc_filename");

            if (reportDocPathFile == "error" || receiveDocPathFile == "error" || returnDocPathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    complaint_id: req.body.complaint_id != null ? Number(req.body.complaint_id) : undefined,
                    proceed_status_id: req.body.proceed_status_id != null ? Number(req.body.proceed_status_id) : undefined,

                    report_doc_no: req.body.report_doc_no != null ? req.body.report_doc_no : undefined,
                    report_doc_date: req.body.report_doc_date != null ? new Date(req.body.report_doc_date) : undefined,
                    report_doc_filename: reportDocPathFile != null ? reportDocPathFile : undefined,

                    report_user_id: req.body.report_user_id != null ? Number(req.body.report_user_id) : undefined,
                    report_at: req.body.report_at != null ? new Date(req.body.report_at) : undefined,
                    report_detail: req.body.report_detail != null ? req.body.report_detail : undefined,

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

                    status: req.body.status != null ? Number(req.body.status) : undefined,
                    return_detail: req.body.return_detail != null ? req.body.return_detail : undefined,
                    return_at: req.body.return_at != null ? new Date(req.body.return_at) : undefined,
                    return_user_id: req.body.return_user_id != null ? Number(req.body.return_user_id) : undefined,
                    return_doc_no: req.body.return_doc_no != null ? req.body.return_doc_no : undefined,
                    return_doc_date: req.body.return_doc_date != null ? new Date(req.body.return_doc_date) : undefined,
                    return_doc_filename: returnDocPathFile != null ? returnDocPathFile : undefined,
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
