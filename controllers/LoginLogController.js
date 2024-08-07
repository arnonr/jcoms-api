const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;
const $table = "login_log";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    user_id: true,
    logined_at: true,
    ip_address: true,
    user_agent: true,
    status: true,
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    user: {
        select: {
            email: true,
            firstname: true,
            lastname: true,
            prefix_name: {
                select: {
                    name_th: true,
                    name_th_abbr: true,
                }
            },
            inspector: {
                select: {
                    name_th: true,
                    name_th_abbr: true,
                }
            },
            bureau: {
                select: {
                name_th: true,
                name_th_abbr: true,
                }
            },
            division: {
                select: {
                name_th: true,
                name_th_abbr: true,
                }
            },
            agency: {
                select: {
                name_th: true,
                name_th_abbr: true,
                }
            }

        },
    },
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

    if (req.query.logined_at) {
        $where["logined_at"] = {
            contains: req.query.logined_at,
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
            let $where = filterData(req);

            $where["user_id"] = Number(req.params.id);

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
                    user_id: Number(req.body.user_id),
                    logined_at: req.body.logined_at != null ? new Date(req.body.logined_at) : undefined,
                    ip_address: req.body.ip_address,
                    user_agent: req.body.user_agent,
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
                    user_id: req.body.user_id != null ? Number(req.body.user_id) : undefined,
                    logined_at: req.body.logined_at != null ? new Date(req.body.logined_at) : undefined,
                    ip_address: req.body.ip_address != null ? req.body.ip_address : undefined,
                    user_agent: req.body.user_agent != null ? req.body.user_agent : undefined,
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

    async onSaveLog(user_id, username, status =  null, ip_address = null, user_agent = null) {
        try{
            const item = await prisma[$table].create({
                data: {
                    user_id: Number(user_id),
                    ip_address: ip_address,
                    user_agent: user_agent,
                    status: status,
                    created_at: new Date(),
                    created_by: username,
                    // updated_by: null,
                },
            });
        }catch(error){
            console.log(error);
        }
    },
};

module.exports = { ...methods };
