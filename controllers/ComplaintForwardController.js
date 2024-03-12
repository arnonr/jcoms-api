const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const $table = "complaint_forward";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    complaint_id: true,

    forward_doc_no: true,
    forward_doc_date: true,
    forward_doc_filename: true,
    forward_user_id: true,
    forward_at: true,
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
    order_id: true,
    order_detail: true,
    receive_status: true,
    state_id: true,
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

    if (req.query.is_active) {
        $where["is_active"] = parseInt(req.query.is_active);
    }

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.complaint_id) {
        $where["complaint_id"] = parseInt(req.query.complaint_id);
    }

    if (req.query.forward_doc_no) {
        $where["forward_doc_no"] = {
            contains: req.query.forward_doc_no,
        }
    }

    if (req.query.forward_doc_date) {
        $where["forward_doc_date"] = {
            contains: req.query.forward_doc_date,
        }
    }

    if (req.query.forward_doc_filename) {
        $where["forward_doc_filename"] = {
            contains: req.query.forward_doc_filename,
        }
    }

    if (req.query.forward_user_id) {
        $where["forward_user_id"] = parseInt(req.query.forward_user_id);
    }

    if (req.query.from_inspector_id) {
        $where["from_inspector_id"] = parseInt(req.query.from_inspector_id);
    }

    if (req.query.from_bureau_id) {
        $where["from_bureau_id"] = parseInt(req.query.from_bureau_id);
    }

    if (req.query.from_agency_id) {
        $where["from_agency_id"] = parseInt(req.query.from_agency_id);
    }

    if (req.query.from_division_id) {
        $where["from_division_id"] = parseInt(req.query.from_division_id);
    }

    if (req.query.to_inspector_id) {
        $where["to_inspector_id"] = parseInt(req.query.to_inspector_id);
    }

    if (req.query.to_bureau_id) {
        $where["to_bureau_id"] = parseInt(req.query.to_bureau_id);
    }

    if (req.query.to_agency_id) {
        $where["to_agency_id"] = parseInt(req.query.to_agency_id);
    }

    if (req.query.to_division_id) {
        $where["to_division_id"] = parseInt(req.query.to_division_id);
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

    if (req.query.receive_doc_filename) {
        $where["receive_doc_filename"] = {
            contains: req.query.receive_doc_filename,
        }
    }

    if (req.query.receive_user_id) {
        $where["receive_user_id"] = parseInt(req.query.receive_user_id);
    }

    if (req.query.order_id) {
        $where["order_id"] = parseInt(req.query.order_id);
    }

    if (req.query.order_detail) {
        $where["order_detail"] = {
            contains: req.query.order_detail,
        }
    }

    if (req.query.receive_status) {
        $where["receive_status"] = parseInt(req.query.receive_status);
    }

    if (req.query.state_id) {
        $where["state_id"] = parseInt(req.query.state_id);
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
                    complaint_id: Number(req.body.complaint_id),
                    forward_doc_no: req.body.forward_doc_no,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,
                    forward_doc_filename: req.body.forward_doc_filename,
                    forward_user_id: Number(req.body.forward_user_id),
                    forward_at: req.body.forward_at != null ? new Date(req.body.forward_at) : undefined,
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
                    receive_doc_filename: req.body.receive_doc_filename,
                    receive_user_id: Number(req.body.receive_user_id),
                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,
                    order_id: Number(req.body.order_id),
                    order_detail: req.body.order_detail,
                    receive_status: Number(req.body.receive_status),
                    state_id: Number(req.body.state_id),
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
                    complaint_id: req.body.complaint_id != null ? Number(req.body.complaint_id) : undefined,
                    forward_doc_no: req.body.forward_doc_no != null ? req.body.forward_doc_no : undefined,
                    forward_doc_date: req.body.forward_doc_date != null ? new Date(req.body.forward_doc_date) : undefined,
                    forward_doc_filename: req.body.forward_doc_filename != null ? req.body.forward_doc_filename : undefined,

                    forward_user_id: req.body.forward_user_id != null ? Number(req.body.forward_user_id) : undefined,
                    forward_at: req.body.forward_at != null ? new Date(req.body.forward_at) : undefined,

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
                    receive_doc_filename: req.body.receive_doc_filename != null ? req.body.receive_doc_filename : undefined,
                    receive_user_id: req.body.receive_user_id != null ? Number(req.body.receive_user_id) : undefined,
                    receive_at: req.body.receive_at != null ? new Date(req.body.receive_at) : undefined,

                    order_id: req.body.order_id != null ? Number(req.body.order_id) : undefined,
                    order_detail: req.body.order_detail != null ? req.body.order_detail : undefined,
                    receive_status: req.body.receive_status != null ? Number(req.body.receive_status) : undefined,
                    state_id: req.body.state_id != null ? Number(req.body.state_id) : undefined,
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
