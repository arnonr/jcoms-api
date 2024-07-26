const { PrismaClient } = require("@prisma/client");
const SmsController = require("./SmsController");
const uploadController = require("./UploadsController");
const helperController = require("./HelperController");

const provinceController = require("./ProvinceController");
const districtController = require("./DistrictController");
const subDistrictController = require("./SubDistrictController");

const inspectorController = require("./InspectorController");
const bureauController = require("./BureauController");
const agencyController = require("./AgencyController");
const divisionController = require("./DivisionController");
const positionController = require("./PositionController");
const prefixNameController = require("./PrefixNameController");
const sectionController = require("./SectionController");

const complaintTypeController = require("./ComplaintTypeController");
const topicCategoryController = require("./TopicCategoryController");
const topicTypeController = require("./TopicTypeController");

const { v4: uuidv4 } = require("uuid");
const { body } = require("express-validator");
const $table = "complaint";
const $table_file_attach = "complaint_file_attach";
const $table_complainant = "complainant";
const $table_accused = "accused";

// const prisma = new PrismaClient();

const prisma = new PrismaClient().$extends({
  result: {
    complaint: {
      //extend Model name
      receive_doc_filename: {
        // the name of the new computed field
        needs: { receive_doc_filename: true } /* field */,
        compute(model) {
          let receive_doc_filename = null;

          if (model.receive_doc_filename != null) {
            receive_doc_filename =
              process.env.PATH_UPLOAD + model.receive_doc_filename;
          }

          return receive_doc_filename;
        },
      },
      closed_doc_filename: {
        // the name of the new computed field
        needs: { closed_doc_filename: true } /* field */,
        compute(model) {
          let closed_doc_filename = null; /* field */
          if (model.closed_doc_filename != null) {  /* field */
            closed_doc_filename =
              process.env.PATH_UPLOAD + model.closed_doc_filename;
          }
          return closed_doc_filename;
        },
      },
    },
  },
});

// ฟิลด์ที่ต้องการ Select รวมถึง join
const selectField = {
  id: true,
  uuid: true,
  jcoms_no: true,
  tracking_satisfaction: true,
  tracking_satisfaction_at: true,
  complaint_satisfaction: true,
  complaint_satisfaction_at: true,
  receive_at: true,
  receive_user_id: true,
  complaint_type_id: true,
  complainant_id: true,
  is_anonymous: true,
  complaint_title: true,
  complaint_detail: true,
  incident_datetime: true,
  location_coordinates: true,
  incident_location: true,
  day_time: true,
  complaint_channel_id: true,
  channel_history_text: true,
  evidence_url: true,
  inspector_id: true,
  bureau_id: true,
  division_id: true,
  agency_id: true,
  topic_type_id: true,
  house_number: true,
  building: true,
  moo: true,
  soi: true,
  road: true,
  postal_code: true,
  sub_district_id: true,
  district_id: true,
  province_id: true,
  state_id: true,
  inspector_state_id: true,
  notice_type: true,

  /* การรับเรื่อง ฝ่ายรับเรื่องร้องเรียน */
  pol_no: true,
  receive_doc_no: true,
  receive_doc_date: true,
  receive_comment: true,
  receive_doc_filename: true,
  receive_status: true,

  forward_doc_no: true,
  forward_doc_date: true,

  closed_at: true,
  closed_user_id: true,
  closed_comment: true,
  closed_state_id: true,
  closed_doc_filename: true,
  due_day: true,
  due_date: true,

  case_id: true,

  created_at: true,
  created_by: true,
  updated_at: true,
  updated_by: true,
  deleted_at: true,
  deleted_by: true,
  is_active: true,
  complaint_type: {
    select: {
      name_th: true,
    },
  },
  closed_user: {
    select: {
      email: true,
      firstname: true,
      lastname: true,
      officer_code: true,
    },
  },
  receive_user: {
    select: {
      email: true,
      firstname: true,
      lastname: true,
      officer_code: true,
    },
  },
  complainant: {},
  accused: {
    select: {
        id: true,
        prefix_name_id: true,
        firstname: true,
        lastname: true,
        position_id: true,
        section_id: true,
        agency_id: true,
        inspector_id: true,
        bureau_id: true,
        division_id: true,
        complaint_id: true,
        type: true,
        detail: true,
        created_at: true,
        created_by: true,
        updated_at: true,
        updated_by:true,
        deleted_at:true,
        deleted_by: true,
        is_active: true,
        prefix_name: {
            select: {
            name_th: true,
            name_th_abbr: true,
            },
        },
    },
    where: {
      deleted_at: null,
    },
  },
  channel_history: {
    select: {
      complaint_channel_id: true,
      description: true,
      channel: {
        select: {
          name_th: true,
        },
      },
    },
  },
  complaint_channel: {
    select: {
      name_th: true,
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
  topic_type: {
    select: {
      name_th: true,
      topic_category: {
        select: {
          id: true,
          name_th: true,
        },
      },
    },
  },
  province: {
    select: {
      name_th: true,
    },
  },
  district: {
    select: {
      name_th: true,
    },
  },
  sub_district: {
    select: {
      name_th: true,
    },
  },
  state: {
    select: {
      name_th: true,
    },
  },
  inspector_state: {
    select: {
      name_th: true,
    },
  },
};

const filterData = (req) => {
  let $where = {
    deleted_at: null,
    complainant: {},
    accused: {},
    topic_type: {
      topic_category: {},
    },
  };

  if (req.query.topic_category_id) {
    $where["topic_type"]["topic_category"]["id"] = parseInt(
      req.query.topic_category_id
    );
  }

  if (req.query.accused_fullname) {
    const [firstName, lastName] = req.query.accused_fullname.split(" ");

    $where["accused"] = {
      some: {
        OR: [
          { firstname: firstName },
          { lastname: lastName },
          { firstname: lastName },
          { lastname: firstName },
        ],
      },
    };
  }

  if (req.query.create_year) {
    const year = parseInt(req.query.create_year, 10);
    const startOfYear = new Date(year, 0, 1); // January 1st of the given year
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st of the given year

    $where["created_at"] = {
      gte: startOfYear,
      lte: endOfYear,
    };
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

  if (req.query.complainant_fullname) {
    const [firstName, lastName] = req.query.complainant_fullname.split(" ");

    $where["complainant"] = {
      OR: [
        { firstname: firstName },
        { lastname: lastName },
        { firstname: lastName },
        { lastname: firstName },
      ],
    };
  }

  if (req.query.complainant_uuid) {
    $where["complainant"] = {
      uuid: req.query.complainant_uuid,
    };
  }

  if (req.query.card_type) {
    $where["complainant"]['card_type'] = Number(req.query.card_type)
  }

  if (req.query.id_card) {
    $where["complainant"]["id_card"] = helperController.base64EncodeWithKey(req.query.id_card);
  }

  if (req.query.id) {
    $where["id"] = parseInt(req.query.id);
  }

  if (req.query.uuid) {
    $where["uuid"] = {
      contains: req.query.uuid,
    };
  }

  if (req.query.complaint_code) {
    $where["complaint_code"] = {
      contains: req.query.complaint_code,
    };
  }

  if (req.query.tracking_satisfaction) {
    $where["tracking_satisfaction"] = parseInt(req.query.tracking_satisfaction);
  }

  if (req.query.complaint_satisfaction) {
    $where["complaint_satisfaction"] = parseInt(
      req.query.complaint_satisfaction
    );
  }

  if (req.query.receive_user_id) {
    $where["receive_user_id"] = parseInt(req.query.receive_user_id);
  }

  if (req.query.complaint_type_id) {
    $where["complaint_type_id"] = parseInt(req.query.complaint_type_id);
  }

  if (req.query.complainant_id) {
    $where["complainant_id"] = parseInt(req.query.complainant_id);
  }

  if (req.query.is_anonymous) {
    $where["is_anonymous"] = parseInt(req.query.is_anonymous);
  }

  if (req.query.complaint_title) {
    $where["complaint_title"] = {
      contains: req.query.complaint_title,
    };
  }

  if (req.query.complaint_detail) {
    $where["complaint_detail"] = {
      contains: req.query.complaint_detail,
    };
  }

  if (req.query.incident_date_from && req.query.incident_date_to) {
    let date_from = new Date(
      req.query.incident_date_from + "T00:00:00.000+0000"
    ).toISOString();

    let date_to = new Date(
      req.query.incident_date_to + "T23:59:59.000+0000"
    ).toISOString();

    $where["incident_datetime"] = {
      gte: date_from,
      lte: date_to,
    };

  } else if (req.query.incident_date_from) {

    let date_from = new Date(
      req.query.incident_date_from + "T00:00:00.000+0000"
    ).toISOString();

    let date_to = new Date(
      req.query.incident_date_from + "T23:59:59.000+0000"
    )

    $where["incident_datetime"] = {
      gte: date_from,
      lte: date_to,
    };

  }

  if (req.query.location_coordinates) {
    $where["location_coordinates"] = {
      contains: req.query.location_coordinates,
    };
  }

  if (req.query.day_time) {
    $where["day_time"] = parseInt(req.query.day_time);
  }

  if (req.query.incident_location) {
    $where["incident_location"] = {
      contains: req.query.incident_location,
    };
  }

  if (req.query.complaint_channel_id) {
    $where["complaint_channel_id"] = parseInt(req.query.complaint_channel_id);
  }

  if (req.query.channel_history_text) {
    $where["channel_history_text"] = {
      contains: req.query.channel_history_text,
    };
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

  if (req.query.topic_type_id) {
    $where["topic_type_id"] = parseInt(req.query.topic_type_id);
  }

  if (req.query.house_number) {
    $where["house_number"] = {
      contains: req.query.house_number,
    };
  }

  if (req.query.building) {
    $where["building"] = {
      contains: req.query.building,
    };
  }

  if (req.query.moo) {
    $where["moo"] = {
      contains: req.query.moo,
    };
  }

  if (req.query.soi) {
    $where["soi"] = {
      contains: req.query.soi,
    };
  }

  if (req.query.road) {
    $where["road"] = {
      contains: req.query.road,
    };
  }

  if (req.query.postal_code) {
    $where["postal_code"] = {
      contains: req.query.postal_code,
    };
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

  if (req.query.more_state_id) {
    $where["state_id"] = {
      gte: parseInt(req.query.more_state_id),
      not: 18,
    };
  }


//   if(req.query.inspector_state_id){
//     $where["inspector_state_id"] = parseInt(req.query.inspector_state_id);
//   }




  if (req.query.notice_type) {
    $where["notice_type"] = parseInt(req.query.notice_type);
  }

  if (req.query.jcoms_no) {
    $where["jcoms_no"] = {
      contains: req.query.jcoms_no,
    };
  }

  if (req.query.pol_no) {
    $where["pol_no"] = {
      contains: req.query.pol_no,
    };
  }

  if (req.query.receive_doc_no) {
    $where["receive_doc_no"] = {
      contains: req.query.receive_doc_no,
    };
  }

  if (req.query.receive_doc_date) {
    $where["receive_doc_date"] = {
      contains: req.query.receive_doc_date,
    };
  }

  if (req.query.follow_doc_no) {
    $where["follow_doc_no"] = {
      contains: req.query.follow_doc_no,
    };
  }

  if (req.query.follow_doc_date) {
    $where["follow_doc_date"] = {
      contains: req.query.follow_doc_date,
    };
  }

  if (req.query.receive_status) {
    $where["receive_status"] = parseInt(req.query.receive_status);
  }

  if (req.query.is_active) {
    $where["is_active"] = parseInt(req.query.is_active);
  }

  if(req.query.state_in){
    const statesString = req.query.state_in;
    const states = statesString.split(',').map(Number);
    if (states.some(isNaN)) {
      // Handle the case where the input contains invalid values
      // For example, return an error or set a default value
      console.log('Invalid input: ' + statesString);
    } else {
      $where['state_id'] = { in: states };
    }
  }


  if (req.query.state_id) {
    $where["state_id"] = parseInt(req.query.state_id);
  }

  if(req.query.resp_bureau_id){
    let bureauCondition = null
    if (req.query.inspector_id) {
        $where['inspector_id'] = undefined;
        bureauCondition  = {
            OR: [
                { inspector_id: parseInt(req.query.inspector_id) },
                { bureau_id: { in: req.query.resp_bureau_id.split(',').map(Number) } }
            ]
          };
    }else{
        bureauCondition  = $where['bureau_id'] = { in: req.query.resp_bureau_id };
    }

  $where = {
    AND: [
      $where,
      bureauCondition 
    ]
  };
  }

  if(req.query.resp_division_id){
    let  divisionCondition = null
    if (req.query.bureau_id) {
        $where['bureau_id'] = undefined;
        divisionCondition = {
            OR: [
                { bureau_id: parseInt(req.query.bureau_id) },
                { division_id: { in: req.query.resp_division_id.split(',').map(Number) } }
            ]
          };
    }else{
        divisionCondition = $where['division_id'] = { in: req.query.resp_division_id };
    }

  $where = {
    AND: [
      $where,
      divisionCondition
    ]
  };
  }

  if(req.query.resp_agency_id){
    let  agencyCondition = null
    if (req.query.division_id) {
        $where['division_id'] = undefined;
        agencyCondition = {
            OR: [
                { division_id: parseInt(req.query.division_id) },
                { agency_id: { in: req.query.resp_agency_id.split(',').map(Number) } }
            ]
          };
    }else{
        agencyCondition = $where['agency_id'] = { in: req.query.resp_agency_id };
    }

  $where = {
    AND: [
      $where,
      agencyCondition
    ]
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

const excludeSpecificField = (req) => {
  let fields = { ...selectField };

  const { exclude } = req.query;

  if (exclude) {
    if (exclude == "all") {
      // Remove nested select objects
      const keysToRemove = Object.keys(fields).filter(
        (key) => typeof fields[key] === "object" && fields[key] !== null
      );

      keysToRemove.forEach((key) => {
        delete fields[key];
      });
    }

    const fieldsToExclude = exclude.split(",");
    // Remove fields from selectField
    for (const field of fieldsToExclude) {
      delete fields[field];
    }
  }

  return fields;
};

const deleteComplaintChannelHistory = async (complaint_id) => {
  const complaint_history = await prisma.complaint_channel_history.deleteMany({
    where: {
      complaint_id: Number(complaint_id),
    },
  });
};

const addComplaintChannelHistory = async (
  complaint_id,
  complaint_channel_ids,
  authUsername
) => {
  if (complaint_channel_ids) {
    // console.log(channel_ids);
    const complaint_channel_ids_array = complaint_channel_ids.split(",");
    for (let i = 0; i < complaint_channel_ids_array.length; i++) {
      const item = await prisma.complaint_channel_history.create({
        data: {
          complaint_id: Number(complaint_id),
          complaint_channel_id: Number(complaint_channel_ids_array[i]),
          created_by: authUsername,
          created_at: new Date(),
        },
      });
    }
  }
};

const generateJcomsCode = async (id) => {
  const item = await prisma[$table].findUnique({
    select: {
      jcoms_no: true,
      jcoms_month_running: true,
    },
    where: {
      id: Number(id),
    },
  });

  if (item.jcoms_no != null) {
    return null;
  }

  /* Update JCOMS Month Running */
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Months are zero-based

  const maxRunning = await prisma[$table].aggregate({
    _max: {
      jcoms_month_running: true,
    },
    where: {
      created_at: {
        gte: new Date(currentYear, currentMonth - 1, 1), // Start of the current month
        lt: new Date(currentYear, currentMonth, 1), // Start of the next month
      },
    },
  });

  const newRunningMonth = maxRunning._max.jcoms_month_running + 1;
  const newRunningCode = newRunningMonth.toString().padStart(5, "0");
  const yearCode = (currentYear + 543).toString().substring(2, 4);
  const monthCode = currentMonth.toString().padStart(2, "0");

  const jcoms_code = `jcoms${yearCode}${monthCode}${newRunningCode}`;

  if (item.jcoms_no == null) {
    await prisma[$table].update({
      where: {
        id: Number(id),
      },
      data: {
        jcoms_no: jcoms_code,
        jcoms_month_running: newRunningMonth,
      },
    });
  }

  return { jcoms_code: jcoms_code, jcoms_month_running: newRunningMonth };
};

const generateJcomsYearCode = async (id) => {
  const item = await prisma[$table].findUnique({
    select: {
      jcoms_no: true,
      jcoms_year_running: true,
    },
    where: {
      id: Number(id),
    },
  });

  if (item.jcoms_no != null) {
    return null;
  }

  /* Update JCOMS Year Running */

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Months are zero-based

  const maxRunning = await prisma[$table].aggregate({
    _max: {
      jcoms_year_running: true,
    },
    where: {
      created_at: {
        gte: new Date(`${currentYear}-01-01`),
        lt: new Date(`${currentYear + 1}-01-01`),
      },
    },
  });

  const newRunningYear = maxRunning._max.jcoms_year_running + 1;
  const newRunningCode = newRunningYear.toString().padStart(5, "0");
  // const yearCode = (currentYear + 543).toString();
  const yearCode = (currentYear + 543).toString().substring(2, 4);
  const monthCode = currentMonth.toString().padStart(2, "0");

  const jcoms_code = `JC${yearCode}${monthCode}${newRunningCode}`;

  if (item.jcoms_no == null) {
    await prisma[$table].update({
      where: {
        id: Number(id),
      },
      data: {
        jcoms_no: jcoms_code,
        jcoms_year_running: newRunningYear,
      },
    });
  }

  return { jcoms_code: jcoms_code, jcoms_year_running: newRunningYear };
};

const getComplainantUUIDbyPhoneNumber = async (phoneNumber) => {
  try {
    const item = await prisma.complainant.findUnique({
      where: {
        phone_number: phoneNumber,
      },
      select: {
        uuid: true,
      },
    });

    if (item) {
      return item.uuid;
    }
  } catch (error) {
    return null;
  }
};

const methods = {

    async onGetPhoneNumber(req, res) {

        if (!req.body.jcoms_no && !req.body.phone_number && !req.body.id_card) {
          return res
            .status(400)
            .json({ msg: "jcoms_no or phone_number or id_card is required" });
        }

        let $where = {
          complainant: {},
        };

        if (req.body.jcoms_no) {
          $where["jcoms_no"] = req.body.jcoms_no;
        }

        if (req.body.phone_number) {
          $where["complainant"]["phone_number"] = req.body.phone_number;
        }

        if (req.body.id_card) {
            $where["complainant"]["id_card"] = helperController.base64EncodeWithKey(req.body.id_card);
        }

        try {
          const item = await prisma[$table].findFirstOrThrow({
            select: {
              complainant: {
                select: {
                  phone_number: true,
                },
              },
            },
            where: $where,
          });

          if(!item){
            throw new Error({code:"P2025" });
          }

          const phone_number = item.complainant.phone_number;
          const secret_phone_number = "xxx-xxx-" + phone_number.slice(6, 10);


          res.status(200).json({
            data:{phone_number: secret_phone_number},
            msg: "success",
          });
        } catch (error) {
          if (error.code == "P2025") {
            return res.status(404).json({ msg: "data not found" });
          }

          res.status(500).json({ msg: error.message });
        }
      },

  async onGetOTPTracking(req, res) {
    
    if (!req.body.otp_secret) {
      return res.status(400).json({ msg: "otp_secret is required" });
    }

    if (!req.body.jcoms_no && !req.body.phone_number && !req.body.id_card) {
      return res
        .status(400)
        .json({ msg: "jcoms_no or phone_number or id_card is required" });
    }

    const otpSecret = req.body.otp_secret;

    let $where = {
      complainant: {},
    };

    if (req.body.jcoms_no) {
      $where["jcoms_no"] = req.body.jcoms_no;
    }

    if (req.body.phone_number) {
      $where["complainant"]["phone_number"] = req.body.phone_number;
    }

    if (req.body.id_card) {
      $where["complainant"]["id_card"] = helperController.base64EncodeWithKey(req.body.id_card);
    }
    console.log("FREEDOM1")
    try {
      const item = await prisma[$table].findFirstOrThrow({
        select: {
          complainant: {
            select: {
              phone_number: true,
            },
          },
        },
        where: $where,
      });

      const phoneNumber = item.complainant.phone_number;

      const otp = await SmsController.genarateOTP(phoneNumber, otpSecret);

      if (otp == "error") {
        return res.status(500).json({ msg: "error" });
      }

      res.status(200).json({
        data: otp,
        msg: "success",
      });
    } catch (error) {
        console.log(error)
      if (error.code == "P2025") {
        return res.status(404).json({ msg: "data not found" });
      }

      res.status(500).json({ msg: error.message });
    }
  },

  async onVertifyOTPTracking(req, res) {
    const otp = req.body.otp;
    const otp_secret = req.body.otp_secret;
    const phone_number = req.body.phone_number;

    if (otp == undefined) {
      return res.status(400).json({ msg: "otp is undefined" });
    }

    if (otp_secret == undefined) {
      return res.status(400).json({ msg: "otp_secret is undefined" });
    }

    try {
      const otp_item = await SmsController.verifyOTP(
        otp_secret,
        otp,
        phone_number
      );
      if (otp_item == false) {
        return res.status(400).json({ msg: "OTP is invalid" });
      }

      const complainantUUID = await getComplainantUUIDbyPhoneNumber(
        otp_item.phone_number
      );

      return res.status(200).json({
        data: { complainant_uuid: complainantUUID, otp_secret: otp_secret },
        msg: "success",
      });
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  },

  async onGetAll(req, res) {
    try {
      let $where = filterData(req);
      let other = await countDataAndOrder(req, $where);
      let select = excludeSpecificField(req, selectField);

      const item = await prisma[$table].findMany({
        select: select,
        where: $where,
        orderBy: other.$orderBy,
        skip: other.$offset,
        take: other.$perPage,
      });

      res.status(200).json({
        totalData: other.$count,
        totalPage: other.$totalPage,
        currentPage: other.$currentPage,
        msg: "success",
        data: item,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  async onGetCount(req, res) {
    try {
      let $where = filterData(req);

      const totalCount = await prisma[$table].count({
        where: $where,
      });

      res.status(200).json({
        msg: "success",
        totalCount: totalCount,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  async onGetAllByOTP(req, res) {
    if (!req.query.complainant_uuid) {
      return res.status(400).json({ msg: "complainant_uuid is required" });
    }

    let $where = {
      deleted_at: null,
      complainant: {},
    };

    if (req.query.complainant_uuid) {
      $where["complainant"] = {
        uuid: req.query.complainant_uuid,
      };
    }

    try {
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

  async onGetById(req, res) {
    let select = excludeSpecificField(req, selectField);

    try {
      const item = await prisma[$table].findUnique({
        select: select,
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
    let authUsername = null;
    // if (req.headers.authorization !== undefined) {
    //   const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    //   authUsername = decoded.username;
    // }

    let closedDocPathFile = await uploadController.onUploadFile(
      req,
      "/complaint/",
      "closed_doc_filename"
    );

    let receiveDocPathFile = await uploadController.onUploadFile(
      req,
      "/complaint/",
      "receive_doc_filename"
    );

    if (receiveDocPathFile == "error") {
      return res.status(500).send("receive_doc_filename error");
    }

    if (closedDocPathFile == "error") {
      return res.status(500).send("closed_doc_filename error");
    }

    try {
      const item = await prisma[$table].create({
        data: {
          is_active: Number(req.body.is_active),
          uuid: uuidv4(),
          receive_doc_filename: receiveDocPathFile,
          complaint_code: req.body.complaint_code,
          tracking_satisfaction: Number(req.body.tracking_satisfaction),
          tracking_satisfaction_at:
            req.body.tracking_satisfaction_at != null
              ? new Date(req.body.tracking_satisfaction_at)
              : undefined,
          complaint_satisfaction: Number(req.body.complaint_satisfaction),
          complaint_satisfaction_at:
            req.body.complaint_satisfaction_at != null
              ? new Date(req.body.complaint_satisfaction_at)
              : undefined,

          receive_at:
            req.body.receive_at != null
              ? new Date(req.body.receive_at)
              : undefined,
          receive_user_id:
            req.body.receive_user_id != null
              ? Number(req.body.receive_user_id)
              : undefined,
          receive_comment: req.body.receive_comment,
          pol_no: req.body.pol_no,
          receive_doc_no: req.body.receive_doc_no,
          receive_doc_date:
            req.body.receive_doc_date != null
              ? new Date(req.body.receive_doc_date)
              : undefined,
          receive_status: Number(req.body.receive_status),

          complaint_type_id:
            req.body.complaint_type_id != null
              ? Number(req.body.complaint_type_id)
              : undefined,
          complainant_id:
            req.body.complainant_id != null
              ? Number(req.body.complainant_id)
              : undefined,
          is_anonymous: Number(req.body.is_anonymous),

          complaint_title: req.body.complaint_title,
          complaint_detail: req.body.complaint_detail,
          incident_datetime:
            req.body.incident_datetime != null
              ? new Date(req.body.incident_datetime)
              : undefined,
          location_coordinates: req.body.location_coordinates,
          incident_location: req.body.incident_location,
          day_time: parseInt(req.body.day_time),

          complaint_channel_id:
            req.body.complaint_channel_id != null
              ? Number(req.body.complaint_channel_id)
              : undefined,
          channel_history_text: req.body.channel_history_text,
          evidence_url: req.body.evidence_url,
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
            req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
          topic_type_id:
            req.body.topic_type_id != null
              ? Number(req.body.topic_type_id)
              : undefined,
          house_number: req.body.house_number,
          building: req.body.building,
          moo: req.body.moo,
          soi: req.body.soi,
          road: req.body.road,
          postal_code: req.body.postal_code,
          sub_district_id:
            req.body.sub_district_id != null
              ? Number(req.body.sub_district_id)
              : undefined,
          district_id:
            req.body.district_id != null
              ? Number(req.body.district_id)
              : undefined,
          province_id:
            req.body.province_id != null
              ? Number(req.body.province_id)
              : undefined,
          state_id: req.body.state_id != null ? parseInt(req.body.state_id) : undefined,
          notice_type: parseInt(req.body.notice_type),
          inspector_state_id: req.body.inspector_state_id != null ? Number(req.body.inspector_state_id) : undefined,

          forward_doc_no: req.body.forward_doc_no,
          forward_doc_date:
            req.body.forward_doc_date != null
              ? new Date(req.body.forward_doc_date)
              : undefined,

          closed_at: req.body.closed_at != null ? new Date(req.body.closed_at) : undefined,
          closed_user_id:
            req.body.closed_user_id != null
              ? Number(req.body.closed_user_id)
              : undefined,
          closed_comment: req.body.closed_comment,
          closed_state_id: req.body.closed_state_id != null ? Number(req.body.closed_state_id) : undefined,
          closed_doc_filename: closedDocPathFile != null ? closedDocPathFile : undefined,
          due_day: req.body.due_day != null ? parseInt(req.body.due_day) : undefined,
          due_date: req.body.due_date != null ? new Date(req.body.due_date) : undefined,

          created_by: authUsername,
          updated_by: authUsername,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      if(req.body.complaint_channel_ids !== undefined){
        // await deleteComplaintChannelHistory(item.id);
        await addComplaintChannelHistory(
          item.id,
          req.body.complaint_channel_ids
        );
      }
      // const JcomsCode = await generateJcomsCode(item.id);
      const JcomsCode = await generateJcomsYearCode(item.id);
      item.jcoms_no = JcomsCode.jcoms_code;

      /* Update File Attach */
      if (req.body.secret_key != null) {
        await prisma[$table_file_attach].updateMany({
          where: {
            secret_key: req.body.secret_key,
          },
          data: {
            complaint_id: item.id,
          },
        });
      }

      res.status(201).json({ ...item, msg: "success" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

    async onRpaImport(req, res) {

        let authUsername = null;
        // if (req.headers.authorization !== undefined) {
        //     const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
        //     authUsername = decoded.username;
        // }

        if(req.body.complainant === undefined){
            return res.status(400).send("complainant is required");
        }

        let complaintPathFile = await uploadController.onUploadFile(
          req,
          "/complaint/",
          "complaint_file"
        );

        if (complaintPathFile == "error") {
          return res.status(500).send("error");
        }

        // console.log(req.body);
        // console.log("----------------------")

        const inspector = req.body.inspector != null ? req.body.inspector : null;
        const bureau = req.body.bureau != null ? req.body.bureau : null;
        const division = req.body.division != null ? req.body.division : null;
        const agency = req.body.agency != null ? req.body.agency : null;
        const topic_type = req.body.topic_type != null ? req.body.topic_type : null;
        const topic_category = req.body.topic_category != null ? req.body.topic_category : null;
        const complaint_type = req.body.complaint_type != null ? req.body.complaint_type : null;
        const complaint_type_id_ = req.body.complaint_type_id != null ? req.body.complaint_type_id : null;
        const province = req.body.province != null ? req.body.province : null;
        const district = req.body.district != null ? req.body.district : null;
        const sub_district = req.body.sub_district != null ? req.body.sub_district : null;

        const complainant_prefix_name = req.body.complainant !== undefined && req.body.complainant.prefix_name ? req.body.complainant.prefix_name : null;
        const complainant_province = req.body.complainant !== undefined && req.body.complainant.province != null ? req.body.complainant.province : null;
        const complainant_district = req.body.complainant !== undefined && req.body.complainant.district != null ? req.body.complainant.district : null;
        const complainant_sub_district = req.body.complainant !== undefined && req.body.complainant.sub_district != null ? req.body.complainant.sub_district : null;

        const accused_prefix_name = req.body.accused !== undefined && req.body.accused.prefix_name != null ? req.body.accused.prefix_name : null;
        const accused_agency = req.body.accused !== undefined && req.body.accused.agency != null ? req.body.accused.agency : null;
        const accused_inspector = req.body.accused !== undefined && req.body.accused.inspector != null ? req.body.accused.inspector : null;
        const accused_bureau = req.body.accused !== undefined && req.body.accused.bureau != null ? req.body.accused.bureau : null;
        const accused_division = req.body.accused !== undefined && req.body.accused.division != null ? req.body.accused.division : null;
        const accused_section = req.body.accused !== undefined && req.body.accused.section != null ? req.body.accused.section : null;
        const accused_position = req.body.accused !== undefined && req.body.accused.position != null ? req.body.accused.position : null;

        const inspector_id = await inspectorController.onGetId(inspector);
        const bureau_id = await bureauController.onGetId(bureau);
        const division_id = await divisionController.onGetId(division);
        const agency_id = await agencyController.onGetId(agency);
        const complaint_type_id = Number(complaint_type_id_);
        // await complaintTypeController.onGetId(complaint_type);
        const topic_category_id = await topicCategoryController.onGetId(topic_category);
        const topic_type_id = await topicTypeController.onGetId(topic_type);
        const province_id = await provinceController.onGetId(province);
        const sub_district_id = await subDistrictController.onGetId(sub_district);
        const district_id = await districtController.onGetId(district,province_id);
        const complainant_province_id = await provinceController.onGetId(complainant_province);
        const complainant_district_id = await districtController.onGetId(complainant_district,complainant_province_id);
        const complainant_sub_district_id = await subDistrictController.onGetId(complainant_sub_district);
        const complainant_prefix_name_id = await prefixNameController.onGetId(complainant_prefix_name);
        const accused_prefix_name_id = await prefixNameController.onGetId(accused_prefix_name);
        const accused_agency_id = await agencyController.onGetId(accused_agency);
        const accused_inspector_id = await inspectorController.onGetId(accused_inspector);
        const accused_bureau_id = await bureauController.onGetId(accused_bureau);
        const accused_division_id = await divisionController.onGetId(accused_division);
        const accused_section_id = await sectionController.onGetId(accused_section);
        const accused_position_id = await positionController.onGetId(accused_position);

        let complainant_id = null;
        let item_complaint = null;
        let item_accused = null;
        let item_complainant = null;


        try {

            if(req.body.complainant != undefined && req.body.complainant.phone_number != null && req.body.complainant.phone_number != "") {
                item_complainant = await prisma[$table_complainant].findUnique({
                    where: {
                        phone_number: req.body.complainant.phone_number
                    },
                });

                if(item_complainant != null) {
                    complainant_id = item_complainant.id;
                }
            }

            if(complainant_id == null) {
                item_complainant = await prisma[$table_complainant].create({
                    data: {
                        card_type: 1, /* ประเภทบัตร 1=บัตรประชาชน, 2=หนังสือเดินทาง */
                        id_card: req.body.complainant.id_card != null ? helperController.base64EncodeWithKey(req.body.complainant.id_card) : undefined,
                        // id_card: req.body.id_card != null ? req.body.id_card : undefined,
                        prefix_name_id: complainant_prefix_name_id != null ? Number(complainant_prefix_name_id) : undefined,
                        firstname: req.body.complainant != undefined && req.body.complainant.firstname != null ? req.body.complainant.firstname : undefined,
                        lastname: req.body.complainant != undefined && req.body.complainant.lastname != null ? req.body.complainant.lastname : undefined,
                        birthday: req.body.complainant != undefined && req.body.complainant.birthday != null ? new Date(req.body.complainant.birthday) : undefined,
                        occupation_text: req.body.complainant != undefined && req.body.complainant.occupation != null ? req.body.complainant.occupation : undefined,
                        phone_number: req.body.complainant != undefined && req.body.complainant.phone_number != null ? req.body.complainant.phone_number : uuidv4(),
                        email: req.body.complainant != undefined && req.body.complainant.email != null ? req.body.complainant.email : undefined,
                        house_number: req.body.complainant != undefined && req.body.complainant.house_number != null ? req.body.complainant.house_number : undefined,
                        building: req.body.complainant != undefined && req.body.complainant.building != null ? req.body.complainant.building : undefined,
                        moo: req.body.complainant != undefined && req.body.complainant.moo != null ? req.body.complainant.moo : undefined,
                        soi: req.body.complainant != undefined && req.body.complainant.soi != null ? req.body.complainant.soi : undefined,
                        road: req.body.complainant != undefined && req.body.complainant.road != null ? req.body.complainant.road : undefined,
                        postal_code: req.body.complainant != undefined && req.body.complainant.postal_code != null ? req.body.complainant.postal_code : undefined,
                        sub_district_id: complainant_sub_district_id != null ? Number(complainant_sub_district_id) : undefined,
                        district_id: complainant_district_id != null ? Number(complainant_district_id) : undefined,
                        province_id: complainant_province_id != null ? Number(complainant_province_id) : undefined,
                    }
                });

                complainant_id = item_complainant.id;
            }

            if(complainant_id != null){

                let res_topic_type_id = 43;

                if(complaint_type_id == 1){
                    res_topic_type_id = 43;
                }


                if(complaint_type_id == 2){
                    res_topic_type_id = 44;
                }


                if(complaint_type_id == 3){
                    res_topic_type_id = 45;
                }


                if(complaint_type_id == 4){
                    res_topic_type_id = 46;
                }

                item_complaint = await prisma[$table].create({
                    data: {
                        is_active: 1,
                        is_anonymous: 1,
                        uuid: uuidv4(),
                        receive_doc_filename: complaintPathFile,
                        complaint_type_id: complaint_type_id != null ? complaint_type_id : undefined,
                        complainant_id: complainant_id,
                        is_anonymous: 0,

                        // id_card: req.body.complainant.id_card != null ? helperController.base64EncodeWithKey(req.body.complainant.id_card) : undefined,

                        complaint_title: req.body.complaint_title != null ? req.body.complaint_title : undefined,
                        complaint_detail: req.body.complaint_detail != null ? req.body.complaint_detail : undefined,

                        incident_datetime: req.body.incident_datetime != null ? new Date(req.body.incident_datetime) : undefined,

                        location_coordinates: req.body.location_coordinates != null ? req.body.location_coordinates : undefined,
                        incident_location: req.body.incident_location != null ? req.body.incident_location : undefined,
                        // day_time: req.body.day_time != null ? parseInt(req.body.day_time) : undefined,
                        complaint_channel_id: 10, /* RPA */

                        inspector_id: inspector_id != null ? Number(inspector_id) : undefined,
                        bureau_id: bureau_id != null ? Number(bureau_id) : undefined,
                        division_id: division_id != null ? Number(division_id) : undefined,
                        agency_id: agency_id != null ? Number(agency_id) : undefined,
                        // topic_category_id: topic_category_id != null ? Number(topic_category_id) : undefined,
                        topic_type_id: res_topic_type_id,
                    
                        house_number: req.body.house_number != null ? req.body.house_number : undefined,
                        building: req.body.building != null ? req.body.building : undefined,
                        moo: req.body.moo != null ? req.body.moo : undefined,
                        soi: req.body.soi != null ? req.body.soi : undefined,
                        road: req.body.road != null ? req.body.road : undefined,
                        postal_code: req.body.postal_code != null ? req.body.postal_code : undefined,
                        sub_district_id: sub_district_id != null ? Number(sub_district_id) : undefined,
                        district_id: district_id != null ? Number(district_id) : undefined,
                        province_id: province_id != null ? Number(province_id) : undefined,
                        state_id: 1, /* เรื่องร้องเรียนใหม่ (ยังไม่รับเรื่อง) */
                        created_by: authUsername,
                        updated_by: authUsername,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
                const complaint_id = item_complaint.id;

                if(req.body.accused != undefined){

                    for (let i = 0; i < req.body.accused.length; i++) {


                        let accused_prefix_name_id = null
                        if(req.body.accused[i].prefix_name != null){
                            accused_prefix_name_id = await prefixNameController.onGetId(req.body.accused[i].prefix_name);
                            accused_prefix_name_id = Number(accused_prefix_name_id)
                        }

                        let accused_agency_id = null
                        if(req.body.accused[i].agency != null){
                            accused_agency_id = await agencyController.onGetId(req.body.accused[i].agency);
                            accused_agency_id = Number(accused_agency_id)
                        }

                        let accused_section_id = null
                        if(req.body.accused[i].section != null){
                            accused_section_id = await sectionController.onGetId(req.body.accused[i].section);
                            if(accused_section_id) {
                                accused_section_id = Number(accused_section_id)
                            }else{
                                accused_section_id  = null
                            }
                        }

                        let accused_position_id = null
                        if(req.body.accused[i].position != null){
                            accused_position_id = await positionController.onGetId(req.body.accused[i].position);
                            accused_position_id = Number(accused_position_id)
                        }

                        // const accused_agency_id = await agencyController.onGetId(accused_agency);
                        // const accused_inspector_id = await inspectorController.onGetId(accused_inspector);
                        // const accused_bureau_id = await bureauController.onGetId(accused_bureau);
                        // const accused_division_id = await divisionController.onGetId(accused_division);
                        // const accused_prefix_name = req.body.accused !== undefined && req.body.accused[i].prefix_name != null ? req.body.accused[i].prefix_name : null;

                        await prisma[$table_accused].create({
                            data: {
                                prefix_name_id: accused_prefix_name_id,
                                firstname: req.body.accused[i] != undefined && req.body.accused[i].firstname != null ? req.body.accused[i].firstname : undefined,
                                lastname: req.body.accused[i] != undefined && req.body.accused[i].lastname != null ? req.body.accused[i].lastname : undefined,
                                complaint_id: complaint_id,
                                agency_id: accused_agency_id != null ? Number(accused_agency_id) : undefined,
                                // inspector_id: accused_inspector_id != null ? Number(accused_inspector_id) : undefined,
                                // bureau_id: accused_bureau_id != null ? Number(accused_bureau_id) : undefined,
                                // division_id: accused_division_id != null ? Number(accused_division_id) : undefined,
                                position_id: accused_position_id != null ? Number(accused_position_id) : undefined,
                                section_id: accused_section_id != null ? Number(accused_section_id) : undefined,
                              
                                // type: Number(req.body.type), /* ประเภทผู้ถูกกล่าวหา 1=ประชาชน,2=ตำรวจ */
                                // detail: x.accused != undefined && req.body.accused.detail != null ? req.body.accused.detail : undefined,
                                // created_by: null,
                                // updated_by: null,
                            },
                        });
                        
                    }

                   

                    // req.body.accused.forEach(async (x) => {
                    //     await prisma[$table_accused].create({
                    //         data: {
                    //             // prefix_name_id: accused_prefix_name_id != null ? Number(accused_prefix_name_id) : undefined,
                    //             firstname: x.accused != undefined && x.firstname != null ? x.firstname : undefined,
                    //             lastname: x.accused != undefined && x.astname != null ? x.lastname : undefined,
                    //             complaint_id: complaint_id,
                    //             // agency_id: accused_agency_id != null ? Number(accused_agency_id) : undefined,
                    //             // inspector_id: accused_inspector_id != null ? Number(accused_inspector_id) : undefined,
                    //             // bureau_id: accused_bureau_id != null ? Number(accused_bureau_id) : undefined,
                    //             // division_id: accused_division_id != null ? Number(accused_division_id) : undefined,
                    //             // position_id: accused_position_id != null ? Number(accused_position_id) : undefined,
                    //             // section_id: accused_section_id != null ? Number(accused_section_id) : undefined,
                              
                    //             // type: Number(req.body.type), /* ประเภทผู้ถูกกล่าวหา 1=ประชาชน,2=ตำรวจ */
                    //             // detail: x.accused != undefined && req.body.accused.detail != null ? req.body.accused.detail : undefined,
                    //             // created_by: null,
                    //             // updated_by: null,
                    //         },
                    //     });
                    // })

                 
                }


                console.log(complaint_type_id)

                const JcomsCode = await generateJcomsYearCode(complaint_id);
                req.body.jcoms_no = JcomsCode.jcoms_code;
            }

            const data = {complaint: item_complaint, complainant: item_complainant, accused : item_accused};
            res.status(201).json({data, msg: "success" });
        } catch (error) {
            res.status(400).json({ msg: error.message });
        }
    },

  // แก้ไข
  async onUpdate(req, res) {
    let authUsername = null;
    // if (req.headers.authorization !== undefined) {
    //   const decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
    //   authUsername = decoded.username;
    // }

    let receiveDocPathFile = await uploadController.onUploadFile(
      req,
      "/complaint/",
      "receive_doc_filename"
    );

    let closedDocPathFile = await uploadController.onUploadFile(
      req,
      "/complaint/",
      "closed_doc_filename"
    );

    if (receiveDocPathFile == "error") {
      return res.status(500).send("receive_doc_filename error");
    }

    if (closedDocPathFile == "error") {
      return res.status(500).send("closed_doc_filename error");
    }

    try {
      const item = await prisma[$table].update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          is_active:
            req.body.is_active != null ? Number(req.body.is_active) : undefined,
          complaint_code:
            req.body.complaint_code != null
              ? req.body.complaint_code
              : undefined,
          tracking_satisfaction:
            req.body.tracking_satisfaction != null
              ? Number(req.body.tracking_satisfaction)
              : undefined,
          tracking_satisfaction_at:
            req.body.tracking_satisfaction_at != null
              ? new Date(req.body.tracking_satisfaction_at)
              : undefined,
          complaint_satisfaction:
            req.body.complaint_satisfaction != null
              ? Number(req.body.complaint_satisfaction)
              : undefined,
          complaint_satisfaction_at:
            req.body.complaint_satisfaction_at != null
              ? new Date(req.body.complaint_satisfaction_at)
              : undefined,

          receive_at:
            req.body.receive_at != null
              ? new Date(req.body.receive_at)
              : undefined,
          receive_user_id:
            req.body.receive_user_id != null
              ? Number(req.body.receive_user_id)
              : undefined,
          pol_no: req.body.pol_no != null ? req.body.pol_no : undefined,
          receive_doc_no:
            req.body.receive_doc_no != null
              ? req.body.receive_doc_no
              : undefined,
          receive_doc_date:
            req.body.receive_doc_date != null
              ? new Date(req.body.receive_doc_date)
              : undefined,
          receive_status:
            req.body.receive_status != null
              ? Number(req.body.receive_status)
              : undefined,
          receive_comment:
            req.body.receive_comment != null
              ? req.body.receive_comment
              : undefined,
          receive_doc_filename:
            receiveDocPathFile != null ? receiveDocPathFile : undefined,

          complaint_type_id:
            req.body.complaint_type_id != null
              ? Number(req.body.complaint_type_id)
              : undefined,
          complainant_id:
            req.body.complainant_id != null
              ? Number(req.body.complainant_id)
              : undefined,
          is_anonymous:
            req.body.is_anonymous != null
              ? Number(req.body.is_anonymous)
              : undefined,
          complaint_title:
            req.body.complaint_title != null
              ? req.body.complaint_title
              : undefined,
          complaint_detail:
            req.body.complaint_detail != null
              ? req.body.complaint_detail
              : undefined,
          incident_datetime:
            req.body.incident_datetime != null
              ? new Date(req.body.incident_datetime)
              : undefined,
          location_coordinates:
            req.body.location_coordinates != null
              ? req.body.location_coordinates
              : undefined,
          incident_location:
            req.body.incident_location != null
              ? req.body.incident_location
              : undefined,
          day_time:
            req.body.day_time != null ? Number(req.body.day_time) : undefined,

          complaint_channel_id:
            req.body.complaint_channel_id != null
              ? Number(req.body.complaint_channel_id)
              : undefined,
          channel_history_text:
            req.body.channel_history_text != null
              ? req.body.channel_history_text
              : undefined,
          evidence_url:
            req.body.evidence_url != null ? req.body.evidence_url : undefined,

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
            req.body.agency_id != null ? Number(req.body.agency_id) : undefined,
          topic_type_id:
            req.body.topic_type_id != null
              ? Number(req.body.topic_type_id)
              : undefined,
          house_number:
            req.body.house_number != null ? req.body.house_number : undefined,
          building: req.body.building != null ? req.body.building : undefined,
          moo: req.body.moo != null ? req.body.moo : undefined,
          soi: req.body.soi != null ? req.body.soi : undefined,
          road: req.body.road != null ? req.body.road : undefined,
          postal_code:
            req.body.postal_code != null ? req.body.postal_code : undefined,
          sub_district_id:
            req.body.sub_district_id != null
              ? Number(req.body.sub_district_id)
              : undefined,
          district_id:
            req.body.district_id != null
              ? Number(req.body.district_id)
              : undefined,
          province_id:
            req.body.province_id != null
              ? Number(req.body.province_id)
              : undefined,
          state_id:
            req.body.state_id != null ? Number(req.body.state_id) : undefined,
          inspector_state_id:
            req.body.inspector_state_id !== undefined
              ? req.body.inspector_state_id != null ?  Number(req.body.inspector_state_id) : null
              : undefined,
          notice_type:
            req.body.notice_type != null ? req.body.notice_type : undefined,

          forward_doc_no:
            req.body.forward_doc_no != null
              ? req.body.forward_doc_no
              : undefined,
          forward_doc_date:
            req.body.forward_doc_date != null
              ? new Date(req.body.forward_doc_date)
              : undefined,

          closed_at:
            req.body.closed_at != null
              ? new Date(req.body.closed_at)
              : undefined,
          closed_user_id:
            req.body.closed_user_id != null
              ? Number(req.body.closed_user_id)
              : undefined,
          closed_comment:
            req.body.closed_comment != null
              ? req.body.closed_comment
              : undefined,

          closed_state_id:
            req.body.closed_state_id != null
            ? Number(req.body.closed_state_id)
            : undefined,

          closed_doc_filename:
            closedDocPathFile != null ? closedDocPathFile : undefined,

          due_day: req.body.due_day != null ? parseInt(req.body.due_day) : undefined,
          due_date: req.body.due_date != null ? new Date(req.body.due_date) : undefined,

          updated_by: authUsername,
          updated_at: new Date(),
        },
      });

      if(req.body.complaint_channel_ids !== undefined){
        await deleteComplaintChannelHistory(req.params.id);
        await addComplaintChannelHistory(
          req.params.id,
          req.body.complaint_channel_ids
        );
      }

      if (item.jcoms_no == null) {
        // const JcomsCode = await generateJcomsCode(req.params.id);
        const JcomsCode = await generateJcomsYearCode(req.params.id);
        // console.log(JcomsCode);
        if (JcomsCode != null) {
          item.jcoms_no = JcomsCode.jcoms_no;
        }
      }

      /* Update File Attach */
      if (req.body.secret_key != null) {
        await prisma[$table_file_attach].updateMany({
          where: {
            secret_key: req.body.secret_key,
          },
          data: {
            complaint_id: item.id,
          },
        });
      }

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
