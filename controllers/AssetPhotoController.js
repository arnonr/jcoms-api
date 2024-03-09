const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const $table = "asset_photo";

const prisma = new PrismaClient().$extends({
    result: {
        asset_photo: {
            asset_photo_file: {
                needs: { asset_photo_file: true },
                compute(asset_photo) {
                    let asset_photo_file = null;
                    if (asset_photo.asset_photo_file != null) {
                        asset_photo_file = process.env.PATH_UPLOAD + asset_photo.asset_photo_file;
                    }
                    return asset_photo_file;
                },
            },
        },
    },
});

const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.asset_id) {
        $where["asset_id"] = parseInt(req.query.asset_id);
    }

    if (req.query.secret_key) {
        $where["secret_key"] = {
        contains: req.query.secret_key,
        //   mode: "insensitive",
        };
    }

    if (req.query.asset_photo_file) {
        $where["asset_photo_file"] = {
        contains: req.query.asset_photo_file,
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

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    asset_id: true,
    secret_key: true,
    asset_photo_file: true,
    is_active: true,
    asset: {
        select: {
            id: true,
            asset_code: true,
            asset_name: true,
        },
    },
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
                    asset_id: req.body.asset_id,
                    secret_key: req.body.secret_key,
                    asset_photo_file: req.body.asset_photo_file,
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
                    asset_id: req.body.asset_id != null ? req.body.asset_id : undefined,
                    secret_key: req.body.secret_key != null ? req.body.secret_key : undefined,
                    asset_photo_file: req.body.filenasset_photo_fileame != null ? req.body.asset_photo_file : undefined,
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
