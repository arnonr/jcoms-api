const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;
const $table = "role";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    name_th: true,
    name_en: true,
    description: true,
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    permission:{
        select:{
            id: true,
            menu: true,
            description: true,
            action_view: true,
            action_create: true,
            action_update: true,
            action_delete: true,
            action_export: true,
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

    if (req.query.lang && req.query.lang == "en") {
        $where["name_en"] = {
            not: null,
        };
    }

    if (req.query.name_th) {
        $where["name_th"] = {
        contains: req.query.name_th,
        //   mode: "insensitive",
        };
    }

    if (req.query.name_en) {
        $where["name_en"] = {
        contains: req.query.name_en,
        //   mode: "insensitive",
        };
    }

    if (req.query.name) {
        if (req.query.lang && req.query.lang == "th") {
            $where["name_th"] = {
                contains: req.query.name,
            };
        } else {
            $where["name_en"]["contains"] = req.query.name;
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



    const checkLanguage = (req) => {
        let prismaLang = prisma.$extends({
            result: {
                table: {
                    name: {
                        needs: { name_th: true },
                        compute(table) {
                            return req.query.lang && req.query.lang == "en"
                            ? table.name_en
                            : table.name_th;
                        },
                    },
                },
            },
        });

        return prismaLang;
    };

const methods = {
    async onGetAll(req, res) {
        try {
            let $where = filterData(req);
            let other = await countDataAndOrder(req, $where);

            let prismaLang = checkLanguage(req);

            const item = await prismaLang[$table].findMany({
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
            let prismaLang = checkLanguage(req);
            const item = await prismaLang[$table].findUnique({
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
                    name_th: req.body.name_th,
                    name_en: req.body.name_en,
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
            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    name_th: req.body.name_th != null ? req.body.name_th : undefined,
                    name_en: req.body.name_en != null ? req.body.name_en : undefined,
                    is_active: Number(req.body.is_active),

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
