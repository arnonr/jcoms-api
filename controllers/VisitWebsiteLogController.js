const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;

const $table = "visit_website_log";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    browser: true,
    cpu: true,
    device: true,
    engine: true,
    os: true,
    ua: true,
    ip_address: true,
    created_at: true,
    created_by: true,
    is_active: true,
};
const filterData = (req) => {
    let $where = {
        // deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.create_from && req.query.create_to) {
        let date_from = new Date(
          req.query.create_from + "T00:00:00.000+0000"
        ).toISOString();
        let date_to = new Date(
          req.query.create_to + "T23:59:59.000+0000"
        ).toISOString();
    
        $where["created_at"] = {
          gte: date_from,
          lte: date_to,
        };
      } else if (req.query.create_from) {
        let date_from = new Date(
          req.query.create_from + "T00:00:00.000+0000"
        ).toISOString();
        $where["created_at"] = {
          gte: date_from,
        };
      } else if (req.query.create_to) {
        let date_to = new Date(
          req.query.create_to + "T23:59:59.000+0000"
        ).toISOString();
        $where["created_at"] = {
          lte: date_to,
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
                    browser: JSON.stringify(req.body.browser),
                    cpu: JSON.stringify(req.body.cpu),
                    device: JSON.stringify(req.body.device),
                    engine: JSON.stringify(req.body.engine),
                    os: JSON.stringify(req.body.os),
                    ua: JSON.stringify(req.body.ua),
                    ip_address:  req.clientIp,
                    created_at: req.body.created_at != null ? new Date(req.body.created_at) : undefined,
                    is_active: 1
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
                    browser: req.body.browser != null ? JSON.stringify(req.body.browser) : undefined,
                    cpu: req.body.cpu  != null ? JSON.stringify(req.body.cpu) : undefined,
                    device: req.body.device != null ? JSON.stringify(req.body.device) : undefined,
                    engine: req.body.engine != null ? JSON.stringify(req.body.engine) : undefined,
                    os: req.body.os != null ? JSON.stringify(req.body.os) : undefined,
                    ua: req.body.ua != null ? JSON.stringify(req.body.ua) : undefined,
                    ip_address: req.body.ip_address != null ? req.body.ip_address : undefined,
                    created_at: req.body.created_at != null ? new Date(req.body.created_at) : undefined,
                    is_active: 1
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
    },
};

module.exports = { ...methods };
