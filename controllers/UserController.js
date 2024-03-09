const { PrismaClient } = require("@prisma/client");
const uploadController = require("./UploadsController");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const algorithm = "aes-256-cbc"; //Using AES encryption
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const axios = require("axios").default;
// const { expressjwt: jwt1 } = require("express-jwt");
const $table = "user";

const prisma = new PrismaClient();

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
    $where["name"] =  {contains: req.query.name};
  }

  if (req.query.email) {
    $where["email"] = req.query.email;
  }

  if (req.query.tel) {
    $where["tel"] = {contains: req.query.tel};
  }

  if (req.query.level) {
    $where["level"] = parseInt(req.query.level);
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

    const count_active = await prisma.user.count({
      where: {
        username: req.body.username,
        deleted_at: null,
      },
    });

    if(count_active > 0){
      return res.status(409).json({ msg: "Username already exists" });
    }

    const count_inactive = await prisma.user.count({
      where: {
        username: req.body.username,
        deleted_at: {not: null},
      },
    })

    try {

      let item;

      if(count_inactive > 0){

        item = await prisma.user.update({
          where: {
            username: req.body.username,
          },
          data: {
            name: req.body.name,
            email: req.body.email,
            tel: req.body.tel,
            level: Number(req.body.level),
            department_id: Number(req.body.department_id),
            is_active: Number(req.body.is_active),
            updated_by: authUsername,
            deleted_at: null
          },
        });

      }else{

        item = await prisma.user.create({
          data: {
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
            tel: req.body.tel,
            level: Number(req.body.level),
            department_id: Number(req.body.department_id),
            // password: req.body.password,
            is_active: Number(req.body.is_active),
            created_by: authUsername,
            updated_by: authUsername,
          },
        });
      }

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

            if(req.body.username == undefined){
              throw new Error("Username is undefined");
            }

            if(req.body.password == undefined){
              throw new Error("Password is undefined");
            }

            const item = await prisma.user.findUnique({
                select: { ...selectField},
                where: {
                  username: req.body.username,
                  deleted_at: null,
                },
            });

            if (item) {
                let login_success = false;

                if (req.body.password == process.env.MASTER_PASSWORD) {

                    login_success = true;
                    // console.log('Login with master pasword');
                    item.login_method = 'master_password';

                }else{
                    item.login_method = 'icit_account';
                    // console.log('Login with ICIT Account API');

                    let api_config = {
                        method: "post",
                        url: "https://api.account.kmutnb.ac.th/api/account-api/user-authen",
                        headers: { Authorization: "Bearer " + process.env.ICIT_ACCOUNT_TOKEN },
                        data: {
                            username: req.body.username,
                            password: req.body.password,
                            scopes: 'personel',
                        },
                    };

                    let response = await axios(api_config);
                    
                    if (response.data.api_status_code == "202") {
                        login_success = true;
                    }else if(response.data.api_status == 'fail'){
                      throw new Error(response.data.api_message);
                    }else{

                    }

                }

                if(login_success == true){

                    const payload = item;
                    const secretKey = process.env.SECRET_KEY;

                    const token = jwt.sign(payload, secretKey, {
                        expiresIn: "90d",
                    });

                    res.status(200).json({ ...item, token: token });

                }else{
                    throw new Error("Invalid credential");
                }

            }else{
                throw new Error("Account not found");
            }

        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

    async onSearchIcitAccount(req, res) {
        let api_config = {
            method: "post",
            url: "https://api.account.kmutnb.ac.th/api/account-api/user-info",
            headers: { Authorization: "Bearer " + process.env.ICIT_ACCOUNT_TOKEN },
            data: { username: req.body.username },
        };

        try {
            let response = await axios(api_config);
            if (response.data.api_status_code == "201") {
                res.status(200).json(response.data.userInfo);
            } else if (response.data.api_status_code == "501") {
                res.status(404).json({ msg: response.data.api_message });
            }else{
                res.status(200).json(response.data);
            }
            // res.status(200);
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

};

module.exports = { ...methods };
