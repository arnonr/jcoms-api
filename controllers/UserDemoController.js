const prisma_config = require('../config/prismaClient');
const prisma = prisma_config;
const uploadController = require("./UploadsController");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const algorithm = "aes-256-cbc"; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
// const { expressjwt: jwt1 } = require("express-jwt");
const $table = "user";


// ค้นหา
const filterData = (req) => {
    let $where = {
        deleted_at: null,
    };

    if (req.query.id) {
        $where["id"] = parseInt(req.query.id);
    }

    if (req.query.username) {
        $where["username"] = req.query.username;
    }

    if (req.query.name) {
        $where["name"] = req.query.name;
    }

    if (req.query.email) {
        $where["email"] = req.query.email;
    }

    if (req.query.tel) {
        $where["tel"] = req.query.tel;
    }

    if (req.query.level) {
        $where["level"] = parseInt(req.query.level);
    }

    if (req.query.secret_confirm_email) {
        $where["secret_confirm_email"] = req.query.secret_confirm_email;
    }

    if (req.query.department_id) {
        $where["department_id"] = parseInt(req.query.department_id);
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
        $orderBy = { created_at: "desc" };
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
    username: true,
    name: true,
    email: true,
    tel: true,
    //   password: true,
    level: true,
    department_id: true,
    is_active: true,
    department: {
        select: {
            id: true,
            code: true,
            name: true,
            is_active: true,
        },
    },
    };

    //Encrypting text
    const encrypt = (text) => {
        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(text, salt);
        return hash;
    };

    // ปรับ Language
    // const checkLanguage = (req) => {
    //   let prismaLang = prisma.$extends({
    //     result: {
    //       news: {
    //         title: {
    //           needs: { title_th: true },
    //           compute(news) {
    //             return req.query.lang && req.query.lang == "en"
    //               ? news.title_en
    //               : news.title_th;
    //           },
    //         },
    //         detail: {
    //           needs: { detail_th: true },
    //           compute(news) {
    //             return req.query.lang && req.query.lang == "en"
    //               ? news.detail_en
    //               : news.detail_th;
    //           },
    //         },
    //       },
    //       news_type: {
    //         name: {
    //           needs: { name_th: true },
    //           compute(news_type) {
    //             return req.query.lang && req.query.lang == "en"
    //               ? news_type.name_en
    //               : news_type.name_th;
    //           },
    //         },
    //       },
    //     },
    //   });

    //   return prismaLang;
    // };

    const methods = {
    // ค้นหาทั้งหมด
    async onGetAll(req, res) {
        try {
        let $where = filterData(req);
        let other = await countDataAndOrder(req, $where);

        const item = await prisma.user.findMany({
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
        const item = await prisma.user.findUnique({
            select: selectField,
            where: {
            id: Number(req.params.id),
            },
        });
        res.status(200).json({ data: item, msg: "success" });
        } catch (error) {
        res.status(404).json({ msg: error.message });
        }
    },

    // สร้าง
    async onCreate(req, res) {
        try {
        const item = await prisma.user.create({
            data: {
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
            tel: req.body.tel,
            level: Number(req.body.level),
            department_id: Number(req.body.department_id),
            // password: req.body.password,
            is_active: Number(req.body.is_active),
            created_by: "arnonr",
            updated_by: "arnonr",
            },
        });

        // const profile = await prisma.profile.create({
        //   data: {
        //     user_id: Number(item.id),
        //     prefix: req.body.prefix,
        //     firstname: req.body.firstname,
        //     surname: req.body.surname,
        //     is_publish: Number(req.body.is_publish),
        //     contact_address: req.body.contact_address,
        //     invoice_address: req.body.invoice_address,
        //     invoice_name: req.body.invoice_name,
        //     member_status: Number(req.body.member_status),
        //     organization: req.body.organization,
        //     phone: req.body.phone,
        //     tax_id: req.body.tax_id,
        //     created_by: "arnonr",
        //     updated_by: "arnonr",
        //   },
        // });

        res.status(201).json({ ...item, ...profile, msg: "success" });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    // แก้ไข
    async onUpdate(req, res) {
        try {
        const item = await prisma.user.update({
            where: {
            id: Number(req.params.id),
            },

            data: {
            username: req.body.username != null ? req.body.username : undefined,
            name: req.body.name != null ? req.body.name : undefined,
            email: req.body.email != null ? req.body.email : undefined,
            tel: req.body.tel != null ? req.body.tel : undefined,
            level:req.body.level != null ? Number(req.body.level) : undefined,
            department_id:req.body.department_id != null ? Number(req.body.department_id) : undefined,
            is_active:req.body.is_active != null ? Number(req.body.is_active) : undefined,
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
        const item = await prisma.user.update({
            where: {
            id: Number(req.params.id),
            },
            data: {
            deleted_at: new Date().toISOString(),
            },
        });

        res.status(200).json(item);
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onLogin(req, res) {
        try {
        const item = await prisma.user.findUnique({
            select: { ...selectField, password: true },
            where: {
            email: req.body.email,
            //   password: req.body.password,
            },
        });

        if (item) {
            if (item.status == 1) {
            throw new Error("Not Confirm Email");
            }

            if (bcrypt.compareSync(req.body.password, item.password) == false) {
            throw new Error("Password Wrong");
            }

            const payload = item;
            const secretKey = process.env.SECRET_KEY;

            const token = jwt.sign(payload, secretKey, {
            expiresIn: "90d",
            });

            res.status(200).json({ ...item, token: token });
        } else {
            throw new Error("Invalid credential");
        }
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onRegister(req, res) {
        try {
        const checkItem = await prisma.user.findUnique({
            where: {
            email: req.body.email,
            },
        });

        if (checkItem) {
            throw new Error("email is duplicate");
        }

        const item = await prisma.user.create({
            data: {
            group_id: Number(req.body.group_id),
            email: req.body.email,
            password: encrypt(req.body.password),
            status: Number(req.body.status),
            is_publish: Number(req.body.is_publish),
            secret_confirm_email: crypto.randomBytes(20).toString("hex"),
            created_by: "arnonr",
            updated_by: "arnonr",
            },
        });

        // const profile = await prisma.profile.create({
        //   data: {
        //     user_id: Number(item.id),
        //     prefix: req.body.prefix,
        //     firstname: req.body.firstname,
        //     surname: req.body.surname,
        //     is_publish: Number(req.body.is_publish),
        //     contact_address: req.body.contact_address,
        //     invoice_address: req.body.invoice_address,
        //     invoice_name: req.body.invoice_name,
        //     member_status: Number(req.body.member_status),
        //     organization: req.body.organization,
        //     phone: req.body.phone,
        //     tax_id: req.body.tax_id,
        //     created_by: "arnonr",
        //     updated_by: "arnonr",
        //   },
        // });

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

        await transporter.sendMail({
            from: "ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // อีเมลผู้ส่ง
            to: item.email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            subject:
            "ยืนยันการสมัครสมาชิก ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // หัวข้ออีเมล
            html:
            "<b>ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์</b><br> โปรดยืนยันการสมัครสมาชิก : <a href='" +
            process.env.PATH_CLIENT +
            "confirm-email?id=" +
            item.id +
            "&email=" +
            item.email +
            "&secret_confirm_email=" +
            item.secret_confirm_email +
            "'>คลิก</a>", // html body
        });

        res.status(201).json({ ...item, ...profile, msg: "success" });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onConfirmEmail(req, res) {
        try {
        const item = await prisma.user.findFirst({
            where: {
            id: Number(req.body.id),
            email: req.body.email,
            secret_confirm_email: req.body.secret_confirm_email,
            },
        });

        if (item) {
            await prisma.user.update({
            where: {
                id: item.id,
            },
            data: {
                status: 2,
            },
            });
        } else {
            throw new Error("Key is Wrong");
        }

        res.status(201).json({ ...item, msg: "success" });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onResendConfirmEmail(req, res) {
        try {
        const item = await prisma.user.findFirst({
            where: {
            email: req.body.email,
            },
        });

        if (!item) {
            throw new Error("Email Not Found");
        }

        let itemUpdate = await prisma.user.update({
            where: {
            id: item.id,
            },
            data: {
            secret_confirm_email: crypto.randomBytes(20).toString("hex"),
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

        await transporter.sendMail({
            from: "ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // อีเมลผู้ส่ง
            to: itemUpdate.email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            subject:
            "ยืนยันการสมัครสมาชิก ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // หัวข้ออีเมล
            html:
            "<b>ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์</b><br> โปรดยืนยันการสมัครสมาชิก : <a href='" +
            process.env.PATH_CLIENT +
            "confirm-email?id=" +
            itemUpdate.id +
            "&email=" +
            itemUpdate.email +
            "&secret_confirm_email=" +
            itemUpdate.secret_confirm_email +
            "'>คลิก</a>", // html body
        });

        res.status(201).json({ ...item, msg: "success", password: undefined });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onResendResetPassword(req, res) {
        try {
        const item = await prisma.user.findFirst({
            where: {
            email: req.body.email,
            },
        });

        if (!item) {
            throw new Error("Email Not Found");
        }

        let itemUpdate = await prisma.user.update({
            where: {
            id: item.id,
            },
            data: {
            secret_confirm_email: crypto.randomBytes(20).toString("hex"),
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

        await transporter.sendMail({
            from: "ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // อีเมลผู้ส่ง
            to: itemUpdate.email, // อีเมลผู้รับ สามารถกำหนดได้มากกว่า 1 อีเมล โดยขั้นด้วย ,(Comma)
            subject:
            "ยืนยันการรีเซ็ตรหัสผ่าน ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์", // หัวข้ออีเมล
            html:
            "<b>ศูนย์เครื่องมือวิทยาศาสตร์และคอมพิวเตอร์สมรรถนะสูง คณะวิทยาศาสตร์ประยุกต์</b><br> โปรดรีเซ็ตรหัสผ่าน : <a href='" +
            process.env.PATH_CLIENT +
            "reset-password?id=" +
            itemUpdate.id +
            "&email=" +
            itemUpdate.email +
            "&secret_confirm_email=" +
            itemUpdate.secret_confirm_email +
            "'>คลิก</a>", // html body
        });

        res.status(201).json({ ...item, msg: "success", password: undefined });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },

    async onResetPassword(req, res) {
        try {
        const item = await prisma.user.update({
            where: {
            id: Number(req.body.id),
            },
            data: {
            password:
                req.body.password != null ? encrypt(req.body.password) : undefined,
            updated_by: "arnonr",
            },
        });

        res.status(200).json({ ...item, msg: "success" });
        } catch (error) {
        res.status(400).json({ msg: error.message });
        }
    },
};

module.exports = { ...methods };
