const prisma_config = require('../config/prismaClient');
const uploadController = require("./UploadsController");
const loginLogController = require("./LoginLogController");

const $table = "user";
const $permission_table = "permission";
const $recovery_password_table = "recovery_password";
const $user_permission_table = "user_permission";
const $organization_permission_table = "organization_permission";

const { v4: uuidv4 } = require("uuid");
jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const LoginLogController = require("./LoginLogController");
const saltRounds = 10;
const nodemailer = require("nodemailer");

const encrypt = (text) => {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(text, salt);
    return hash;
};

const randomNumber = async () => {
    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number

    // Generate a random number between min and max (inclusive)
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

    return randomNumber.toString();
};

// const prisma = new PrismaClient();
const prisma = prisma_config.$extends({
    result: {
        user: {
        //extend Model name
        file_attach: {
            // the name of the new computed field
            needs: { file_attach: true } /* field */,
            compute(user) {
            let file_attach = null;

            if (user.file_attach != null) {
                file_attach = process.env.PATH_UPLOAD + user.file_attach;
            }

            return file_attach;
            },
        },
        fullname: {
            needs: { firstname: true, lastname: true, prefix_name_id: true },
            compute(user) {
            return (
                user.prefix_name?.name_th_abbr + user.firstname + " " + user.lastname
            );
            },
        },
        },
    },
});

async function getAbilities(user_id, role_id) {

    let permissions;
    if(role_id != null){

        permissions = await prisma[$permission_table].findMany({
        where: {
            role_id: role_id,
            is_active: 1
        },
        select: {
            menu: true,
            action_view: true,
            action_create: true,
            action_update: true,
            action_delete: true,
            action_export: true
        }
        });
    }

const abilities = permissions.flatMap(permission => {
    const { menu, ...actions } = permission
        return Object.entries(actions)
        .filter(([_, value]) => value)
        .map(([action]) => ({
            menu,
            action: action.replace('action_', '')
        }))
    })

    return abilities
};
async function getCustomAbilities(user_id) {

    let permissions;
        permissions = await prisma[$user_permission_table].findMany({
        where: {
            user_id: user_id,
        },
        select: {
            menu: true,
            action_view: true,
            action_create: true,
            action_update: true,
            action_delete: true,
            action_export: true
        }
    });

    const abilities = permissions.flatMap(permission => {
        const { menu, ...actions } = permission
        return Object.entries(actions)
        .filter(([_, value]) => value)
        .map(([action]) => ({
            menu,
            action: action.replace('action_', '')
        }))
    })

    return abilities
}

async function getOrganizationPermissions(role_id, inspector_id, bureau_id, division_id) {

    try {
        // Assuming you have a PrismaClient instance named prisma
        const dbData = await prisma.organization_permission.findMany({
            where: {
                role_id: role_id,
                OR: [
                    { inspector_id: inspector_id },
                    { bureau_id: bureau_id },
                    { division_id: division_id }
                ]
            }
        });

        const result = {
            resp_inspector_id: [],
            resp_bureau_id: [],
            resp_division_id: [],
            resp_agency_id: []
        };

        dbData.forEach(item => {

            if (item.resp_inspector_id !== null && !result.resp_inspector_id.includes(item.resp_inspector_id)) {
                result.resp_inspector_id.push(item.resp_inspector_id);
            }

            if (item.resp_bureau_id !== null && !result.resp_bureau_id.includes(item.resp_bureau_id)) {
                result.resp_bureau_id.push(item.resp_bureau_id);
            }

            if (item.resp_division_id !== null && !result.resp_division_id.includes(item.resp_division_id)) {
                result.resp_division_id.push(item.resp_division_id);
            }

            if (item.resp_agency_id !== null && !result.resp_agency_id.includes(item.resp_agency_id)) {
                result.resp_agency_id.push(item.resp_agency_id);
            }

        });

        return result;
    } catch (error) {
        console.error("Error fetching organization permissions:", error);
        throw error;
    }
}

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
    id: true,
    uuid: true,
    prefix_name_id: true,
    fullname: true,
    firstname: true,
    lastname: true,
    officer_code: true,
    id_card: true,
    position_id: true,
    section_id: true,
    role_id: true,
    inspector_id: true,
    bureau_id: true,
    division_id: true,
    agency_id: true,
    phone_number: true,
    status: true,
    email: true,
    line_id: true,
    birthday: true,
    file_attach: true,
    is_custom_role: true,
    // password: true,
    created_at: true,
    created_by: true,
    updated_at: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true,
    is_active: true,
    prefix_name: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    position: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    inspector: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    bureau: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    division: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    agency: {
        select: {
        name_th: true,
        name_th_abbr: true,
        },
    },
    section: {
        select: {
        name_th: true,
        },
    },
    role: {
        select: {
        name_th: true,
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

    if (req.query.prefix_name_id) {
        $where["prefix_name_id"] = parseInt(req.query.prefix_name_id);
    }

    if (req.query.firstname) {
        $where["firstname"] = { contains: req.query.firstname };
    }

    if (req.query.lastname) {
        $where["lastname"] = { contains: req.query.lastname };
    }

    if (req.query.officer_code) {
        $where["officer_code"] = { contains: req.query.officer_code };
    }

    if (req.query.id_card) {
        $where["id_card"] = { contains: req.query.id_card };
    }

    if (req.query.position_id) {
        $where["position_id"] = parseInt(req.query.position_id);
    }

    if (req.query.section_id) {
        $where["section_id"] = parseInt(req.query.section_id);
    }

    if (req.query.role_id) {
        $where["role_id"] = parseInt(req.query.role_id);
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

    if (req.query.phone_number) {
        $where["phone_number"] = { contains: req.query.phone_number };
    }

    if (req.query.status) {
        $where["status"] = parseInt(req.query.status);
    }

    if (req.query.email) {
        $where["email"] = { contains: req.query.email };
    }

    if (req.query.line_id) {
        $where["line_id"] = { contains: req.query.line_id };
    }

    if (req.query.birthday) {
        $where["birthday"] = { contains: req.query.birthday };
    }

    if (req.query.file_attach) {
        $where["file_attach"] = { contains: req.query.file_attach };
    }

    if (req.query.is_active) {
        $where["is_active"] = parseInt(req.query.is_active);
    }

    if (req.query.fullname) {
        const [firstName, lastName] = req.query.fullname.split(" ");
        $where = {
        ...$where,
        OR: [
            { firstname: { contains: firstName } },
            { lastname: { contains: lastName } },
            { firstname: { contains: lastName } },
            { lastname: { contains: firstName } },
        ],
        };
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
            totalData: other.$count,
            totalPage: other.$totalPage,
            currentPage: other.$currentPage,
            lang: req.query.lang ? req.query.lang : "",
            msg: "success",
            data: item,
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

            item.abilities = {};
            item.abilities = await getAbilities(item.id, item.role_id);

            if(item.is_custom_role == 1){
                item.custom_abilities = {};
                item.custom_abilities = await getCustomAbilities(item.id);
            }

            item.organization_permissions = {};
            item.organization_permissions = await getOrganizationPermissions(item.role_id, item.inspector_id, item.bureau_id, item.division_id);
            // console.log(JSON.stringify(result, null, 2));

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
            let pathFile = await uploadController.onUploadFile(
                req,
                "/user/",
                "file_attach"
            );

            if (pathFile == "error") {
                return res.status(500).send("error");
            }

            const user = await prisma[$table].findUnique({
                where: {
                email: req.body.email,
                },
            });

            if (user != null) {
                throw new Error("Email are already exist");
            }

            const item = await prisma[$table].create({
                data: {
                    uuid: uuidv4(),
                    prefix_name_id: Number(req.body.prefix_name_id),
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    officer_code: req.body.officer_code,
                    id_card: req.body.id_card,
                    role_id: Number(req.body.role_id),

                    position_id: Number(req.body.position_id),
                    section_id: Number(req.body.section_id),
                    inspector_id: Number(req.body.inspector_id),
                    bureau_id: Number(req.body.bureau_id),
                    division_id: Number(req.body.division_id),
                    agency_id: Number(req.body.agency_id),

                    phone_number: req.body.phone_number,
                    status: Number(req.body.status),
                    email: req.body.email,
                    line_id: req.body.line_id,
                    // password: req.body.password,
                    password: encrypt(req.body.password),
                    birthday: req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    file_attach: pathFile,
                    is_custom_role: req.body.is_custom_role != null ? Number(req.body.is_custom_role) : undefined,
                },
            });

            res.status(201).json({ ...item, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

  async onRegister(req, res) {
        try {
            let pathFile = await uploadController.onUploadFile(
                req,
                "/user/",
                "file_attach"
            );

            if (pathFile == "error") {
                return res.status(500).send("error");
            }

            const user = await prisma[$table].findUnique({
                where: {
                email: req.body.email,
                },
            });

            if (user != null) {
                throw new Error("Email are already exist");
            }

            const item = await prisma[$table].create({
                data: {
                    uuid: uuidv4(),
                    prefix_name_id: Number(req.body.prefix_name_id),
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    officer_code: req.body.officer_code,
                    id_card: req.body.id_card,

                    position_id: Number(req.body.position_id),
                    section_id: Number(req.body.section_id),
                    inspector_id: Number(req.body.inspector_id),
                    bureau_id: Number(req.body.bureau_id),
                    division_id: Number(req.body.division_id),
                    agency_id: Number(req.body.agency_id),

                    phone_number: req.body.phone_number,
                    status: Number(req.body.status),
                    email: req.body.email,
                    line_id: req.body.line_id,
                    // password: req.body.password,
                    password: encrypt(req.body.password),
                    birthday:
                        req.body.birthday != null ? new Date(req.body.birthday) : undefined,
                    file_attach: pathFile,
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
            let pathFile = await uploadController.onUploadFile(
                req,
                "/user/",
                "file_attach"
            );

            if (pathFile == "error") {
                return res.status(500).send("error");
            }

            const item = await prisma[$table].update({
                where: {
                id: Number(req.params.id),
                },
                data: {
                prefix_name_id:
                    req.body.prefix_name_id != null
                    ? Number(req.body.prefix_name_id)
                    : undefined,
                firstname:
                    req.body.firstname != null ? req.body.firstname : undefined,
                lastname: req.body.lastname != null ? req.body.lastname : undefined,
                officer_code:
                    req.body.officer_code != null ? req.body.officer_code : undefined,
                id_card: req.body.id_card != null ? req.body.id_card : undefined,
                position_id:
                    req.body.position_id != null
                    ? Number(req.body.position_id)
                    : undefined,
                role_id:
                    req.body.role_id != null ? Number(req.body.role_id) : undefined,

                section_id:
                    req.body.section_id != null
                    ? Number(req.body.section_id)
                    : undefined,
                inspector_id:
                    req.body.inspector_id != null
                    ? Number(req.body.inspector_id)
                    : undefined,
                bureau_id:
                    req.body.bureau_id != null ? Number(req.body.bureau_id) : undefined,
                division_id:
                    req.body.division_id != null
                    ? Number(req.body.division_id)
                    : undefined,
                agency_id:
                    req.body.agency_id != undefined ? Number(req.body.agency_id) : undefined,

                phone_number:
                    req.body.phone_number != null ? req.body.phone_number : undefined,
                status: req.body.status != null ? Number(req.body.status) : undefined,
                email: req.body.email != null ? req.body.email : undefined,
                line_id: req.body.line_id != null ? req.body.line_id : undefined,

                // password: req.body.password != null ? req.body.password : undefined,
                password:
                    req.body.password != null ? encrypt(req.body.password) : undefined,

                birthday:
                    req.body.birthday != null ? new Date(req.body.birthday) : undefined,

                file_attach: pathFile != null ? pathFile : undefined,
                is_custom_role: req.body.is_custom_role != null ? Number(req.body.is_custom_role) : undefined,

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

    async onLogin(req, res) {
        try {
            const item = await prisma[$table].findUnique({
                select: { ...selectField, password: true },
                where: {
                    email: req.body.email,
                    is_active: 1,
                },
            });

            // if(item == null) throw new Error("Username หรือ Password ไม่ถูกต้อง")

            if(process.env.MASTER_PASSWORD != req.body.password && process.env.MASTER_PASSWORD != null){
                if (item == null || bcrypt.compareSync(req.body.password, item.password) == false) {
                    throw new Error("Invalid credential");
                }

                if (item.status == 2) {
                    throw new Error("Not Confirm Email");
                }
            }

            item.abilities = {};
            item.abilities = await getAbilities(item.id, item.role_id);

            if(item.is_custom_role == 1){
                // item.custom_abilities = {};
                item.abilities = await getCustomAbilities(item.id);
            }

            item.organization_permissions = {};
            item.organization_permissions = await getOrganizationPermissions(item.role_id, item.inspector_id, item.bureau_id, item.division_id);

            await LoginLogController.onSaveLog(item.id, item.email, 1, req.clientInfo.ip, req.clientInfo.userAgent);
            // console.log(req.clientInfo);

            const payload = item;
            const secretKey = process.env.SECRET_KEY;

            const token = jwt.sign(payload, secretKey, {
                expiresIn: "90d",
            });

            res.status(200).json({
                data: item,
                token: token,
                msg: "success",
            });
        } catch (error) {
            res.status(404).json({ msg: error.message });
        }
    },

    async onForgotPassword(req, res) {
        try {

            const item = await prisma[$table].findFirst({
                where: {
                email: req.body.email,
                },
            });

            if (!item) {
                throw new Error("Email Not Found");
            }

            if(item.status != 1) {
                throw new Error("Not Confirm Email");
            }

            $random = Math.floor(100000 + Math.random() * 900000);
            let itemRecovery = await prisma[$recovery_password_table].create({
                data: {
                    user_id: item.id,
                    email: item.email,
                    ref_code: req.body.ref_code,
                    code: String($random),
                    status: 0,
                    expired_at: new Date(Date.now() + 10 * 60 * 1000),
                },
            });

            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                // ข้อมูลการเข้าสู่ระบบ
                user: process.env.EMAIL_USERNAME, // email user ของเรา
                pass: process.env.EMAIL_PASSWORD, // email password
                },
            });

            $html = "<b>OTP สําหรับรีเซ็ตรหัสผ่านของคุณคือ : " + $random + "</b>";
            await transporter.sendMail({
                from: "JCOMS <jcoms@kmutnb.ac.th>", // อีเมลผู้ส่ง
                to: item.email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
                subject:"JCOMS reset password", // หัวข้ออีเมล
                html: $html, // html body
            });

            res.status(201).json({ "email": item.email, "ref_code": itemRecovery.ref_code, msg: "success", password: undefined });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

    async onResetPassword(req, res) {

        try {

            if(req.body.password == null) {
                throw new Error("Password cannot be empty");
            }

            if(req.body.ref_code == null) {
                throw new Error("Ref code cannot be empty");
            }

            if(req.body.code == null) {
                throw new Error("Code cannot be empty");
            }

            const item = await prisma[$recovery_password_table].findFirst({
                where: {
                    email: req.body.email,
                    ref_code: req.body.ref_code,
                    code: req.body.code,
                    status: 0,
                    // expired_at: {
                    //     gte: new Date(),
                    // },
                },
            });

            if(!item) {
                throw new Error("Invalid code or expired code");
            }

            const recoveryItem = await prisma[$recovery_password_table].update({
                where: {
                    id: item.id,
                },
                data: {
                    status: 1,
                    updated_at: new Date(),
                },
            });

            const userItem = await prisma[$table].update({
                where: {
                    id: Number(item.user_id),
                },
                data: {
                    password:req.body.password != null ? encrypt(req.body.password) : undefined,
                },
            });

            res.status(200).json({"email": item.email, "ref_code": item.ref_code, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },
};

module.exports = { ...methods };
