const { PrismaClient } = require("@prisma/client");
const uploadController = require("./UploadsController");
const helperController = require("./HelperController");
const $table = "complainant";
const { v4: uuidv4 } = require('uuid');

// const prisma = new PrismaClient();
const prisma = new PrismaClient().$extends({
    result: {
        complainant: { //extend Model name
            card_photo: { // the name of the new computed field
                needs: { card_photo: true }, /* field */
                compute(model) {

                    let card_photo = null;

                    if (model.card_photo != null) {
                        card_photo = process.env.PATH_UPLOAD + model.card_photo;
                    }

                    return card_photo;
                },
            },
            id_card: {
                needs: { id_card: true } ,
                compute(model) {
                    let id_card = null;

                    if (model.id_card != null) {
                        id_card = helperController.base64DecodeWithKey(model.id_card);
                    }

                    return id_card;
                }
            },

        },
    },
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    card_type: true,
    id_card: true,
    card_photo: true,
    // prefix_name_id: true,
    // firstname: true,
    // lastname: true,
    // birthday: true,
    // occupation_id: true,
    // occupation_text: true,
    // phone_number: true,
    // email: true,
    // line_id: true,
    // house_number: true,
    // building: true,
    // moo: true,
    // soi: true,
    // road: true,
    // postal_code: true,
    // sub_district_id: true,
    // district_id: true,
    // province_id: true,

    // position_id: true,
    // section_id: true,
    // inspector_id: true,
    // bureau_id: true,
    // division_id: true,
    // agency_id: true,

    // created_at: true,
    // created_by: true,
    // updated_at: true,
    // updated_by: true,
    // deleted_at: true,
    // deleted_by: true,
    // is_active: true,
    // prefix_name:{
    //     select:{
    //         name_th: true
    //     }
    // },
    // province: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // district: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // sub_district: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // inspector: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // bureau: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // division: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // agency: {
    //     select: {
    //         name_th: true,
    //     }
    // },
    // section:{
    //     select:{
    //         name_th: true
    //     }
    // },
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

    if (req.query.house_number) {
        $where["house_number"] = {
            contains: req.query.house_number,
        }
    }

    if (req.query.building) {
        $where["building"] = {
            contains: req.query.building,
        }
    }

    if (req.query.moo) {
        $where["moo"] = {
            contains: req.query.moo,
        }
    }

    if (req.query.soi) {
        $where["soi"] = {
            contains: req.query.soi,
        }
    }

    if (req.query.road) {
        $where["road"] = {
            contains: req.query.road,
        }
    }

    if (req.query.postal_code) {
        $where["postal_code"] = {
            contains: req.query.postal_code,
        }
    }

    if (req.query.sub_district_id) {
        $where["sub_district_id"] = parseInt(req.query.sub_district_id);
    }

    if (req.query.district_id) {
        $where["district_id"] = parseInt(req.query.district_id);
    }

    if (req.query.province_id) {
        $where["province_id"] = parseInt(req.query.province_id);
    }

    if (req.query.is_active) {
        $where["is_active"] = parseInt(req.query.is_active);
    }

    if (req.query.position_id) {
        $where["position_id"] = parseInt(req.query.position_id);
    }

    if (req.query.section_id) {
        $where["section_id"] = parseInt(req.query.section_id);
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

            let pathFile = await uploadController.onUploadFile(req, "/complainant/", "card_photo");

            if (pathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].create({
                data: {
                    uuid: uuidv4(),
                    card_type: Number(req.body.card_type),
                    id_card: req.body.id_card != null ? helperController.base64EncodeWithKey(req.body.id_card) : undefined,
                    card_photo: pathFile,
                    prefix_name_id: Number(req.body.prefix_name_id),
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    birthday: req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    occupation_id: Number(req.body.occupation_id),
                    occupation_text: req.body.occupation_text,
                    phone_number: req.body.phone_number,
                    email: req.body.email,
                    line_id: req.body.line_id,
                    house_number: req.body.house_number,
                    building: req.body.building,
                    moo: req.body.moo,
                    soi: req.body.soi,
                    road: req.body.road,
                    postal_code: req.body.postal_code,
                    sub_district_id: Number(req.body.sub_district_id),
                    district_id: Number(req.body.district_id),
                    province_id: Number(req.body.province_id),

                    position_id: Number(req.body.position_id),
                    section_id: Number(req.body.section_id),
                    inspector_id: Number(req.body.inspector_id),
                    bureau_id: Number(req.body.bureau_id),
                    division_id: Number(req.body.division_id),
                    agency_id: Number(req.body.agency_id),
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

            let pathFile = await uploadController.onUploadFile(req,"/complainant/","card_photo");

            if (pathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].update({
                where: {
                    id: Number(req.params.id),
                },
                data: {
                    card_type: req.body.card_type != null ? Number(req.body.card_type) : undefined,
                    id_card: req.body.id_card != null ? helperController.base64EncodeWithKey(req.body.id_card) : undefined,

                    prefix_name_id: req.body.prefix_name_id != null ? Number(req.body.prefix_name_id) : undefined,
                    firstname: req.body.firstname != null ? req.body.firstname : undefined,
                    lastname: req.body.lastname != null ? req.body.lastname : undefined,
                    birthday: req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    occupation_id: req.body.occupation_id != null ? Number(req.body.occupation_id) : undefined,
                    occupation_text: req.body.occupation_text != null ? req.body.occupation_text : undefined,
                    phone_number: req.body.phone_number != null ? req.body.phone_number : undefined,
                    email: req.body.email != null ? req.body.email : undefined,
                    line_id: req.body.line_id != null ? req.body.line_id : undefined,
                    house_number: req.body.house_number != null ? req.body.house_number : undefined,
                    building: req.body.building != null ? req.body.building : undefined,
                    moo: req.body.moo != null ? req.body.moo : undefined,
                    soi: req.body.soi != null ? req.body.soi : undefined,
                    road: req.body.road != null ? req.body.road : undefined,
                    postal_code: req.body.postal_code != null ? req.body.postal_code : undefined,
                    sub_district_id: req.body.sub_district_id != null ? Number(req.body.sub_district_id) : undefined,
                    district_id: req.body.district_id != null ? Number(req.body.district_id) : undefined,
                    province_id: req.body.province_id != null ? Number(req.body.province_id) : undefined,

                    section_id: req.body.section_id != null ? Number(req.body.section_id) : undefined,
                    inspector_id: req.body.inspector_id != null ? Number(req.body.inspector_id) : undefined,
                    bureau_id: req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                    division_id: req.body.division_id != null ? Number(req.body.division_id) : undefined,
                    agency_id: req.body.agency_id != null ? Number(req.body.agency_id) : undefined,

                    card_photo: pathFile != null ? pathFile : undefined,
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
