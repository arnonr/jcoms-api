const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const $table = "department";

const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.code) {
        $where["code"] = {
        contains: req.query.code,
        //   mode: "insensitive",
        };
    }

    if (req.query.name) {
        $where["name"] = {
        contains: req.query.name,
        //   mode: "insensitive",
        };
    }

    if (req.query.name_abbr) {
        $where["name_abbr"] = {
        contains: req.query.name_abbr,
        //   mode: "insensitive",
        };
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

    let $perPage = req.query.perPage ? Number(req.query.perPage) : 100;
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

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    code: true,
    name: true,
    name_abbr: true,
    is_active: true
};

const methods = {
    // ค้นหาทั้งหมด
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
    // ค้นหาเรคคอร์ดเดียว
    async onGetById(req, res) {
        try {
            const item = await prisma[$table].findUnique({
                select: selectField,
                where: {
                    id: Number(req.params.id),
                },
            });
            res.status(200).json({ data: item, msg: " success" });
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

        try {
            const item = await prisma[$table].create({
                data: {
                    code: req.body.code,
                    name: req.body.name,
                    name_abbr: req.body.name_abbr,
                    is_active: Number(req.body.is_active),
                    created_by: authUsername,
                    updated_by: authUsername,
                },
            });

            res.status(201).json({ ...item, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

    // แก้ไข
    async onUpdate(req, res) {

        let authUsername = null;
        if(req.headers.authorization !== undefined){
            const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
            authUsername = decoded.username;
        }

        try {

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },

                data: {
                    code: req.body.code != null ? req.body.code : undefined,
                    name: req.body.name != null ? req.body.name : undefined,
                    name_abbr: req.body.name_abbr != null ? req.body.name_abbr : undefined,
                    is_active:req.body.is_active != null ? Number(req.body.is_active) : undefined,
                    updated_by: authUsername,
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
