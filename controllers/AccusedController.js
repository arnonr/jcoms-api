const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const $table = "accused";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    prefix_name_id: true,
    firstname: true,
    lastname: true,
    position_id: true,
    section_id: true,
    agency_id: true,
    inspector_id: true,
    bureau_id: true,
    division_id: true,
    complaint_id: true,
    type: true,
    detail: true,

    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    prefix_name:{
        select:{
            name_th: true
        }
    },
    position:{
        select:{
            name_th: true
        }
    },
    inspector:{
        select:{
            name_th: true
        }
    },
    bureau:{
        select:{
            name_th: true
        }
    },
    division:{
        select:{
            name_th: true
        }
    },
    agency:{
        select:{
            name_th: true
        }
    },
    section:{
        select:{
            name_th: true
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

    if (req.query.prefix_name_id) {
        $where["prefix_name_id"] = parseInt(req.query.prefix_name_id);
    }

    if (req.query.firstname) {
        $where["firstname"] =  {contains: req.query.firstname};
    }

    if (req.query.lastname) {
        $where["lastname"] =  {contains: req.query.lastname};
    }

    if (req.query.type) {
        $where["type"] = parseInt(req.query.type);
    }

    if (req.query.complaint_id) {
        $where["complaint_id"] = parseInt(req.query.complaint_id);
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

    if (req.query.section_id) {
        $where["section_id"] = parseInt(req.query.section_id);
    }

    if (req.query.position_id) {
        $where["position_id"] = parseInt(req.query.position_id);
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
                    prefix_name_id: req.body.prefix_name_id != null ? Number(req.body.prefix_name_id) : undefined,
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    position_id: req.body.position_id != null ? Number(req.body.position_id) : undefined,
                    section_id: req.body.section_id != null ? Number(req.body.section_id) : undefined,
                    agency_id: req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    complaint_id: Number(req.body.complaint_id),
                    type: Number(req.body.type),
                    detail: req.body.detail,
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
                    prefix_name_id: req.body.prefix_name_id != null ? Number(req.body.prefix_name_id) : undefined,
                    firstname: req.body.firstname != null ? req.body.firstname : undefined,
                    lastname: req.body.lastname != null ? req.body.lastname : undefined,
                    position_id: req.body.position_id != null ? Number(req.body.position_id) : undefined,
                    section_id: req.body.section_id != null ? Number(req.body.section_id) : undefined,
                    agency_id: req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    complaint_id: req.body.complaint_id != null ? Number(req.body.complaint_id) : undefined,
                    type: req.body.type != null ? Number(req.body.type) : undefined,
                    detail: req.body.detail != null ? req.body.detail : undefined,
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
