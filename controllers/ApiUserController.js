const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const $table = "api_user";
const saltRounds = 10;

const encrypt = (text) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(text, salt);
    return hash;
};

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    name: true,
    email: true,
    tel: true,
    agency: true,
    password_hash: true,
    api_key: true,
    last_request_time: true,
    rate_limit_per_hour: true,
    rate_limit_allowance: true,
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

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.email) {
        $where["email"] = {
            contains: req.query.email,
        };
    }

    if (req.query.tel) {
        $where["tel"] = {
            contains: req.query.tel,
        };
    }

    if (req.query.name) {
        $where["name"] = {
            contains: req.query.name,
        };
    }

    if (req.query.agency) {
        $where["agency"] = {
            contains: req.query.agency,
        };
    }

    if (req.query.uuid) {
        $where["uuid"] = {
            contains: req.query.uuid,
        }
    }

    if (req.query.is_active) {
        $where["is_active"] = parseInt(req.query.is_active);
    }

    return $where;
};

const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
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

            if(req.body.name == null) {
                throw new Error('name is required');
            }

            if(req.body.email == null) {
                throw new Error('email is required');
            }

            if(req.body.tel == null) {
                throw new Error('tel is required');
            }

            if(req.body.agency == null) {
                throw new Error('agency is required');
            }

            const password_hash = (req.body.password) ? encrypt(req.body.password) : null;

            const apiKey = generateApiKey();
            const item = await prisma[$table].create({
                data: {
                    uuid: uuidv4(),
                    name: req.body.name,
                    email: req.body.email,
                    tel: req.body.tel,
                    agency: req.body.agency,
                    password_hash: password_hash,
                    api_key: apiKey,
                    is_active: req.body.is_active != null ? Number(req.body.is_active) : 1,
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
                    name: req.body.name != null ? req.body.name : undefined,
                    email: req.body.email != null ? req.body.email : undefined,
                    tel: req.body.tel != null ? req.body.tel : undefined,
                    agency: req.body.agency != null ? req.body.agency : undefined,
                    password_hash: req.body.password_hash != null ? req.body.password_hash : undefined,
                    is_active: req.body.is_active != null ? Number(req.body.is_active) : undefined,
                    rate_limit_per_hour: req.body.rate_limit_per_hour != null ? Number(req.body.rate_limit_per_hour) : undefined,
                    rate_limit_allowance: req.body.rate_limit_allowance != null ? Number(req.body.rate_limit_allowance) : undefined,
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
