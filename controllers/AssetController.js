const { PrismaClient } = require("@prisma/client");
const uploadController = require("./UploadsController");
// const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const locale = require("dayjs/locale/th");
const buddhistEra = require("dayjs/plugin/buddhistEra");
dayjs.extend(buddhistEra);

const $table = "asset";

const prisma = new PrismaClient().$extends({
  result: {
    asset: {
      cover_photo: {
        needs: { cover_photo: true },
        compute(asset) {
          let cover_photo = null;
          if (asset.cover_photo != null) {
            cover_photo = process.env.PATH_UPLOAD + asset.cover_photo;
          }
          return cover_photo;
        },
      },
      // expire_date_1: {
      //     compute(asset) {
      //         if(asset.approved_date == null || asset.warranty_day_1 == null)
      //             return null;

      //         let expire_date = new Date(asset.approved_date);
      //         expire_date.setDate(expire_date.getDate() + asset.warranty_day_1);

      //         return expire_date;
      //     },
      // },
      // expire_date_2: {
      //     compute(asset) {
      //         if(asset.approved_date == null || asset.warranty_day_2 == null)
      //             return null;

      //         let expire_date = new Date(asset.approved_date);
      //         expire_date.setDate(expire_date.getDate() + asset.warranty_day_2);

      //         return expire_date;
      //     },
      // },
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

  if (req.query.asset_code) {
    $where["asset_code"] = {
      contains: req.query.asset_code,
      //   mode: "insensitive",
    };
  }

  if (req.query.asset_name) {
    $where["asset_name"] = {
      contains: req.query.asset_name,
      //   mode: "insensitive",
    };
  }
  // Number
  if (req.query.input_year) {
    $where["input_year"] = parseInt(req.query.input_year);
  }

  if (req.query.inspection_date) {
    $where["inspection_date"] = {
      contains: req.query.inspection_date,
      //   mode: "insensitive",
    };
  }

  if (req.query.approved_date) {
    $where["approved_date"] = {
      contains: req.query.approved_date,
      //   mode: "insensitive",
    };
  }

  if (req.query.asset_detail) {
    $where["asset_detail"] = {
      contains: req.query.asset_detail,
    };
  }

  if (req.query.install_location) {
    $where["install_location"] = {
      contains: req.query.install_location,
    };
  }

  if (req.query.vendor) {
    $where["vendor"] = {
      contains: req.query.vendor,
      //   mode: "insensitive",
    };
  }

  if (req.query.asset_type_id) {
    $where["asset_type_id"] = parseInt(req.query.asset_type_id);
  }

  if (req.query.brand) {
    $where["brand"] = {
      contains: req.query.brand,
      //   mode: "insensitive",
    };
  }

  if (req.query.model) {
    $where["model"] = {
      contains: req.query.model,
      //   mode: "insensitive",
    };
  }

  if (req.query.serial_number) {
    $where["serial_number"] = {
      contains: req.query.serial_number,
      //   mode: "insensitive",
    };
  }

  if (req.query.price) {
    $where["price"] = Number(req.query.price);
  }

  if (req.query.budget_type_id) {
    $where["budget_type_id"] = parseInt(req.query.budget_type_id);
  }

  if (req.query.is_transfer) {
    $where["is_transfer"] = parseInt(req.query.is_transfer);
  }

  if (req.query.transfer_from) {
    $where["transfer_from"] = {
      contains: req.query.transfer_from,
      //   mode: "insensitive",
    };
  }

  if (req.query.location) {
    $where["location"] = {
      contains: req.query.location,
      //   mode: "insensitive",
    };
  }

  if (req.query.department_id) {
    $where["department_id"] = parseInt(req.query.department_id);
  }

  if (req.query.drawer_name) {
    $where["drawer_name"] = {
      contains: req.query.drawer_name,
      //   mode: "insensitive",
    };
  }

  if (req.query.holder_name) {
    $where["holder_name"] = {
      contains: req.query.holder_name,
      //   mode: "insensitive",
    };
  }

  if (req.query.warranty_type_1) {
    $where["warranty_type_1"] = {
      contains: req.query.warranty_type_1,
      //   mode: "insensitive",
    };
  }

  if (req.query.warranty_day_1) {
    $where["warranty_day_1"] = parseInt(req.query.warranty_day_1);
  }

  if (req.query.warranty_type_2) {
    $where["warranty_type_2"] = {
      contains: req.query.warranty_type_2,
      //   mode: "insensitive",
    };
  }

  if (req.query.warranty_day_2) {
    $where["warranty_day_2"] = parseInt(req.query.warranty_day_2);
  }

  if (req.query.warranty_type_3) {
    $where["warranty_type_3"] = {
      contains: req.query.warranty_type_3,
      //   mode: "insensitive",
    };
  }

  if (req.query.warranty_day_3) {
    $where["warranty_day_3"] = parseInt(req.query.warranty_day_3);
  }

  if (req.query.cover_photo) {
    $where["cover_photo"] = {
      contains: req.query.cover_photo,
      //   mode: "insensitive",
    };
  }

  if (req.query.asset_status) {
    $where["asset_status"] = parseInt(req.query.asset_status);
  }

  if (req.query.cancel_type) {
    $where["cancel_type"] = parseInt(req.query.cancel_type);
  }

  if (req.query.cancel_date) {
    $where["cancel_date"] = {
      contains: req.query.cancel_date,
      //   mode: "insensitive",
    };
  }

  if (req.query.cancel_comment) {
    $where["cancel_comment"] = {
      contains: req.query.cancel_comment,
      //   mode: "insensitive",
    };
  }

  if (req.query.transfer_to) {
    $where["transfer_to"] = {
      contains: req.query.transfer_to,
      //   mode: "insensitive",
    };
  }

  if (req.query.transfer_to_department) {
    $where["transfer_to_department"] = {
      contains: req.query.transfer_to_department,
      //   mode: "insensitive",
    };
  }

  if (req.query.comment) {
    $where["comment"] = {
      contains: req.query.comment,
      //   mode: "insensitive",
    };
  }

  if (req.query.is_active) {
    $where["is_active"] = parseInt(req.query.is_active);
  }

  if (req.query.expire_day) {
    let date = new Date();
    date.setDate(date.getDate() + Number(req.query.expire_day));
    $where["OR"] = [
      {
        expiry_date_1: {
          lte: date,
          gte: new Date(),
        },
      },
      {
        expiry_date_2: {
          lte: date,
          gte: new Date(),
        },
      },
      {
        expiry_date_3: {
          lte: date,
          gte: new Date(),
        },
      },
    ];
  }

  if (req.query.created_at_from && req.query.created_at_to) {
    let date_from = new Date(
      req.query.created_at_from + "T00:00:00.000+0000"
    ).toISOString();
    let date_to = new Date(
      req.query.created_at_to + "T23:59:59.000+0000"
    ).toISOString();

    $where["AND"] = [
      {
        created_at: {
          gte: date_from,
        },
      },
      {
        created_at: {
          lte: date_to,
        },
      },
    ];
  } else if (req.query.created_at_from) {
    let date_from = new Date(
      req.query.created_at_from + "T00:00:00.000+0000"
    ).toISOString();
    $where["created_at"] = {
      gte: date_from,
    };
  } else if (req.query.created_at_to) {
    let date_to = new Date(
      req.query.created_at_to + "T23:59:59.000+0000"
    ).toISOString();
    $where["created_at"] = {
      lte: date_to,
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

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
  // expire_date_1: true,
  // expire_date_2: true,
  id: true,
  asset_code: true,
  asset_name: true,
  input_year: true,
  inspection_date: true,
  approved_date: true,
  asset_detail: true,
  install_location: true,
  vendor: true,
  asset_type_id: true,
  brand: true,
  model: true,
  serial_number: true,
  price: true,
  budget_type_id: true,
  is_transfer: true,
  transfer_from: true,
  location: true,
  department_id: true,
  drawer_name: true,
  holder_name: true,
  warranty_type_1: true,
  warranty_day_1: true,
  warranty_type_2: true,
  warranty_day_2: true,
  warranty_type_3: true,
  warranty_day_3: true,
  cover_photo: true,
  asset_status: true,
  cancel_type: true,
  cancel_date: true,
  cancel_comment: true,
  transfer_to: true,
  transfer_to_department: true,
  comment: true,
  expiry_date_1: true,
  expiry_date_2: true,
  expiry_date_3: true,
  created_by: true,
  created_at: true,
  updated_by: true,
  updated_at: true,
  is_active: true,
  asset_type: {
    select: {
      id: true,
      code: true,
      name: true,
      is_active: true,
    },
  },
  budget_type: {
    select: {
      id: true,
      code: true,
      name: true,
      is_active: true,
      category: true,
    },
  },
  department: {
    select: {
      id: true,
      code: true,
      name: true,
      is_active: true,
    },
  },
  asset_photo: {
    select: {
      id: true,
      asset_photo_file: true,
      secret_key: true,
      is_active: true,
    },
  },
//   repair_history: {
//     select: {
//       id: true,
//       asset_id: true,
//       repair_date: true,
//       description: true,
//       price: true,
//       status: true,
//       reject_comment: true,
//       approved_at: true,
//       approved_by: true,
//       is_active: true,
//       created_at: true,
//       created_by: true,
//       approved_user:{
//         select:{
//           name: true,
//         }
//       },
//       created_user:{
//         select:{
//           name: true,
//         }
//       }
//     },
//   },
//   holder_history: {
//     select: {
//       id: true,
//       asset_id: true,
//       holder_name: true,
//       status: true,
//       approved_at: true,
//       approved_by: true,
//       is_active: true,
//       approved_user:{
//         select:{
//           name: true,
//         }
//       },
//       created_user:{
//         select:{
//           name: true,
//         }
//       }
//     },
//   },
//   asset_location_history: {
//     select: {
//       id: true,
//       asset_id: true,
//       location: true,
//       status: true,
//       approved_at: true,
//       approved_by: true,
//       is_active: true,
//       approved_user:{
//         select:{
//           name: true,
//         }
//       },
//       created_user:{
//         select:{
//           name: true,
//         }
//       }
//     },
//   },
};

// ฟิลด์ที่ต้องการสำหรับ Report
const selectFieldReport = {
  id: true,
  asset_code: true,
  input_year: true,
  // inspection_date: true,
  // approved_date: true,
  // asset_detail: true,
  // install_location: true,
  // vendor: true,
  asset_type_id: true,
  // brand: true,
  // model: true,
  // serial_number: true,
  // price: true,
  budget_type_id: true,
  // is_transfer: true,
  // transfer_from: true,
  // location: true,
  department_id: true,
  // drawer_name: true,
  // holder_name: true,
  // warranty_type_1: true,
  // warranty_day_1: true,
  // warranty_type_2: true,
  // warranty_day_2: true,
  // warranty_type_3: true,
  // warranty_day_3: true,
  // cover_photo: true,
  asset_status: true,
  // cancel_type: true,
  // cancel_date: true,
  // cancel_comment: true,
  // transfer_to: true,
  // transfer_to_department: true,
  // comment: true,
  // expiry_date_1: true,
  // expiry_date_2: true,
  // expiry_date_3: true,
  // created_by: true,
  // created_at: true,
  // updated_by: true,
  // updated_at: true,
  // is_active: true,
  // asset_type: {
  //   select: {
  //     id: true,
  //     code: true,
  //     name: true,
  //     is_active: true,
  //   },
  // },
  budget_type: {
    select: {
      id: true,
      code: true,
      name: true,
      is_active: true,
      category: true,
    },
  },
  // department: {
  //   select: {
  //     id: true,
  //     code: true,
  //     name: true,
  //     is_active: true,
  //   },
  // },
  // asset_photo: {
  //   select: {
  //     id: true,
  //     asset_photo_file: true,
  //     secret_key: true,
  //     is_active: true,
  //   },
  // },
  // repair_history: {
  //   select: {
  //     id: true,
  //     asset_id: true,
  //     repair_date: true,
  //     description: true,
  //     price: true,
  //     status: true,
  //     reject_comment: true,
  //     approved_at: true,
  //     approved_by: true,
  //     is_active: true,
  //   },
  // },
  // holder_history: {
  //   select: {
  //     id: true,
  //     asset_id: true,
  //     holder_name: true,
  //     status: true,
  //     approved_at: true,
  //     approved_by: true,
  //     is_active: true,
  //   },
  // },
  // asset_location_history: {
  //   select: {
  //     id: true,
  //     asset_id: true,
  //     location: true,
  //     status: true,
  //     approved_at: true,
  //     approved_by: true,
  //     is_active: true,
  //   },
  // },
};

const selectFieldExport = {
  id: true,
  asset_code: true,
  asset_name: true,
  input_year: true,
  asset_detail: true,
  asset_type_id: true,
  inspection_date: true,
  price: true,
  vendor: true,
  budget_type_id: true,
  department_id: true,
  warranty_type_1: true,
  warranty_day_1: true,
  warranty_type_2: true,
  warranty_day_2: true,
  warranty_type_3: true,
  warranty_day_3: true,
  asset_type: {
    select: {
      name: true,
    },
  },
  budget_type: {
    select: {
      name: true,
      category: true,
    },
  },
  department: {
    select: {
      code: true,
      name: true,
    },
  },
};

const autoCreateHolderHistory = async (asset_id, holder_name, username) => {
  if (holder_name == null) return null;

  const countResult = await prisma.holder_history.count({
    where: {
      asset_id: asset_id,
    },
  });

  if (countResult == 0) {
    const item = await prisma.holder_history.create({
      data: {
        asset_id: asset_id,
        holder_name: holder_name,
        status: 1,
        is_notice: 0,
        approved_at: new Date(),
        approved_by: username,
        is_active: 1,
        created_by: username,
        updated_by: username,
      },
    });
  }
};

const getBudgetTypeId = async (code) => {
  if (code == undefined) return null;

  const item = await prisma.budget_type.findFirst({
    select: { id: true },
    where: {
      code: code.toString(),
    },
  });

  if (item) {
    return item.id;
  }
  return null;
};

const getAssetTypeId = async (code) => {
  if (code == undefined) return null;

  const item = await prisma.asset_type.findFirst({
    select: { id: true },
    where: {
      code: code.toString(),
    },
  });

  if (item) {
    return item.id;
  }
  return null;
};

const getDepartmentId = async (code) => {
  if (code == undefined) return null;

  const item = await prisma.department.findFirst({
    select: { id: true },
    where: {
      code: code.toString(),
    },
  });

  if (item) {
    return item.id;
  }
  return null;
};

const autoCreateLocationHistory = async (asset_id, location, username) => {
  if (location == null) return null;

  const countResult = await prisma.asset_location_history.count({
    where: {
      asset_id: asset_id,
    },
  });

  if (countResult == 0) {
    const item = await prisma.asset_location_history.create({
      data: {
        asset_id: asset_id,
        location: location,
        status: 1,
        is_notice: 0,
        approved_at: new Date(),
        approved_by: username,
        is_active: 1,
        created_by: username,
        updated_by: username,
      },
    });
  }
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
    if (req.headers.authorization !== undefined) {
      const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
      authUsername = decoded.username;
    }

    try {
      let pathFile = await uploadController.onUploadFile(
        req,
        "/images/asset/",
        "cover_photo"
      );

      if (pathFile == "error") {
        return res.status(500).send("error");
      }

      let expiry_date_1 = null;
      let expiry_date_2 = null;
      let expiry_date_3 = null;

      if (req.body.approved_date != null && req.body.warranty_day_1 != null) {
        let expire_date1 = new Date(req.body.approved_date);
        expire_date1.setDate(
          expire_date1.getDate() + Number(req.body.warranty_day_1)
        );
        expiry_date_1 = expire_date1;
      }

      if (req.body.approved_date != null && req.body.warranty_day_2 != null) {
        let expire_date2 = new Date(req.body.approved_date);
        expire_date2.setDate(
          expire_date2.getDate() + Number(req.body.warranty_day_2)
        );
        expiry_date_2 = expire_date2;
      }

      if (req.body.approved_date != null && req.body.warranty_day_3 != null) {
        let expire_date3 = new Date(req.body.approved_date);
        expire_date3.setDate(
          expire_date3.getDate() + Number(req.body.warranty_day_3)
        );
        expiry_date_3 = expire_date3;
      }

      const item = await prisma[$table].create({
        data: {
          asset_code: req.body.asset_code,
          asset_name: req.body.asset_name,
          input_year: Number(req.body.input_year),
          inspection_date:
            req.body.inspection_date != null
              ? new Date(req.body.inspection_date)
              : undefined,
          approved_date:
            req.body.approved_date != null
              ? new Date(req.body.approved_date)
              : undefined,
          vendor: req.body.vendor,
          asset_detail: req.body.asset_detail,
          install_location: req.body.install_location,
          asset_type_id: Number(req.body.asset_type_id),
          brand: req.body.brand,
          model: req.body.model,
          serial_number: req.body.serial_number,
          price: Number(req.body.price),
          budget_type_id: Number(req.body.budget_type_id),
          is_transfer: Number(req.body.is_transfer),
          transfer_from: req.body.transfer_from,
          location: req.body.location,
          department_id: Number(req.body.department_id),
          drawer_name: req.body.drawer_name,
          holder_name: req.body.holder_name,
          warranty_type_1: req.body.warranty_type_1,
          warranty_day_1: Number(req.body.warranty_day_1),
          warranty_type_2: req.body.warranty_type_2,
          warranty_day_2: Number(req.body.warranty_day_2),
          warranty_type_3: req.body.warranty_type_3,
          warranty_day_3: Number(req.body.warranty_day_3),
          cover_photo: pathFile,
          asset_status: Number(req.body.asset_status),
          cancel_type: Number(req.body.cancel_type),
          cancel_date:
            req.body.cancel_date != null
              ? new Date(req.body.cancel_date)
              : undefined,
          cancel_comment: req.body.cancel_comment,
          transfer_to: req.body.transfer_to,
          transfer_to_department: req.body.transfer_to_department,
          comment: req.body.comment,

          is_active: Number(req.body.is_active),
          created_by: authUsername,
          updated_by: authUsername,

          expiry_date_1: expiry_date_1 != null ? expiry_date_1 : undefined,
          expiry_date_2: expiry_date_2 != null ? expiry_date_2 : undefined,
          expiry_date_3: expiry_date_3 != null ? expiry_date_3 : undefined,
        },
      });

      await prisma.asset_photo.updateMany({
        where: {
          secret_key: req.body.secret_key,
        },
        data: {
          asset_id: item.id,
        },
      });

      await autoCreateLocationHistory(item.id, req.body.location, authUsername);
      await autoCreateHolderHistory(
        item.id,
        req.body.holder_name,
        authUsername
      );

      res.status(201).json({ ...item, msg: "success" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  // แก้ไข
  async onUpdate(req, res) {
    let authUsername = null;
    if (req.headers.authorization !== undefined) {
      const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
      authUsername = decoded.username;
    }

    try {
      let pathFile = await uploadController.onUploadFile(
        req,
        "/images/asset/",
        "cover_photo"
      );

      if (pathFile == "error") {
        return res.status(500).send("error");
      }

      let expiry_date_1 = null;
      let expiry_date_2 = null;
      let expiry_date_3 = null;

      if (req.body.approved_date != null && req.body.warranty_day_1 != null) {
        let expire_date1 = new Date(req.body.approved_date);
        expire_date1.setDate(
          expire_date1.getDate() + Number(req.body.warranty_day_1)
        );
        expiry_date_1 = expire_date1;
      }

      if (req.body.approved_date != null && req.body.warranty_day_2 != null) {
        let expire_date2 = new Date(req.body.approved_date);
        expire_date2.setDate(
          expire_date2.getDate() + Number(req.body.warranty_day_2)
        );
        expiry_date_2 = expire_date2;
      }

      if (req.body.approved_date != null && req.body.warranty_day_3 != null) {
        let expire_date3 = new Date(req.body.approved_date);
        expire_date3.setDate(
          expire_date3.getDate() + Number(req.body.warranty_day_3)
        );
        expiry_date_3 = expire_date3;
      }

      const item = await prisma[$table].update({
        where: {
          id: Number(req.params.id),
        },

        data: {
          asset_code:
            req.body.asset_code != null ? req.body.asset_code : undefined,
          asset_name:
            req.body.asset_name != null ? req.body.asset_name : undefined,
          input_year:
            req.body.input_year != null
              ? Number(req.body.input_year)
              : undefined,
          inspection_date:
            req.body.inspection_date != null
              ? new Date(req.body.inspection_date)
              : undefined,
          approved_date:
            req.body.approved_date != null
              ? new Date(req.body.approved_date)
              : undefined,
          asset_detail:
            req.body.asset_detail != null ? req.body.asset_detail : undefined,
          install_location:
            req.body.install_location != null
              ? req.body.install_location
              : undefined,
          vendor: req.body.vendor != null ? req.body.vendor : undefined,
          asset_type_id:
            req.body.asset_type_id != null
              ? Number(req.body.asset_type_id)
              : undefined,
          brand: req.body.brand != null ? req.body.brand : undefined,
          model: req.body.model != null ? req.body.model : undefined,
          serial_number:
            req.body.serial_number != null ? req.body.serial_number : undefined,
          price: req.body.price != null ? Number(req.body.price) : undefined,
          budget_type_id:
            req.body.budget_type_id != null
              ? Number(req.body.budget_type_id)
              : undefined,
          is_transfer:
            req.body.is_transfer != null
              ? Number(req.body.is_transfer)
              : undefined,
          transfer_from:
            req.body.transfer_from != null ? req.body.transfer_from : undefined,
          location: req.body.location != null ? req.body.location : undefined,
          department_id:
            req.body.department_id != null
              ? Number(req.body.department_id)
              : undefined,
          drawer_name:
            req.body.drawer_name != null ? req.body.drawer_name : undefined,
          holder_name:
            req.body.holder_name != null ? req.body.holder_name : undefined,
          warranty_type_1:
            req.body.warranty_type_1 != null
              ? req.body.warranty_type_1
              : undefined,
          warranty_day_1:
            req.body.warranty_day_1 != null
              ? Number(req.body.warranty_day_1)
              : undefined,

          warranty_type_2:
            req.body.warranty_type_2 != null
              ? req.body.warranty_type_2
              : undefined,
          warranty_day_2:
            req.body.warranty_day_2 != null
              ? Number(req.body.warranty_day_2)
              : undefined,

          warranty_type_3:
            req.body.warranty_type_3 != null
              ? req.body.warranty_type_3
              : undefined,
          warranty_day_3:
            req.body.warranty_day_3 != null
              ? Number(req.body.warranty_day_3)
              : undefined,

          asset_status:
            req.body.asset_status != null
              ? Number(req.body.asset_status)
              : undefined,
          cancel_type:
            req.body.cancel_type != null
              ? Number(req.body.cancel_type)
              : undefined,
          cancel_date:
            req.body.cancel_date != null
              ? new Date(req.body.cancel_date)
              : undefined,
          cancel_comment:
            req.body.cancel_comment != null
              ? req.body.cancel_comment
              : undefined,
          transfer_to:
            req.body.transfer_to != null ? req.body.transfer_to : undefined,
          transfer_to_department:
            req.body.transfer_to_department != null
              ? req.body.transfer_to_department
              : undefined,
          comment: req.body.comment != null ? req.body.comment : undefined,

          is_active:
            req.body.is_active != null ? Number(req.body.is_active) : undefined,
          updated_by: "arnonr",
          cover_photo: pathFile != null ? pathFile : undefined,
          expiry_date_1: expiry_date_1 != null ? expiry_date_1 : undefined,
          expiry_date_2: expiry_date_2 != null ? expiry_date_2 : undefined,
          expiry_date_3: expiry_date_3 != null ? expiry_date_3 : undefined,
          updated_by: authUsername,
          updated_at: new Date(),
        },
      });

      await prisma.asset_photo.updateMany({
        where: {
          secret_key: req.body.secret_key,
        },
        data: {
          asset_id: item.id,
        },
      });

      await autoCreateLocationHistory(item.id, req.body.location, authUsername);
      await autoCreateHolderHistory(
        item.id,
        req.body.holder_name,
        authUsername
      );

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

  async onImportAsset(req, res) {
    // console.log(req.body);
    let authUsername = null;
    if (req.headers.authorization !== undefined) {
      const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
      authUsername = decoded.username;
    }

    let is_import = Number(req.body.is_import); /* 1=import,   2=ตัดโอน*/

    try {
      let import_result = [];

      for (var key in req.body.data) {
        let asset_code = req.body.data[key]["asset_code"];

        let asset_name =
          req.body.data[key]["asset_name"] != null
            ? req.body.data[key]["asset_name"]
            : undefined;

        let input_year =
          req.body.data[key]["input_year"] != null
            ? Number(req.body.data[key]["input_year"])
            : undefined;

        let inspection_date =
          req.body.data[key]["inspection_date"] != null
            ? new Date(req.body.data[key]["inspection_date"])
            : undefined;

        let approved_date =
          req.body.data[key]["approved_date"] != null
            ? new Date(req.body.data[key]["approved_date"])
            : undefined;

        let vendor =
          req.body.data[key]["vendor"] != null
            ? req.body.data[key]["vendor"]
            : undefined;

        let asset_detail =
          req.body.data[key]["asset_detail"] != null
            ? req.body.data[key]["asset_detail"]
            : undefined;

        let install_location =
          req.body.data[key]["install_location"] != null
            ? req.body.data[key]["install_location"]
            : undefined;

        // let asset_type_id = req.body.data[key]['asset_type_id'] != null ? Number(req.body.data[key]['asset_type_id']) : undefined;

        let asset_type_code =
          req.body.data[key]["asset_type_code"] != null
            ? Number(req.body.data[key]["asset_type_code"])
            : undefined;

        let brand =
          req.body.data[key]["brand"] != null
            ? req.body.data[key]["brand"]
            : undefined;

        let model =
          req.body.data[key]["model"] != null
            ? req.body.data[key]["model"]
            : undefined;

        let serial_number =
          req.body.data[key]["serial_number"] != null
            ? req.body.data[key]["serial_number"]
            : undefined;

        let price =
          req.body.data[key]["price"] != null
            ? Number(req.body.data[key]["price"].replace(/,/g, ""))
            : undefined;

        // let budget_type_id = req.body.data[key]['budget_type_id'] != null ? Number(req.body.data[key]['budget_type_id']) : undefined;

        let budget_type_code =
          req.body.data[key]["budget_type_code"] != null
            ? req.body.data[key]["budget_type_code"]
            : undefined;

        let is_transfer =
          req.body.data[key]["is_transfer"] != null
            ? Number(req.body.data[key]["is_transfer"])
            : undefined;

        let transfer_from =
          req.body.data[key]["motransfer_fromdel"] != null
            ? req.body.data[key]["transfer_from"]
            : undefined;

        let location =
          req.body.data[key]["location"] != null
            ? req.body.data[key]["location"]
            : undefined;

        // let department_id = req.body.data[key]['department_id'] != null ? Number(req.body.data[key]['department_id']) : undefined;

        let department_code =
          req.body.data[key]["department_code"] != null
            ? Number(req.body.data[key]["department_code"])
            : undefined;

        let drawer_name =
          req.body.data[key]["drawer_name"] != null
            ? req.body.data[key]["drawer_name"]
            : undefined;

        let holder_name =
          req.body.data[key]["holder_name"] != null
            ? req.body.data[key]["holder_name"]
            : undefined;

        let warranty_type_1 =
          req.body.data[key]["warranty_type_1"] != null
            ? req.body.data[key]["warranty_type_1"]
            : undefined;

        let warranty_day_1 =
          req.body.data[key]["warranty_day_1"] != null
            ? Number(req.body.data[key]["warranty_day_1"])
            : undefined;

        let warranty_type_2 =
          req.body.data[key]["warranty_type_2"] != null
            ? req.body.data[key]["warranty_type_2"]
            : undefined;

        let warranty_day_2 =
          req.body.data[key]["warranty_day_2"] != null
            ? Number(req.body.data[key]["warranty_day_2"])
            : undefined;

        let warranty_type_3 =
          req.body.data[key]["warranty_type_3"] != null
            ? req.body.data[key]["warranty_type_3"]
            : undefined;

        let warranty_day_3 =
          req.body.data[key]["warranty_day_3"] != null
            ? Number(req.body.data[key]["warranty_day_3"])
            : undefined;

        let asset_status =
          req.body.data[key]["asset_status"] != null
            ? Number(req.body.data[key]["asset_status"])
            : undefined;

        let cancel_type =
          req.body.data[key]["cancel_type"] != null
            ? Number(req.body.data[key]["cancel_type"])
            : undefined;

        let cancel_date =
          req.body.data[key]["cancel_date"] != null
            ? new Date(req.body.data[key]["cancel_date"])
            : undefined;

        let cancel_comment =
          req.body.data[key]["cancel_comment"] != null
            ? req.body.data[key]["cancel_comment"]
            : undefined;

        let transfer_to =
          req.body.data[key]["transfer_to"] != null
            ? req.body.data[key]["transfer_to"]
            : undefined;

        let transfer_to_department =
          req.body.data[key]["transfer_to_department"] != null
            ? req.body.data[key]["transfer_to_department"]
            : undefined;

        let comment =
          req.body.data[key]["comment"] != null
            ? req.body.data[key]["comment"]
            : undefined;

        let is_active = 1;
        let budget_type_id = null;
        let asset_type_id = null;
        let department_id = null;

        let import_type = null;
        let error_message = [];
        let import_success = false;
        // console.log(asset_code);

        let input_error = false;

        if (asset_code == undefined || asset_code == "") {
          input_error = true;
          error_message.push("asset_code is undefined");
        }

        if (is_import != 2) {
          /* 1 = Import */

          if (asset_name == undefined || asset_name == "") {
            input_error = true;
            error_message.push("asset_name is undefined");
          }

          if (input_year == undefined || input_year == "") {
            input_error = true;
            error_message.push("input_year is undefined");
          }

          if (asset_type_code == undefined || asset_type_code == "") {
            input_error = true;
            error_message.push("asset_type_code is undefined");
          } else {
            asset_type_id = await getAssetTypeId(asset_type_code);
            if (asset_type_id == null) {
              input_error = true;
              error_message.push("asset_type_id not found");
            }
          }

          if (budget_type_code == undefined || budget_type_code == "") {
            input_error = true;
            error_message.push("budget_type_code is undefined");
          } else {
            budget_type_id = await getBudgetTypeId(budget_type_code);
            if (budget_type_id == null) {
              input_error = true;
              error_message.push("budget_type_id not found");
            }
          }

          if (department_code == undefined || department_code == "") {
            input_error = true;
            error_message.push("department_code is undefined");
          } else {
            department_id = await getDepartmentId(department_code);
            if (department_id == null) {
              input_error = true;
              error_message.push("department_id not found");
            }
          }

          // if (asset_status == undefined) {
          //   input_error = true;
          //   error_message.push("asset_status is undefined");
          // }

          if (is_active == undefined || is_active == "") {
            input_error = true;
            error_message.push("is_active is undefined");
          }
        }

        let importField = {};
        if (is_import == 2) {
          /* 2=ตัดโอน  */

          importField = {
            // is_transfer: is_transfer,
            // transfer_from: transfer_from,
            // asset_status: asset_status, /* 1=ใช้งานปกติ, 2=ยกเลิก */
            asset_status: 2 /* 1=ใช้งานปกติ, 2=ยกเลิก */,
            cancel_type: cancel_type /* 1=โอน, 2=จำหน่าย */,
            cancel_date: cancel_date,
            cancel_comment: cancel_comment,
            transfer_to: transfer_to,
            transfer_to_department: transfer_to_department,
          };
        } else {
          /* 1 = import */
          holder_name = drawer_name; /* ให้ผู้เบิกเป็นผู้ใช้งานคนแรก */

          importField = {
            asset_code: asset_code,
            asset_name: asset_name,
            input_year: input_year,
            inspection_date: inspection_date,
            approved_date: approved_date,
            asset_detail: asset_detail,
            install_location: install_location,
            vendor: vendor,
            asset_type_id: asset_type_id,
            brand: brand,
            model: model,
            serial_number: serial_number,
            price: price,
            budget_type_id: budget_type_id,
            is_transfer: is_transfer,
            transfer_from: transfer_from,
            location: location,
            department_id: department_id,
            drawer_name: drawer_name,
            holder_name: holder_name,
            warranty_type_1: warranty_type_1,
            warranty_day_1: warranty_day_1,
            warranty_type_2: warranty_type_2,
            warranty_day_2: warranty_day_2,
            warranty_type_3: warranty_type_3,
            warranty_day_3: warranty_day_3,
            asset_status: 1 /* 1=ใช้งานปกติ, 2=ยกเลิก */,
            cancel_type: cancel_type,
            cancel_date: cancel_date,
            cancel_comment: cancel_comment,
            transfer_to: transfer_to,
            transfer_to_department: transfer_to_department,
            comment: comment,
            is_active: is_active,
            created_by: authUsername,
            updated_by: authUsername,
          };
        }

        // console.log(importField);
        if (input_error == false) {

          const assetCheck = await prisma[$table].findUnique({
            select: { id: true },
            where: { asset_code: asset_code },
          });

          if (assetCheck == null) {
            // console.log("create");
            import_type = "create";

            if (input_error == false) {
              try {
                const item = await prisma[$table].create({
                  data: importField,
                });

                await autoCreateLocationHistory(item.id, location, authUsername);
                await autoCreateHolderHistory(item.id, holder_name, authUsername);

                import_success = true;
              } catch (e) {
                console.log(e);
                error_message.push(e);
              }
            }
          } else {
            // console.log("update");
            import_type = "update";
            const id = assetCheck.id;
            // console.log(id);
            if (input_error == false) {
              try {
                const item = await prisma[$table].update({
                  where: {
                    id: id,
                  },

                  data: importField,
                });

                import_success = true;
              } catch (e) {
                console.log(e);
                error_message.push(e);
              }
            }
          }
        } /* !-- findUnique */

        import_result[key] = {
          row_id: Number(key) + 1,
          asset_code: asset_code,
          import_type: import_type,
          import_success: import_success,
          error_message: error_message,
        };
      }

      // console.log(asset);

      res
        .status(200)
        .json({ data: import_result, is_import: is_import, msg: "success" });
    } catch (error) {
      res.status(404).json({ msg: error.message });
    }
  },

  // ค้นหาทั้งหมด
  async onGetReport(req, res) {
    try {
      let $where = filterData(req);
      let other = await countDataAndOrder(req, $where);
      // console.log($where);
      const item = await prisma[$table].findMany({
        select: selectFieldReport,
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

  async onGetExport(req, res) {
    try {
      let $where = filterData(req);
      let other = await countDataAndOrder(req, $where);
      // selectFieldExport
      const item = await prisma[$table].findMany({
        select: selectFieldExport,
        where: $where,
        orderBy: other.$orderBy,
        // skip: other.$offset,
        // take: other.$perPage,
      });

      let data = item.map((e) => {
        let expire_date_all =
          e.warranty_type_1 != null && e.warranty_type_1 != ""
            ? e.warranty_type_1 + " " + e.warranty_day_1 + " วัน"
            : "";
        expire_date_all +=
          e.warranty_type_2 != null && e.warranty_type_2 != ""
            ? ", " + e.warranty_type_2 + " " + e.warranty_day_2 + " วัน"
            : "";
        expire_date_all +=
          e.warranty_type_3 != null && e.warranty_type_3 != ""
            ? ", " + e.warranty_type_3 + " " + e.warranty_day_3 + " วัน"
            : "";

        return {
          id: e.id,
          input_year: e.input_year,
          asset_code: e.asset_code,
          budget_type:{
            category: e.budget_type.category
          },
          หมายเลขครุภัณฑ์: e.asset_code,
          ชื่อครุภัณฑ์: e.asset_name,
          ปีงบประมาณ: e.input_year,
          รายละเอียด: e.asset_detail,
          ประเภทครุภัณฑ์: e.asset_type.name,
          วันที่ตรวจรับ:
            e.inspection_date != null
              ? dayjs(e.inspection_date).locale("th").format("DD MMM BBBB")
              : "",
          มูลค่าครุภัณฑ์:
            e.price != null
              ? Number(e.price)
                  .toFixed(2)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : "",
          ผู้จัดจำหน่าย: e.vendor,
          แหล่งเงิน: e.budget_type.name,
          การรับประกัน: expire_date_all,
        };
      });

      res.status(200).json({
        data: data,
        totalData: other.$count,
        totalPage: other.$totalPage,
        currentPage: other.$currentPage,
        msg: "success",
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = { ...methods };
