// src/helper/response.js

const responseEmmiter = function (res, data) {
    switch (data.status) {
        case 200:
            let error = data.error != undefined ? data.error : true
            let response = {
                status: error,
                message: data.message != "" ? data.message : "records get successfully",
                data: data.data,
            };
            if (data.IsCEO !== undefined) {
                response.IsCEO = data.IsCEO
            }
            res.status(data.status).json(response);
            break;

        case 201:
            res.status(data.status).json({
                status: true,
                message: data.message != "" ? data.message : "records create successfully",
                data: data.data,
            });
            break;

        case 202:
            res.status(data.status).json({
                status: true,
                message: data.message != "" ? data.message : "records updated successfully",
                data: data.data,
            });
            break;

        case 204:
            res.status(data.status).json({
                status: true,
                message: data.message != "" ? data.message : "records deleted successfully",
                data: data.data,
            });
            break;

        case 400:
            res.status(data.status).json({
                status: false,
                statusCode: data.status,
                message: data.message != "" ? data.message : "Bad Request",
            });

            break;

        case 401:
            res.status(data.status).json({
                status: false,
                message: data.message != "" ? data.message : "Unauthorized access",
            });

            break;

        case 403:
            res.status(data.status).json({
                status: false,
                message: data.message != "" ? data.message : "requested resource is forbidden",
            });

            break;

        case 404:
            res.status(data.status).json({
                status: false,
                message: data.message || "Route Not Found",
            });

            break;

        case 422:
            res.status(data.status).json({
                status: false,
                message: data.message || "unprocessable entity",
            });

            break;

        case 409:
            res.status(data.status).json({
                status: false,
                message: data.message || "Already Exist",
                data: data.data
            });
            break;

        case 429:
            res.status(data.status).json({
                status: false,
                message: data.message || "Too many request",
            });

            break;

        case 500:
            res.status(data.status).json({
                status: false,
                message: data.message || "Something went wrong",
            });

            break;
        case 600:
            res.status(data.status).json(data.data);
            break;
    }
};

export default responseEmmiter