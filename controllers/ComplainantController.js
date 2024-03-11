const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const $table = "complainant";

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    card_type: true,
    prefix_name_id: true,
    firstname: true,
    lastname: true,
    birthday: true,
    occupation_id: true,
    occupation_text: true,
    phone_number: true,
    email: true,
    line_id: true,
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

    if (req.query.uuid) {
        $where["uuid"] =  {contains: req.query.uuid};
    }

    if (req.query.card_type) {
        $where["card_type"] = parseInt(req.query.card_type);
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

    if (req.query.birthday) {
        $where["birthday"] =  {contains: req.query.birthday};
    }

    if (req.query.occupation_id) {
        $where["occupation_id"] = parseInt(req.query.occupation_id);
    }

    if (req.query.occupation_text) {
        $where["occupation_text"] =  {contains: req.query.occupation_text};
    }

    if (req.query.phone_number) {
        $where["phone_number"] =  {contains: req.query.phone_number};
    }

    if (req.query.email) {
        $where["email"] =  {contains: req.query.email};
    }

    if (req.query.line_id) {
        $where["line_id"] =  {contains: req.query.line_id};
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
                msg: " success",
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
                    uuid: uuidv4(),
                    card_type: Number(req.body.card_type),
                    id_card: req.body.id_card,
                    prefix_name_id: Number(req.body.prefix_name_id),
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    birthday: req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    occupation_id: Number(req.body.occupation_id),
                    occupation_text: req.body.occupation_text,
                    phone_number: req.body.phone_number,
                    email: req.body.email,
                    line_id: req.body.line_id,
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
                    card_type: req.body.card_type != null ? Number(req.body.card_type) : undefined,
                    id_card: req.body.id_card != null ? req.body.id_card : undefined,
                    prefix_name_id: req.body.prefix_name_id != null ? Number(req.body.prefix_name_id) : undefined,
                    firstname: req.body.firstname != null ? req.body.firstname : undefined,
                    lastname: req.body.lastname != null ? req.body.lastname : undefined,
                    birthday: req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    occupation_id: req.body.occupation_id != null ? Number(req.body.occupation_id) : undefined,
                    occupation_text: req.body.occupation_text != null ? req.body.occupation_text : undefined,
                    phone_number: req.body.phone_number != null ? req.body.phone_number : undefined,
                    email: req.body.email != null ? req.body.email : undefined,
                    line_id: req.body.line_id != null ? req.body.line_id : undefined,
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
