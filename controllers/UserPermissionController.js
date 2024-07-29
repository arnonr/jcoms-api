const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;

const $table = "user_permission";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    user_id: true,
    menu: true,
    description: true,
    action_view: true,
    action_create: true,
    action_update: true,
    action_delete: true,
    action_export: true,
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    user: {
        select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
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

    if (req.query.user_id) {
        $where["user_id"] = parseInt(req.query.user_id);
    }

    if (req.query.menu) {
        $where["menu"] = {
            contains: req.query.menu,
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

    async onGetByUserId(req, res) {
        try {
            const item = await prisma[$table].findMany({
                select: selectField,
                where: {
                    user_id: Number(req.params.id),
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
                    user_id: Number(req.body.user_id),
                    menu: req.body.menu,
                    description: req.body.description != null ? req.body.description : null,
                    action_view: req.body.action_view != null ? Number(req.body.action_view) : null,
                    action_create: req.body.action_create != null ? Number(req.body.action_create) : null,
                    action_update: req.body.action_update != null ? Number(req.body.action_update) : null,
                    action_delete: req.body.action_delete != null ? Number(req.body.action_delete) : null,
                    action_export: req.body.action_export != null ? Number(req.body.action_export) : null,

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
                    menu: req.body.menu != null ? req.body.menu : undefined,
                    description: req.body.description != null ? req.body.description : undefined,
                    action_view: req.body.action_view != null ? Number(req.body.action_view) : null,
                    action_create: req.body.action_create != null ? Number(req.body.action_create) : null,
                    action_update: req.body.action_update != null ? Number(req.body.action_update) : null,
                    action_delete: req.body.action_delete != null ? Number(req.body.action_delete) : null,
                    action_export: req.body.action_export != null ? Number(req.body.action_export) : null,
                    is_active: req.body.is_active != null ? Number(req.body.is_active) : undefined,
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

    async onDeleteWithUserID(req, res) {
        try { 
            await prisma[$table].deleteMany({
                where: {
                    user_id: Number(req.params.id),
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
