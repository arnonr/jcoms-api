const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const $table = "asset_location_history";

const filterData = (req) => {
  let $where = {
    deleted_at: null,
    asset: {},
  };

  if (req.query.id) {
    $where["id"] = parseInt(req.query.id);
  }

  if (req.query.asset_id) {
    $where["asset_id"] = parseInt(req.query.asset_id);
  }

  if (req.query.location) {
    $where["location"] = {
      contains: req.query.location,
    };
  }

  if (req.query.previous_location) {
    $where["previous_location"] = {
      contains: req.query.previous_location,
    };
  }

  if (req.query.status) {
    $where["status"] = parseInt(req.query.status);
  }

  if (req.query.is_notice) {
    $where["is_notice"] = parseInt(req.query.is_notice);
  }

  if (req.query.approved_at) {
    $where["approved_at"] = {
      contains: req.query.approved_at,
      //   mode: "insensitive",
    };
  }

  if (req.query.approved_by) {
    $where["approved_by"] = {
      contains: req.query.approved_by,
      //   mode: "insensitive",
    };
  }

  if (req.query.is_active) {
    $where["is_active"] = parseInt(req.query.is_active);
  }

  if (req.query.asset_code) {
    $where["asset"]["asset_code"] = {
      contains: req.query.asset_code,
    };
  }

  if (req.query.asset_name) {
    $where["asset"]["asset_name"] = {
      contains: req.query.asset_name,
    };
  }

  if (req.query.input_year) {
    $where["asset"]["input_year"] = parseInt(req.query.input_year);
  }

  if (req.query.department_id) {
    $where["asset"]["department_id"] = parseInt(req.query.department_id);
  }

  if (req.query.drawer_name) {
    $where["asset"]["drawer_name"] = {
      contains: req.query.drawer_name,
    };
  }

  if (req.query.holder_name) {
    $where["asset"]["holder_name"] = {
      contains: req.query.holder_name,
    };
  }

  if (req.query.asset_status) {
    $where["asset"]["asset_status"] = parseInt(req.query.asset_status);
  }

  if (req.query.budget_type_id) {
    $where["asset"]["budget_type_id"] = parseInt(req.query.budget_type_id);
  }

  if (req.query.asset_type_id) {
    $where["asset"]["asset_type_id"] = parseInt(req.query.asset_type_id);
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
  id: true,
  asset_id: true,
  location: true,
  previous_location: true,
  status: true,
  is_notice: true,
  approved_at: true,
  approved_by: true,
  is_active: true,
  created_at: true,
  created_by: true,
  updated_at: true,
  updated_by: true,
  asset: {
    select: {
      id: true,
      asset_code: true,
      asset_detail: true,
      asset_name: true,
      asset_type_id: true,
      location: true,
      install_location: true,
    },
  },
  created_user: {
    select: {
      name: true,
    },
  },
  approved_user: {
    select: {
      name: true,
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
    if (req.headers.authorization !== undefined) {
      const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
      authUsername = decoded.username;
    }

    try {
      const item = await prisma[$table].create({
        data: {
          asset_id: req.body.asset_id,
          location: req.body.location,
          previous_location: req.body.previous_location,
          status: Number(req.body.status),
          is_notice: Number(req.body.is_notice),
          approved_at:
            req.body.approved_at != null
              ? new Date(req.body.approved_at)
              : undefined,
          approved_by: req.body.approved_by,
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
    if (req.headers.authorization !== undefined) {
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
          location: req.body.location != null ? req.body.location : undefined,
          previous_location:
            req.body.previous_location != null
              ? req.body.previous_location
              : undefined,
          status: req.body.status != null ? Number(req.body.status) : undefined,
          is_notice:
            req.body.is_notice != null ? Number(req.body.is_notice) : undefined,
          approved_at:
            req.body.approved_at != null
              ? new Date(req.body.approved_at)
              : undefined,
          approved_by:
            req.body.approved_by != null ? req.body.approved_by : undefined,
          is_active:
            req.body.is_active != null ? Number(req.body.is_active) : undefined,
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
