const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const $table = "organization_permission";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    role_id: true,
    inspector_id: true,
    bureau_id: true,
    division_id: true,
    resp_inspector_id: true,
    resp_bureau_id: true,
    resp_division_id: true,
    resp_agency_id: true,
    role: {
        select: {
            name_th: true
        }
    },
    inspector: {
        select: {
            name_th: true
        }
    },
    bureau: {
        select:{
            name_th: true
        }
    },
    division :{
        select:{
            name_th: true
        }
    },
    resp_inspector: {
        select: {
            name_th: true
        }
    },
    resp_bureau: {
        select:{
            name_th: true
        }
    },
    resp_division :{
        select:{
            name_th: true
        }
    },
    resp_agency :{
        select:{
            name_th: true
        }
    },
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    is_active: true,
};
const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.role_id) {
        $where["role_id"] = parseInt(req.query.role_id);
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

    if (req.query.resp_inspector_id) {
        $where["resp_inspector_id"] = parseInt(req.query.resp_inspector_id);
    }

    if (req.query.resp_bureau_id) {
        $where["resp_bureau_id"] = parseInt(req.query.resp_bureau_id);
    }

    if (req.query.resp_division_id) {
        $where["resp_division_id"] = parseInt(req.query.resp_division_id);
    }

    if (req.query.resp_agency_id) {
        $where["resp_agency_id"] = parseInt(req.query.resp_agency_id);
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
    let $totalPage =
        Math.ceil($count / $perPage) == 0 ? 1 : Math.ceil($count / $perPage);
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
                lang: req.query.lang ? req.query.lang : "",
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
            const item = await prisma[$table].create({
                data: {
                    role_id: Number(req.body.role_id),
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    resp_inspector_id: req.body.resp_inspector_id != null ? Number(req.body.resp_inspector_id) : undefined,
                    resp_bureau_id: req.body.resp_bureau_id != null ? Number(req.body.resp_bureau_id) : undefined,
                    resp_division_id: req.body.resp_division_id != null ? Number(req.body.resp_division_id) : undefined,
                    resp_agency_id: req.body.resp_agency_id != null ? Number(req.body.resp_agency_id) : undefined,
                    is_active: Number(req.body.is_active),
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
                    role_id: req.body.role_id != null ? Number(req.body.role_id) : undefined,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    resp_inspector_id: req.body.resp_inspector_id != null ? Number(req.body.resp_inspector_id) : undefined,
                    resp_bureau_id: req.body.resp_bureau_id != null ? Number(req.body.resp_bureau_id) : undefined,
                    resp_division_id: req.body.resp_division_id != null ? Number(req.body.resp_division_id) : undefined,
                    resp_agency_id: req.body.resp_agency_id != null ? Number(req.body.resp_agency_id) : undefined,
                    is_active: Number(req.body.is_active),
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

            await prisma[$table].delete({
                where: {
                    id: Number(req.params.id),
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
