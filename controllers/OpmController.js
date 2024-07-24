const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const $table_complaint = "complaint";
const $table_complainant = "complainant";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');
const xml2js = require('xml2js');

const $user = "servicejaray";
const $password = "53ad4e7726f820b84c1fa474098e4b6b";

const provinceController = require("./ProvinceController");
const districtController = require("./DistrictController");
const subDistrictController = require("./SubDistrictController");
const prefixNameController = require("./PrefixNameController");
const helperController = require("./HelperController");
const opmUrl = "http://203.113.25.98/CoreService";
// const $authen_from = "S";

    // This function handles getting the token
const getToken = async () => {
    try {
        // const user = process.env.USER || $user;
        // const password = process.env.PASSWORD || $password;

        const user = $user;
        const password = $password;

        let params = {
            'user': user,
            'password': password,
            'authen_from': 'I',
            'ip_address': ':::1'
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/GetToken";
        const response = await axios.get(url, { params });

        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting token:', error);
        throw error;
    }
};

const getTimelineHeader = async (req) => {

    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        const timeline_type = req.query.timeline_type;

        if(!timeline_type) {
            throw new Error('Timeline type required');
        }

        let type = timeline_type == "A" ? "A" : "I";
        let params = {
            'last_get_date_time': "",
            'timeline_type': type, //A=ทั้งหมด, I=รายการรับ, P=กำลังดำเนินการ, N=รายการแจ้งเตือน
            'skip': 0,
            'take': 10,
            'token_id': tokenId
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/GetTimelineHeader";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting timeline header:', error);
        throw error;
    }
};

const getFirstOperating = async (complaint_id) => {

    try {
        const operatings = await getOperatings(complaint_id);
        console.log(operatings.length);
        if (operatings?.length > 0) {
            const firstOperating = operatings[0];
            // console.log("First operating item:", firstOperating);
            return firstOperating;
        } else {
            console.log("No operating items found.");
        }

        return null;

    } catch (error) {
        console.error('Error getting first operating:', error);
        throw error;
    }
}
const addOperating = async (complaint_id, req) => {
    try {

        const jsonData = await getToken();
        const tokenId = jsonData.token_id;

        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.case_id == null) {
            throw new Error('Case not found');
        }

        const case_id = item.case_id;
        const type_id = req.body.type_id;
        const detail = req.body.detail;
        const contact_detail = req.body.contact_detail;
        const date_opened = req.body.date_opened;
        const date_closed = req.body.date_closed;

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

        if(type_id == null) {
            throw new Error('type_id required');
        }

        if(detail == null) {
            throw new Error('Detail required');
        }

        const operatings = await getFirstOperating(complaint_id);
        if(operatings == null) {
            throw new Error('First operating not found');
        }
        const terminal_org_id = operatings.org_id;
        const terminal_owner_id = operatings.created_by;

        let params = {
            'token_id': tokenId,
            'case_id': case_id,
            'type_id': type_id, /* ประเภทการปฎิบัติงาน: 14=รายงานผลการปฎิบัติงาน(รับ), 15=รายงานผลการพิจารณาเรื่อง(ไม่รับ) */
            'objective_id': '16', /* กำหนดไว้เป็น 6 */
            'terminal_org_id': terminal_org_id, /* created_by_org “110” */
            'terminal_owner_id': terminal_owner_id,
            'channel_id': '5899EE5D72CF3652A4AAE69E429D9DED', /* คู่มือ: ช่องทางระบบ */
            'contact_detail': contact_detail || '',
            'date_opened': formattedDate, // '2015-12-31 15:32:12'
            'date_closed': formattedDate, // '2015-12-31 15:32:12'
            'detail': detail,
            'severity_id': '1',
            'secret_id': '1',
        };

        const url = opmUrl + "/SOAP/Officer.asmx/AddOperating";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error adding operating:', error);
        throw error;
    }
};

const setOrgSummaryResult = async (complaint_id, req) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
            // select: select,
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.case_id == null) {
            throw new Error('Case not found');
        }

        const case_id = item.case_id;
        const status_id = req.body.status_id;
        const result = req.body.result;

        if(status_id == null) {
            throw new Error('Status id required');
        }

        if(result == null) {
            throw new Error('Result required');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id, /* string รหัสเรื่องที่ใช้ในการอ้างอิงภายในระบบ */
            'status_id': status_id, /* string 0=อยู่ระหว่างดําเนินการ, 1=ยุติเรื่อง, 2=รับทราบไว้ขั้นต้น ,3=ไม่อยู่ในอำนาจหน้าที่ */
            'result': result, /* string ผลการปฏิบัติงานแจ้งผู้ร้องเรียน */
        };

        const url = "http://203.113.25.98/CoreService/SOAP/Officer.asmx/SetOrgSummaryResult";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error setting org summary result:', error);
        throw error;
    }
};

const getCase = async (case_id) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetCase";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting case:', error);
        throw error;
    }
};

const getAttachment = async (attachment_id) => {
    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'attachment_id ': attachment_id,
            'is_preview': 'true'
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetAttachment";
        const response = await axios.get(url, { params });

        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting attachment:', error);
        throw error;
    }
};

const operatingAttachment = async (complaint_id, req) => {

    try {
        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        const item = await prisma[$table_complaint].findUnique({
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.case_id == null) {
            throw new Error('Case not found');
        }

        if(req.body.operating_id == null) {
            throw new Error('operating_id required');
        }

        const case_id = item.case_id;
        const operating_id = req.body.operating_id;

        // const operating_id = "CF280E330E1540E58B5083DA5D75E48F";

        const file_content = "UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0lMtuwjAQRfeV+g+Rt1Vi6KKqKgKLPpYtUukHGHsCVv2Sx7z+vhMCUVUBkQpsIiUz994zVsaD0dqabAkRtXcl6xc9loGTXmk3K9nX5C1/ZBkm4ZQw3kHJNoBsNLy9GUw2ATAjtcOSzVMKT5yjnIMVWPgAjiqVj1Ykeo0zHoT8FjPg973eA5feJXApT7UHGw5eoBILk7LXNX1uSCIYZNlz01hnlUyEYLQUiep86dSflHyXUJBy24NzHfCOGhg/mFBXjgfsdB90NFEryMYipndhqYuvfFRcebmwpCxO2xzg9FWlJbT62i1ELwGRztyaoq1Yod2e/ygHpo0BvDxF49sdDymR4BoAO+dOhBVMP69G8cu8E6Si3ImYGrg8RmvdCZFoA6F59s/m2NqciqTOcfQBaaPjP8ber2ytzmngADHp039dm0jWZ88H9W2gQB3I5tv7bfgDAAD//wMAUEsDBBQABgAIAAAAIQAekRq37wAAAE4CAAALAAgCX3JlbHMvLnJlbHMgogQCKKAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArJLBasMwDEDvg/2D0b1R2sEYo04vY9DbGNkHCFtJTBPb2GrX/v082NgCXelhR8vS05PQenOcRnXglF3wGpZVDYq9Cdb5XsNb+7x4AJWFvKUxeNZw4gyb5vZm/cojSSnKg4tZFYrPGgaR+IiYzcAT5SpE9uWnC2kiKc/UYySzo55xVdf3mH4zoJkx1dZqSFt7B6o9Rb6GHbrOGX4KZj+xlzMtkI/C3rJdxFTqk7gyjWop9SwabDAvJZyRYqwKGvC80ep6o7+nxYmFLAmhCYkv+3xmXBJa/ueK5hk/Nu8hWbRf4W8bnF1B8wEAAP//AwBQSwMEFAAGAAgAAAAhAH0acVLLBwAAg0oAABEAAAB3b3JkL2RvY3VtZW50LnhtbOxcXW/TVhi+n7T/YPlqk0Yc2/loI1pU2sGQtqkCpl27jpN4+Eu207S7WiqkdKPcMUrohiioygbqBAw259/4p+y87znHSevC3BQExIHS+Hw9Ph+P3/d5jw85f2HDtoR1ww9M11kQ5UJRFAxHd+um01wQv7t+6dycKASh5tQ1y3WMBXHTCMQLi59+cr5Tq7t62zacUCAQTlDrePqC2ApDryZJgd4ybC0o2Kbuu4HbCAu6a0tuo2HqhtRx/bqkFOUiXnm+qxtBQO63rDnrWiAyOH0jG1rd1zqkMQCWJL2l+aGxMcKQTw1SlualuTSQMgEQGaEip6HUU0NVJOhVCqg0ERDpVQqpPBnSCYOrTIakpJGqkyGpaaS5yZBSdLLTBHc9wyGFDde3tZAk/aZka/6NtneOAHtaaK6ZlhluEsxihcNopnNjgh6RVgmCrdZPjVCVbLduWGqdo7gLYtt3aqz9uaQ9dL1G27OPpIVhZbstud28ZGyEVhDytn6WuaPNV5hhwVmTfMMi8+g6Qcv0EutgT4pGClscZP1NE7BuW7xex5MzPmqvM20rdBlGgFm6z9bOtmjP34woFzOsJkAkLbJ04eg9eU9swuDRjSeamrHJlTMaHw6gpAAqupHRWXCMOYYh6aOnG3DMjI8Vx6GrAjjmaGLljDbweGfGAIJ6WG+dCkXh8ypBWy3UWlqQEB0QjdN1qpzAbdpjc+Q1z/YgXPbdtjdCM8+GdmVkEjsgTk6BxR6o8Yc8OFtnrrU0j1hKW69daTqur61ZpEfk8RAIwwVcAfhNiAIfeGlsYD6stQA2RlwkqmrNrW/Cp0fKSjVP87UrhJRyWb20XJ5fFjGX+KQQcqvsD8mtEQVXv7ogFovLxbJagYo0a9U/IXPFaGhtK0yXrI5lYS9Wffy4Fm5apP+1dY14gK8MDfShLEpQFniaTlKkcM0gtoMMughoNLHUDl1WgeVrjdCALiXXx6ogpk9v619ynTCAioFumtfJohB0W/vB9S+adRMQWktOcGKBHoTHcxFZdy3X5wNRKvCXDeNHnqsqPGcZ7j2WJ7GeScnEAFR6mj/gIQDs2Eg6NZTvuIjkTp5vBIa/boiLcfQkjrpx9DyO7sTRNl7cj6NHcfQCLoY/kwsBYEIK9lFOxv/OQvmjH2Lm9R52ccn78fCnONqPhz2y8EIc7cGCQ9Z2PNyKo8dY7ylS40483EY69AVIQ+IQAIAtfcCIIvJbQNgX0DR6iBcP4uFNbE04dJNjbFNKxVFv+lklF6aRVyMKHRkb2EooP+rPyvPqsjynrmTwZ8Uvq6Wli5n9GauOt2RT985mcBKfcfJ8lC7OV5WVCoz8/fv3byECsL431s7i4BWlnKTSlSwT9JpaSRJX2yCXNFKR3tR0iE6qNUw/CL/GulXlPWqDZAawqDQ9imHigWXXEb/G0d9o/QfoGQ4wiW6F2HpecP/DNohnXv/Xzo86pQPPzo+nqBYiFAL7wI/hbSYToiHVFltY4yOSnu+OLuVi8Qvi4/JOmqMadYtHJ5nEKlqkxBwhq6DJE2QcKXpJQUn6YQEB9rHpA2xECrsC5+wrFLJ7+LuLlu1uHP1DzdphgevefYTvAWnJHQt4jxcU5jHv+DQp5HdH/g9eN79F4o/UtID8eQDcAyYQIu0yEwn5e/gU9IEnlE5Akh42JsluBilelC+Wl9SVijiTnvSmM+k5VV4i+pdtTUBygGY6t/JBlgsz8RD1CwIy4Tkazl105Nu5pUR+fOrr+NClO5Uj9cWYcS8e7uSVFkq5Us09MZhpAL0PsuoQ1dceKqtncfQL2+DOq+HIkRYnMRvblUgCx4e4PXEPc+jrsR7GhQOkyp2xjQy+1/UZRpRQeVA4tg/2uYBm5wCiQ/aP4u9jyLmH+LfhZ7iDFxBL9rErNJh9hlZsiLAYKkDoECGD72HksEMa/IaxZhfAx/txrJss1GWE3+dx6ABiZRZb0zgUg2B2nTwpu5gPEyVgY5K+X8jpE6IqubegaXZBZHoAhD3CpYQ/v/PtjkfYpssDW7C9uGMCxQOkFn073UfEuwjag70g1n6AFegTm7y+Zp5+ttmcVz5OtNmMPKX1qM3tz7afc02j1BGJxAMfopkZeczpJ8qiPKXuPbtR6XOH9QfKsQHygfz8Sb1dl7EBWHMLWYMvCHijKLfeaCaPiOl4RbnwCBwQeKXE59CTWAfokXK+R6XkR7gQUuznNl7KvT0ggT889E9RmSZxEEQz7JXyuHUgduEv+kqQvVhOqdnpFx/KTHxwlhxikEuj5R6eG9ih+mOLag70InwbCbTqS8KamRAhk1iavQKZCZFMTKlWZkIkD682ZpHJW1YiybZvDjSJOtMknC8DVBm7lDsCihLKi1v8/RJsuc4UiFqaKZCZAskyUUopP7vveZYgc7k6XZGIDTyuyQ7a9KjwoHojOcvJ3wSfJDOOTJl04mlnWS3K6nxVFU992jl9sBnR2eQfW4OW6ZCaenDCkKFf/BPnyNDD1WR1j8M3r8GkdkjHFfLo4yrCtwHMldiRZK/5jQaNQ9cj+SVaxTebrXCUXHPD0LVHactojJW2DK0Op6bhlDNJNlwXD1GzZLMdsv+vzxkBw2N0TQ5G1139sg/fbIAHqlfNUCe9hCPWdNx0iHhJv95AGn171OJ/AAAA//8DAFBLAwQUAAYACAAAACEA1mSzUfQAAAAxAwAAHAAIAXdvcmQvX3JlbHMvZG9jdW1lbnQueG1sLnJlbHMgogQBKKAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACskstqwzAQRfeF/oOYfS07fVBC5GxKIdvW/QBFHj+oLAnN9OG/r0hJ69BguvByrphzz4A228/BineM1HunoMhyEOiMr3vXKnipHq/uQRBrV2vrHSoYkWBbXl5sntBqTkvU9YFEojhS0DGHtZRkOhw0ZT6gSy+Nj4PmNMZWBm1edYtyled3Mk4ZUJ4wxa5WEHf1NYhqDPgftm+a3uCDN28DOj5TIT9w/4zM6ThKWB1bZAWTMEtEkOdFVkuK0B+LYzKnUCyqwKPFqcBhnqu/XbKe0y7+th/G77CYc7hZ0qHxjiu9txOPn+goIU8+evkFAAD//wMAUEsDBBQABgAIAAAAIQC29GeY0gYAAMkgAAAVAAAAd29yZC90aGVtZS90aGVtZTEueG1s7FlLixtHEL4H8h+Guct6zehhrDXSSPJr1zbetYOPvVJrpq2eadHd2rUwhmCfcgkEnJBDDLnlEEIMMcTkkh9jsEmcH5HqHkkzLfXEj12DCbuCVT++qv66qrq6NHPh4v2YOkeYC8KSjls9V3EdnIzYmCRhx719MCy1XEdIlIwRZQnuuAss3Is7n392AZ2XEY6xA/KJOI86biTl7Hy5LEYwjMQ5NsMJzE0Yj5GELg/LY46OQW9My7VKpVGOEUlcJ0ExqL0xmZARdg6USndnpXxA4V8ihRoYUb6vVGNDQmPH06r6EgsRUO4cIdpxYZ0xOz7A96XrUCQkTHTciv5zyzsXymshKgtkc3JD/beUWwqMpzUtx8PDtaDn+V6ju9avAVRu4wbNQWPQWOvTADQawU5TLqbOZi3wltgcKG1adPeb/XrVwOf017fwXV99DLwGpU1vCz8cBpkNc6C06W/h/V671zf1a1DabGzhm5Vu32saeA2KKEmmW+iK36gHq92uIRNGL1vhbd8bNmtLeIYq56IrlU9kUazF6B7jQwBo5yJJEkcuZniCRoALECWHnDi7JIwg8GYoYQKGK7XKsFKH/+rj6Zb2KDqPUU46HRqJrSHFxxEjTmay414FrW4O8urFi5ePnr989PvLx49fPvp1ufa23GWUhHm5Nz9988/TL52/f/vxzZNv7XiRx7/+5avXf/z5X+qlQeu7Z6+fP3v1/dd//fzEAu9ydJiHH5AYC+c6PnZusRg2aFkAH/L3kziIEMlLdJNQoAQpGQt6ICMDfX2BKLLgeti04x0O6cIGvDS/ZxDej/hcEgvwWhQbwD3GaI9x656uqbXyVpgnoX1xPs/jbiF0ZFs72PDyYD6DuCc2lUGEDZo3KbgchTjB0lFzbIqxRewuIYZd98iIM8Em0rlLnB4iVpMckEMjmjKhyyQGvyxsBMHfhm327jg9Rm3q+/jIRMLZQNSmElPDjJfQXKLYyhjFNI/cRTKykdxf8JFhcCHB0yGmzBmMsRA2mRt8YdC9BmnG7vY9uohNJJdkakPuIsbyyD6bBhGKZ1bOJIny2CtiCiGKnJtMWkkw84SoPvgBJYXuvkOw4e63n+3bkIbsAaJm5tx2JDAzz+OCThC2Ke/y2EixXU6s0dGbh0Zo72JM0TEaY+zcvmLDs5lh84z01QiyymVss81VZMaq6idYQK2kihuLY4kwQnYfh6yAz95iI/EsUBIjXqT5+tQMmQFcdbE1XuloaqRSwtWhtZO4IWJjf4Vab0bICCvVF/Z4XXDDf+9yxkDm3gfI4PeWgcT+zrY5QNRYIAuYAwRVhi3dgojh/kxEHSctNrfKTcxDm7mhvFH0xCR5awW0Ufv4H6/2gQrj1Q9PLdjTqXfswJNUOkXJZLO+KcJtVjUB42Py6Rc1fTRPbmK4RyzQs5rmrKb539c0Ref5rJI5q2TOKhm7yEeoZLLiRT8CWj3o0Vriwqc+E0LpvlxQvCt02SPg7I+HMKg7Wmj9kGkWQXO5nIELOdJthzP5BZHRfoRmsExVrxCKpepQODMmoHDSw1bdaoLO4z02Tker1dVzTRBAMhuHwms1DmWaTEcbzewB3lq97oX6QeuKgJJ9HxK5xUwSdQuJ5mrwLST0zk6FRdvCoqXUF7LQX0uvwOXkIPVI3PdSRhBuENJj5adUfuXdU/d0kTHNbdcs22srrqfjaYNELtxMErkwjODy2Bw+ZV+3M5ca9JQptmk0Wx/D1yqJbOQGmpg95xjOXN0HNSM067gT+MkEzXgG+oTKVIiGSccdyaWhPySzzLiQfSSiFKan0v3HRGLuUBJDrOfdQJOMW7XWVHv8RMm1K5+e5fRX3sl4MsEjWTCSdWEuVWKdPSFYddgcSO9H42PnkM75LQSG8ptVZcAxEXJtzTHhueDOrLiRrpZH0Xjfkh1RRGcRWt4o+WSewnV7TSe3D810c1dmf7mZw1A56cS37tuF1EQuaRZcIOrWtOePj3fJ51hled9glabuzVzXXuW6olvi5BdCjlq2mEFNMbZQy0ZNaqdYEOSWW4dm0R1x2rfBZtSqC2JVV+re1ottdngPIr8P1eqcSqGpwq8WjoLVK8k0E+jRVXa5L505Jx33QcXvekHND0qVlj8oeXWvUmr53Xqp6/v16sCvVvq92kMwioziqp+uPYQf+3SxfG+vx7fe3cerUvvciMVlpuvgshbW7+6rteJ39w4Byzxo1IbtervXKLXr3WHJ6/dapXbQ6JX6jaDZH/YDv9UePnSdIw32uvXAawxapUY1CEpeo6Lot9qlplerdb1mtzXwug+Xtoadr75X5tW8dv4FAAD//wMAUEsDBBQABgAIAAAAIQAZJC5INQQAAPcLAAARAAAAd29yZC9zZXR0aW5ncy54bWy0Vttu2zgQfV9g/8HQ8yq6xFZSoU5RO/UmRbxdVC72mRIpiwgvAknZcRf77zukRMtpiiJpkRebnDNzZjgczujtuwfOJjuiNJViHiRncTAhopKYiu08+LJZhZfBRBskMGJSkHlwIDp4d/X7b2/3uSbGgJqeAIXQOa/mQWNMm0eRrhrCkT6TLREA1lJxZGCrthFH6r5rw0ryFhlaUkbNIUrjOAsGGjkPOiXygSLktFJSy9pYk1zWNa3I8Oct1HP89ibXsuo4EcZ5jBRhEIMUuqGt9mz8Z9kAbDzJ7keH2HHm9fZJ/Izj7qXCR4vnhGcNWiUrojVcEGc+QCpGx9MnREffZ+B7OKKjAvMkdqvTyGcvI0ifEGQVeXgZx+XAEYHlKQ/FL+PJjjx0TGyS/VwwJwQaG9y8iCX1eY2sLTKoQfpYRZaRvCyo2ZHuwMccafacqumhO1oqpPo3OZQMr/LbrZAKlQzCgdKZwO1PXHT2F5Jo/9ySPDi5zUNwBT3iq5R8ss9boip4KNBg4jiILADlKevCIAMUuW4JY67jVIwg8LjPtwpx6BVe4mwwqVHHzAaVhZEtKO0QHOwiHSirBilUGaKKFlXAtpTCKMm8HpZ/SbOEvqPgWQwWrgvZFWpbdlgogu7B8HPHiD5RKPpGB0QCccjAo+a1lpjYgDtFn39V1sAFlcxOI/nWkYTGrCgmG5v5whwYWcGZCvqVvBf4Y6cNBUbXwn4hgh8FQIT1/AlqZXNoyYog00H2XsmZu6AVo+2aKiXVrcBQMq/mjNY1UeCAQgmuoaqoknuX5xuCMMzDV/LbafIPKMNTPd9Atd4vpDGS3xzaBnL9azfpnkF0WtUw1bH2i89SmqNqvIxn59myj9SiIxJ/uJi+X3wPGW2iIzfP7dz7W/mVLdAJ7y2WiJeKosnaTsbIapTqfkGFx0sC7YecIkVXejAMe0BzxNgKUuUBd0yeY6rba1K7NVsjtR15Bw31XSk0kY9HLtuUiPpTya7t0b1CbV94XiWZTgdLKswd5V6uu7LwVgIa5gnUCfxpp1yexvTscwMX6R7wHXIF4XSJCL8U9gpLiuHSTRNubob6Yaqwd0/W0Jz6Eiq3yTxgdNuYxJoY2GH4nnKbcpsOWOqwtMfcBlX2oKA9LEZZ6mUneudedj7Kpl42HWUzL5uNsszLMitroGkoaOz3UM1+aeW1ZEzuCb4Z8SeiPgm6QS257vs+VJvsBcMg0JNdTh5gqhBMDXymthRz9GCHTJpZ80GboYPszCNdi1nl9jGDHcDD+40eGbuK/yYWO48qCtVZHHg5jpmzPnBGNbz9FiaSkcpjfzgsmeZYVrd2aE57eXqZzrI4u+jhmZtkxrUHO41IvUCa4AHzprPe9N/k4k0WJ9MsjFdpEk6zxSxcZKtpmKbLJPtw+eYiXcb/DW/Wf7Ff/Q8AAP//AwBQSwMEFAAGAAgAAAAhAM+0DJS0DAAAoHkAAA8AAAB3b3JkL3N0eWxlcy54bWzknVtz27oRx9870+/A0VP7kMjyRc7xHOdM4iS159iJT+w0zxAJWahJQiUpX/rpC4CgBHkJigtuPWemL4lFcn8EsftfYHn99benLI0eeFEKmZ+OJm/3RhHPY5mI/O509OP2y5t3o6isWJ6wVOb8dPTMy9Fv7//6l18fT8rqOeVlpAB5eZLFp6NFVS1PxuMyXvCMlW/lkudq5VwWGavUz+JunLHifrV8E8tsySoxE6monsf7e3vTkcUUfShyPhcx/yTjVcbzytiPC54qoszLhViWDe2xD+1RFsmykDEvS3XQWVrzMibyNWZyCECZiAtZynn1Vh2MbZFBKfPJnvkrSzeAIxxgHwCmMX/CMd5ZxlhZuhyR4DjTNUckDiesMQ6gTKpkgaLsN/061rasYgtWLlwixzXqaI17znQfZfHJxV0uCzZLFUl5PVKOiwxY/6uOX/9n/uRPZrk+hNF7pYVExp/4nK3SqtQ/i+vC/rS/zH9fZF6V0eMJK2MhblUD1V4yoXZ4/iEvxUit4aysPpSCta5c6D9a18Rl5Sz+KBIxGus93vMiV6sfWHo62q8Xlf9ZL1gvOdONqpe9q5elLL9rlvH8zY8bt3HOopna1emoWry5PTeGk8OTVNyxalWoxKB/GUKdP4rkTB0/f6pWLNUbj23H1P873bV8+cu0csliYRrF5hVXaWIy3dMtSIXOSvtHvzQ/vq+089iqknYnBlD/v8aOgcdU9lC55KZOaWotn1/K+J4nN5VacToy+1ILf1xcF0IWKm2djn4x+1QLb3gmzkWS8NzZMF+IhP9c8PxHyZPN8j++mNRjF8Rylau/D46nJorSMvn8FPOlTmRqbc60T79qg1RvvRKbnRvzfzewiXVbm/2CM53No8lLhGk+CrGvLUrnaNuZqxfHbrZC7ejgtXZ0+Fo7OnqtHU1fa0fHr7Wjd6+1I4P5X+5I5IkaOMz2cDeAuovjUSOa4xEbmuPREprjkQqa41ECmuMJdDTHE8dojidMEZxKxr4odIL9wBPt3dzdY0QYd/eQEMbdPQKEcXcn/DDu7vwext2dzsO4u7N3GHd3ssZz66lWdKFklleDVTaXssplxSM96R1MY7limRKXhqcHPV6QHCQBps5sdiAeTIuZ+b07QoxIw8fzSleKkZxHc3GnS57BDef5A0/lkkcsSRSPEFhwVZR5eiQkpgs+5wXPY04Z2HRQXQlG+SqbEcTmkt2RsXieEHdfQyRJCuuAVvXzQotEEAR1xuJCDm+aZGT54VKUw/tKQ6KPqzTlRKyvNCFmWMNrA4MZXhoYzPDKwGCGFwaOz6i6yNKIesrSiDrM0oj6rY5Pqn6zNKJ+szSifrO04f12K6rUpHh31jHpf+7uLJX6osTgdtyIu9yclR1MsudMo2tWsLuCLReRPqvdjnWPGbufjzJ5jm4pxrQ1iWpeb0JEn8sW+Wp4h27RqMS15hHJa80jEtiaN1xiV2qarCdo5zT1zM1qVrWK1pB6ifaGpat6QjtcbawaHmEbAXwRRUkmg3YsQQR/1dNZ7U6KzLdp5fCGbVjDZfUyK5E2zyIJWpnK+J4mDZ8/L3mhyrL7waQvMk3lI0/oiDdVIetYcyW/b1zSS/Kfs+WClcLUSluI/kN9cztDdMWWgw/oOmUip/Hb5zcZE2lEN4M4v726jG7lUpeZumNogB9lVcmMjGnPBP7tJ5/9naaBH1QRnD8THe0HotNDBnYmCAaZmiQTIpKaZopckIyhhvc7f55JViQ0tOuC13cQVZyIeMOyZT3pINCWyouPKv8QzIYM75+sEPq8EJWobklgzmnDcjX7F4+Hp7qvMiI5M/RtVZnzj2aqa6zpcMOnCVu44VME4001POj4JTjYLdzwg93CUR3sWcrKUngvoQbzqA634VEf7/Diz/JkKov5KqXrwAZI1oMNkKwLZbrK8pLyiA2P8IANj/p4CUPG8AhOyRnePwqRkDnDwKg8YWBUbjAwKh8YGKkDht+h48CG36bjwIbfq1PDiKYADowqzkiHf6KrPA6MKs4MjCrODIwqzgyMKs4OPkV8PleTYLohxkFSxZyDpBto8opnS1mw4pkI+Tnld4zgBGlNuy7kXD9aIvP6Jm4CpD5HnRJOtmsclZN/8hlZ0zSLsl0EZ0RZmkpJdG5tM+AYy+1713aZmSdBBjfhOmUxX8g04YXnmPy2ql6+qR/LeNl804xepz0vxd2iim4W67P9Lma6t9OyKdi3zHbvsK3Pp/aBmFazK56IVdY0FD5MMT3ob2wiesv4cLfxZiaxZXnU0xLuc7rbcjNL3rI87mkJ99k8XrTL0uh0y7JLD59Ycd8aCMdd8bOu8TzBd9wVRWvj1t12BdLasi0Ej7uiaEsq0Yc41lcLoHf6acZv3088fnuMivwUjJz8lN668iO6BPadPwg9smOSptnf+u4JkPfNJLpX5vxjJevz9lsXnPo/1HWhJk55yaNWzkH/C1dbWcbfj73TjR/RO+/4Eb0TkB/RKxN5zVEpyU/pnZv8iN5Jyo9AZys4IuCyFbTHZStoH5KtICUkWw2YBfgRvacDfgRaqBCBFuqAmYIfgRIqMA8SKqSghQoRaKFCBFqocAKGEyq0xwkV2ocIFVJChAopaKFCBFqoEIEWKkSghQoRaKEGzu295kFChRS0UCECLVSIQAvVzBcHCBXa44QK7UOECikhQoUUtFAhAi1UiEALFSLQQoUItFAhAiVUYB4kVEhBCxUi0EKFCLRQ60cNw4UK7XFChfYhQoWUEKFCClqoEIEWKkSghQoRaKFCBFqoEIESKjAPEiqkoIUKEWihQgRaqOZi4QChQnucUKF9iFAhJUSokIIWKkSghQoRaKFCBFqoEIEWKkSghArMg4QKKWihQgRaqBDRFZ/2EqXvNvsJ/qyn9479/peubKO+u49yu6iD/qimVX5W/2cRPkp5H7U+eHhg6o1+EDFLhTSnqD2X1V2uuSUCdeHz21n3Ez4ufeBLl+yzEOaaKYAf9rUE51QOu0LetQRF3mFXpLuWYNZ52JV9XUswDB52JV2jy+amFDUcAeOuNOMYTzzmXdnaMYdd3JWjHUPYw12Z2TGEHdyVjx3Do0gn55fWRz37abq+vxQQusLRIRz7CV1hCX3VpGMojL5O8xP6es9P6OtGPwHlTy8G71g/Cu1hPyrM1VBmWFeHC9VPwLoaEoJcDTDhroaoYFdDVJirYWLEuhoSsK4OT85+QpCrASbc1RAV7GqICnM1HMqwroYErKshAevqgQOyFxPuaogKdjVEhbkaTu6wroYErKshAetqSAhyNcCEuxqigl0NUWGuBlUy2tWQgHU1JGBdDQlBrgaYcFdDVLCrIarL1eYsyparUR52zHGTMMcQNyA7hrjk7BgGVEuOdWC15BACqyXoq8bnuGrJdZqf0Nd7fkJfN/oJKH96MXjH+lFoD/tRYa7GVUttrg4Xqp+AdTWuWvK6GlctdboaVy11uhpXLfldjauW2lyNq5baXB2enP2EIFfjqqVOV+OqpU5X46olv6tx1VKbq3HVUpurcdVSm6sHDsheTLircdVSp6tx1ZLf1bhqqc3VuGqpzdW4aqnN1bhqyetqXLXU6WpctdTpaly15Hc1rlpqczWuWmpzNa5aanM1rlryuhpXLXW6GlctdboaVy1dKRNB8Aqom4wVVUT3vrhzVi4qNvzlhD/ygpcyfeBJRHuol6ijHD9uff5Ks823/dT2leoz/QZ053GlpH4DrAWaDS+S9WeqtLFuSWS/HmYXmwbby7X1Ho3hjl2t4fZa8QTgNx+3MnuYMXVU33RvgJ1rxzfLG9zZghX12k1INttY0W3a/HhSlCJpVu/tne0dHUzP6q3AR8pm+gVh6nAme+ZBqvrnh1Ul7Sa295pvmdVbmV9wI/uJs8P19862P3H2eCLrNzpdPqTr1lm32na1foDudHQrMl5GX/lj9F1mzMTe5htvLSvNB+ha18QlXFw7pP73rDT/u9+jO7C5efNBuiZTuh+ks8vavyuXy5zbA22+JOeJqlg5msX2jWieALZvNl4/mmfea/wy3jyvP/bEkI3KjQrr7bY02KmGSqfRjjabNNupvDoTe4PcRvmuFqr2zNI6iNQfF7mWwaP9CF3d0uSJ1Si1/oyn6RWrt5ZL/6Ypn1f12smeeRHGi/Wz+p2OXvvCDP5ewHi7MfXP7jipv/Jg70rxJjo9wrV0t7lFamhP94zheFWqrjH5+mX7tpLby1balWrmtMl9L5Jmqw68KXRH+vSnzP/7nNQ+0tWq/clnPj3XryRtc5w72g2R+p9zmPszjGZurNjZtPM9VXtz1tb3VOtl2FBp/irf/xcAAP//AwBQSwMEFAAGAAgAAAAhAPv3r6YpAgAAdg4AABQAAAB3b3JkL3dlYlNldHRpbmdzLnhtbOyXbWvbMBDH3w/2HYzeN36InxKaFLLSMRhjdN0HUCQlFpN0RlLipJ9+sp0HtymjHqzdC/uFdT75frm7Pyec65udFN6WacNBzVA4CpDHFAHK1XqGfj7cXeXIMxYrigUoNkN7ZtDN/OOH62paseUPZq1703iOosxUkhkqrC2nvm9IwSQ2IyiZcpsr0BJb96jXvsT616a8IiBLbPmSC273fhQEKTpg9GsosFpxwm6BbCRTton3NROOCMoUvDRHWvUaWgWalhoIM8bVI0XLk5irEyaML0CSEw0GVnbkijlk1KBceBg0lhRnQNIPEF0AUsJ2/Rj5geG7yC6H036c9MThtMP5u2Q6AEMtLXpRomNf/ToWW1xgU3SJrF9SyQm3l3WPJJl+WSvQeCkcyanuOeG8BlzfXf310phs1/jrEtDcDQTlW3NYvWpatzhJg0mc5OOg2V8C3d82e1ss3LAhv/a6cfjKVvboDU7ee74uXnA/QHnpXIC1IJ/5XR4LqmvLnmOUG2PkHsxj/V5tlJiwg01AgJs+vLHQIkQns36RyycZ9YvV3cr7hPrnolvzqRxhmuXjPAkGPf4TPfLIXZNxkg96vLUe7XH1qeCCPhMlivM0jMIka0QZ2v/G7Q+TMM+iII6G9v/706hdjzq8dEZlYRwmk3EWD3K8xzSkmft8miST4TB6t2n4o7dOAUrLJX9kd6AXGirDdJMZFgKq798+t7/V+bc4/w0AAP//AwBQSwMEFAAGAAgAAAAhAKurwLkoAgAAlQgAABIAAAB3b3JkL2ZvbnRUYWJsZS54bWzclN2OmzAQhe8r9R2Q7zcY8rNptGTVbTdSpaoXq+0DOMaAVWwjjxOSt+/YkCxVlGqp1K3UXBBzxvMxcxh8d39QdbQXFqTRGUkmlERCc5NLXWbk+/PmZkkicEznrDZaZOQogNyv37+7a1eF0Q4izNewUjwjlXPNKo6BV0IxmJhGaAwWxirm8NaWsWL2x6654UY1zMmtrKU7ximlC9Jj7GsopigkF58N3ymhXciPraiRaDRUsoETrX0NrTU2b6zhAgB7VnXHU0zqMyaZXYCU5NaAKdwEm+krCihMT2hYqfoFMB8HSC8ACy4O4xjLnhFj5pAj83GcxZkj8wHnz4oZACB3eTWKkp58jX0uc6xiUA2JYlxR8zPuqLxHiq++lNpYtq2RhG89whcXBbC/Yv/+LyzFIei+BbLuP4WoXWmmMPMTq+XWyhBomDYgEoztWZ0R7GFD59T3ktIZnforif1GXjELwkO6jbSTC6ZkfTyp0EqALtBIx6uTvmdW+qq7EMgSAzvY0ow8zihNHzcb0ikJVofznc5uH3ol9c8Kvw+9Mj0r1Cs8cMJt0nF44Jz34DPjzoFLJ9BfyaJvor1ixgNaMOvtCJb8VTOWSah4+mLGsNFfzDgp18zwpGScGc9SCfBeRE9GMX3FkZQu0JM5uuLHZDrKERu4o8aDXowHKrfL+ZuMx0ddAtO/m4+3dePfzkd/bERfZVm5q4eHPzL+08OjX8D6JwAAAP//AwBQSwMEFAAGAAgAAAAhAK7zUSx8AQAACwMAABEACAFkb2NQcm9wcy9jb3JlLnhtbCCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIyS30/DIBCA3038HxreW2jnpjZdNWr2pImJMxrfEM4NV34E2Or+e2m7dTYuxjeO+/g47iiuvmQVbcA6odUUpQlBESimuVCLKXqez+ILFDlPFaeVVjBFW3Doqjw9KZjJmbbwaLUB6wW4KJiUy5mZoqX3JsfYsSVI6pJAqJD80FZSH0K7wIayFV0AzgiZYAmecuopboSx6Y1op+SsV5q1rVoBZxgqkKC8w2mS4gPrwUp39ECb+UFK4bcGjqL7ZE9/OdGDdV0n9ahFQ/0pfn24f2qfGgvV9IoBKgvOci98BWWBD8uwcuv3T2C+2+6DsGYWqNe2ZEtqAUIXlKGCU3W9kFRUCdOyPbLHmgGsYFtry12QDaKAcXDMCuPDWLurBhuBrqjzD2HOHwL4zfbPW3/TjcDCRjS/pkxbog+L3Qi6SoFHoXV51+h95mV0ezefoTIj2VlMsjgdz8kkH1/mhLw1xQ7OH4RyV8A/jec5yYbGvaDr1/D7lt8AAAD//wMAUEsDBBQABgAIAAAAIQAtab3ZcwEAAMYCAAAQAAgBZG9jUHJvcHMvYXBwLnhtbCCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJxSy07DMBC8I/EPUe6tExBNVW1doSLEgZfUAGfL2SQWjm3ZbkX/ng2hIYgbOe3M7o5mJ4bNR6eTA/qgrFmn+TxLEzTSVso06/SlvJ0t0yREYSqhrcF1esSQbvj5GTx769BHhSEhCRPWaRujWzEWZIudCHNqG+rU1nciEvQNs3WtJN5Yue/QRHaRZQuGHxFNhdXMjYLpoLg6xP+KVlb2/sJreXSkx6HEzmkRkT/2mxrYSEBpo9Cl6pBfEj0CeBYNBp4DGwp4s74inBfAhhK2rfBCRgqPLwoanGC4dk4rKSLFyh+U9DbYOiZPX16Tfh/YdATI/w7l3qt45BmwKYR7ZcjAFbChIGdeNF649tveiGAnhcYtXc5roQMC+yFgazsnDMmxsSK99/DiSnvTJ/G98pucHPmmYrtzQpKFYllMz510YEcsVuR/tDAScEd/w+ten3ZNg9Vp5m+jD/B1eJY8X8wz+r4SO3F09/he+CcAAAD//wMAUEsBAi0AFAAGAAgAAAAhAN+k0mxaAQAAIAUAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECLQAUAAYACAAAACEAHpEat+8AAABOAgAACwAAAAAAAAAAAAAAAACTAwAAX3JlbHMvLnJlbHNQSwECLQAUAAYACAAAACEAfRpxUssHAACDSgAAEQAAAAAAAAAAAAAAAACzBgAAd29yZC9kb2N1bWVudC54bWxQSwECLQAUAAYACAAAACEA1mSzUfQAAAAxAwAAHAAAAAAAAAAAAAAAAACtDgAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVsc1BLAQItABQABgAIAAAAIQC29GeY0gYAAMkgAAAVAAAAAAAAAAAAAAAAAOMQAAB3b3JkL3RoZW1lL3RoZW1lMS54bWxQSwECLQAUAAYACAAAACEAGSQuSDUEAAD3CwAAEQAAAAAAAAAAAAAAAADoFwAAd29yZC9zZXR0aW5ncy54bWxQSwECLQAUAAYACAAAACEAz7QMlLQMAACgeQAADwAAAAAAAAAAAAAAAABMHAAAd29yZC9zdHlsZXMueG1sUEsBAi0AFAAGAAgAAAAhAPv3r6YpAgAAdg4AABQAAAAAAAAAAAAAAAAALSkAAHdvcmQvd2ViU2V0dGluZ3MueG1sUEsBAi0AFAAGAAgAAAAhAKurwLkoAgAAlQgAABIAAAAAAAAAAAAAAAAAiCsAAHdvcmQvZm9udFRhYmxlLnhtbFBLAQItABQABgAIAAAAIQCu81EsfAEAAAsDAAARAAAAAAAAAAAAAAAAAOAtAABkb2NQcm9wcy9jb3JlLnhtbFBLAQItABQABgAIAAAAIQAtab3ZcwEAAMYCAAAQAAAAAAAAAAAAAAAAAJMwAABkb2NQcm9wcy9hcHAueG1sUEsFBgAAAAALAAsAwQIAADwzAAAAAA==";

        const file_name = "1.สกัดจับยาบ้า 5 แสนเม็ด ปาเจโรแหกด่าน ก่อนจนมุม สารภาพได้ค่าจ้าง 1.docx";
        const params = {
            'token_id': tokenId,
            'case_id': case_id, /* string รหัสเรื่องที่ใช้ในการอ้างอิงภายในระบบ */
            'operating_id': operating_id,
            'file_name': file_name,
            'file_content': file_content, /* string (base64)  */
            'file_description': 'ทดสอบเอกสารประกอบ Tong freedom 1.1',
            'doc_type_id': '8', /* เอกสารประกอบ */
            'doc_type': 'X', /* ประเภทรายการเอกสาร I=หนังสือรับ,O=หนังสือส่งออก,X=ไม่ระบุ */
            'doc_no': '', /* เลขที่หนังสือ (รับ/ส่ง) */
            'doc_date': '', /* วันที่ของหนังสือ ตัวอย่าง 2015-12-31 15:23:59 */
            'doc_ref_no': '', /* เลขที่หนังสืออ้างอิง  (ไม่จำเป็นต้องระบุ) */
            'doc_ref_date': '', /* วันที่ของหนังสืออ้างอิง  (ไม่จำเป็นต้องระบุ) */
            'document_no': '', /* เลขที่เอกสาร (ไม่จำเป็นต้องระบุ) */
            'document_date': '', /* วันที่เอกสาร (ไม่จำเป็นต้องระบุ) */
        };

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const url = opmUrl + "/SOAP/Officer.asmx/OperatingAttachment";
        const response = await axios.post(url, params, config);
        console.log(response);
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error setting org summary result:', error);
        throw error;
    }
};

const parseXmlResponse = async (xmlData) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xmlData, (err, result) => {
            if (err) {
                console.error('XML parsing error:', err);
                reject(err);
                return;
            }

            if (result && result.string && result.string._) {
                try {
                    const jsonData = JSON.parse(result.string._);
                    const tokenId = jsonData.token_id;
                    // resolve(tokenId);
                    resolve(jsonData);
                } catch (jsonError) {
                    console.error('JSON parsing error:', jsonError);
                    reject(jsonError);
                }
            } else {
                console.log('Unexpected XML structure:', result);
                reject(new Error('Unexpected XML structure'));
            }
        });
    });
};

const convertDateString = (dateString) => {

           // Check if the input is a string and matches the expected format
    if (typeof dateString !== 'string' || !/^\/Date\(\d+\)\/$/.test(dateString)) {
        throw new Error('Input must be a string in the format /Date(timestamp)/');
    }

    // Extract the timestamp from the string
    const timestamp = parseInt(dateString.match(/\d+/)[0], 10);

    // Check if the extracted timestamp is a valid number
    if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp in the input string');
    }

    // Create a Date object
    const date = new Date(timestamp);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }

    return date;
};

const saveComplaint = async (caseItem) => {

    try {
        const case_id = caseItem.case_id;
        const complaint_title = caseItem.summary;
        const complaint_detail = caseItem.detail;
        const is_anonymous = caseItem.is_secret == "T" ? 1 : 0;
        const complaint_channel_id = 3; // ศูนย์รับเรื่องราวร้องทุกข์ของรัฐบาล 1111
        const case_area = caseItem.case_area;

        let complainant_id = null;

        let subdistrict_text = null;
        let district_text = null;
        let province_text = null;
        let postcode = null;
        let prename = null;
        let firstname = null;
        let lastname = null;
        let citizen_id = null;

        if(caseItem.customer != null) {
            subdistrict_text = caseItem.customer.subdistrict_text;
            district_text = caseItem.customer.district_text;
            province_text = caseItem.customer.province_text;
            postcode = caseItem.customer.postcode;

            prename = caseItem.customer.salutation_th;
            firstname = caseItem.customer.firstname_th;
            lastname = caseItem.customer.lastname_th;
            citizen_id = caseItem.customer.citizen_id;
        }

        if(postcode != null) {
            postcode = postcode.trim();
        }

        const date_occurrenced_from = caseItem.date_occurrenced_from;
        const date_from = convertDateString(date_occurrenced_from);
        const date_from_iso = date_from.toISOString();

        const province_id = await provinceController.onGetId(province_text);
        const sub_district_id = await subDistrictController.onGetId(subdistrict_text);
        const district_id = await districtController.onGetId(district_text);
        const prefix_name_id = await prefixNameController.onGetId(prename);

        const upsertComplainant = await prisma[$table_complainant].upsert({
            where: {
                // Assuming case_id is unique
                case_id: case_id,
            },
            update: {
                uuid: uuidv4(),
                prefix_name_id: prefix_name_id != null ? Number(prefix_name_id) : undefined,
                firstname: firstname,
                lastname: lastname,
                phone_number : uuidv4(),
                id_card: citizen_id != null ? helperController.base64EncodeWithKey(citizen_id) : undefined,
            },
            create: {
                uuid: uuidv4(),
                case_id: case_id,
                prefix_name_id: prefix_name_id != null ? Number(prefix_name_id) : undefined,
                firstname: firstname,
                lastname: lastname,
                phone_number : uuidv4(),
                id_card: citizen_id != null ? helperController.base64EncodeWithKey(citizen_id) : undefined,
            }
        });

        // console.log(upsertComplainant);

        if(upsertComplainant) {
            complainant_id = upsertComplainant.id;
            // console.log("decode_id" + helperController.base64DecodeWithKey(upsertComplainant.id_card));
        }

        const upsertedCase = await prisma[$table_complaint].upsert({
            where: {
                // Assuming case_id is unique
                case_id: case_id,
            },
            update: {
                // uuid: uuidv4(),
                complaint_title: complaint_title,
                complaint_detail: complaint_detail,
                is_anonymous: is_anonymous,
                complaint_channel_id: complaint_channel_id,
                incident_datetime: date_from_iso,
                incident_location: case_area,
                sub_district_id: sub_district_id,
                district_id: district_id,
                province_id: province_id,
                postal_code: postcode,
                complainant_id: complainant_id,
            },
            create: {
                uuid: uuidv4(),
                case_id: case_id,
                complaint_title: complaint_title,
                complaint_detail: complaint_detail,
                is_anonymous: is_anonymous,
                complaint_channel_id: complaint_channel_id,
                incident_datetime: date_from_iso,
                incident_location: case_area,
                sub_district_id: sub_district_id,
                district_id: district_id,
                province_id: province_id,
                postal_code: postcode,
            }
        });

        // console.log(upsertedCase);

    } catch (error) {
        console.error('Error saving complaint:', error);
        throw error;
    }
};

const getOperatings = async (complaint_id) => {
    try {
        const item = await prisma[$table_complaint].findUnique({
            where: {
                id: Number(complaint_id),
            },
        });

        if (!item) {
            throw new Error('Complaint not found');
        }

        if(item.case_id == null) {
            throw new Error('Case not found');
        }

        const case_id = item.case_id;

        const jsonData = await getToken();
        const tokenId = jsonData.token_id;
        if(tokenId == null) {
            throw new Error('Token not found');
        }

        let params = {
            'token_id': tokenId,
            'case_id': case_id,
            'select_org_id': "",
            'skip': 0,
            'take': 10,
        };

        const url = opmUrl + "/SOAP/Officer.asmx/GetOperatings";
        const response = await axios.get(url, { params });
        return await parseXmlResponse(response.data);
    } catch (error) {
        console.error('Error getting operatings:', error);
        throw error;
    }
};

const methods = {

// Route handler
    async onGetToken(req, res) {
        try {
            const jsonData = await getToken();
            const tokenId = jsonData.token_id;

            if(tokenId == null) {
                res.status(500).json({ msg: "Token not found" });
            }

            // res.status(200).json({ token_id: tokenId, msg: "success" });
            res.status(200).json({ token: jsonData, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },
    async onGetTimelineHeader(req, res) {

        try {
            const jsonData = await getTimelineHeader();
            const complaint = jsonData;
            res.status(200).json({ "complaint": complaint, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetCaseDetail(req, res) {
        try {
            console.log(req.params.id);
            const jsonData = await getCase(req.params.id);
            const caseDetail = jsonData;
            res.status(200).json({ "caseDetail": caseDetail, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onSyncAll(req, res) {
        try {
            const jsonData = await getTimelineHeader();
            const cases = jsonData;
            // console.log(cases);
            const results = await Promise.all(cases.map(async (caseItem, index) => {

                console.log(`Processing Case ${index + 1}:`);
                try{
                    const caseDetail = await getCase(caseItem.case_id);
                    // console.log(caseDetail);
                    await saveComplaint(caseDetail);

                    return { case_id: caseItem.case_id, case_detail: caseDetail };
                } catch (error) {
                    console.error(`Error processing case ${caseItem.case_id}:`, error);
                    return { caseId: caseItem.case_id, error: error.message };
                }

            }));

            // console.log('All cases processed:', results);
            res.status(200).json({ "results": results, msg: "success" });
            // res.status(200).json({ msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetAllCase(req, res) {
        try {
            const jsonData = await getTimelineHeader(req);
            const cases = jsonData;
            // console.log(cases);
            const results = await Promise.all(cases.map(async (caseItem, index) => {

                console.log(`Processing Case ${index + 1}:`);
                try{
                    const caseDetail = await getCase(caseItem.case_id);
                    // console.log(caseDetail);
                    await saveComplaint(caseDetail);

                    return { case_id: caseItem.case_id, case_detail: caseDetail };
                } catch (error) {
                    console.error(`Error processing case ${caseItem.case_id}:`, error);
                    return { caseId: caseItem.case_id, error: error.message };
                }

            }));

            // console.log('All cases processed:', results);
            res.status(200).json({ "results": results, msg: "success" });
            // res.status(200).json({ msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onAddOperating(req, res) {
        try {
            const jsonData = await addOperating(req.params.id, req);
            const operating = jsonData;
            res.status(200).json({ "operating": operating, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onSetOrgSummaryResult(req, res) {
        try {
            const jsonData = await setOrgSummaryResult(req.params.id, req);
            const OrgSummaryResult = jsonData;
            res.status(200).json({ "OrgSummaryResult": OrgSummaryResult, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetCase(req, res) {

        if(req.params.id == null) {
            throw new Error('complaint id required');
        }

        // console.log(req.params.id);

        try {

            const item = await prisma[$table_complaint].findUnique({
                where: {
                    id: Number(req.params.id),
                },
            });

            if (!item) {
                throw new Error('Complaint not found');
            }

            if(item.case_id == null) {
                throw new Error('Case not found');
            }

            const case_id = item.case_id;

            const jsonData = await getCase(case_id);
            const caseDetail = jsonData;
            res.status(200).json({ "caseDetail": caseDetail, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetOperatings(req, res) {
        try {
            const jsonData = await getOperatings(req.params.id);
            const operatings = jsonData;
            res.status(200).json({ "operatings": operatings, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onGetAttachment(req, res) {
        try {
            const jsonData = await getAttachment(req.params.id);
            const attachment = jsonData;
            res.status(200).json({ "attachment": attachment, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onListAttachments(req, res) {

        if(req.params.id == null) {
            throw new Error('complaint id required');
        }

        try {
            // const item = await prisma[$table_complaint].findUnique({
            //     where: {
            //         id: Number(req.params.id),
            //     },
            // });

            // if (!item) {
            //     throw new Error('Complaint not found');
            // }

            // if(item.case_id == null) {
            //     throw new Error('Case not found');
            // }

            // const case_id = item.case_id;

            // const jsonData = await getCase(case_id);
            // const caseDetail = jsonData;
            const jsonData = await getFirstOperating(req.params.id);
            const caseDetail = jsonData;

            // console.log('Case detail:', caseDetail);

            let attachments = [];
            if (caseDetail.attachments?.length > 0) {
                for (let i = 0; i < caseDetail.attachments.length; i++) {
                    const attachment = caseDetail.attachments[i];
                    // console.log(`Attachment ${i + 1}:`, attachment);

                    try {
                        const attachmentData = await getAttachment(attachment.attachment_id);

                        // Combine the original attachment info with the fetched data
                        const processedAttachment = {
                            // ...attachment,
                            ...attachmentData
                        };

                        attachments.push(processedAttachment);
                    } catch (error) {
                        console.error(`Error processing attachment ${i + 1}:`, error);
                        // You might want to add the original attachment with an error flag
                        attachments.push({ ...attachment, error: true, errorMessage: error.message });
                    }
                }
            }

            // console.log('All processed attachments:', attachments);

            res.status(200).json({ "attachments": attachments, msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    async onOperatingAttachment(req, res) {

        try {
            const jsonData = await operatingAttachment(req.params.id, req);
            const attachment = jsonData;
            res.status(200).json({ "operatingAttachment": attachment, msg: "success" });
            // res.status(200).json({ "operatingAttachment": "test", msg: "success" });
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

};

module.exports = { ...methods };
