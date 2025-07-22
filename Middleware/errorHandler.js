const errorHandler = (error, req, res, next) => {
  let statusCode = res.statusCode ? res.statusCode : 500;
  // Show logs only in development mode
  if (process.env.NODE_ENV === "development") {
    console.log("statusCode: ", statusCode);
    console.log("errorHandlerFile: ", error);
  }

  if (error.code) {
    statusCode = error.code;
  }
  switch (statusCode) {
    case 400:
      res.json({
        succeess: false,
        title: "VALIDATION ERROR",
        message: error.message,
        stackTrace: error.stack,
      });
      break;
    case 401:
      res.json({
        succeess: false,
        title: "UNAUTHORIZED",
        message: error.message,
        stackTrace: error.stack,
      });
      break;
    case 403:
      res.json({
        succeess: false,

        title: "FORBIDDEN",
        message: error.message,
        stackTrace: error.stack,
      });
      break;
    case 404:
      res.json({
        succeess: false,
        title: "NOT FOUND",
        message: error.message,
        stackTrace: error.stack,
      });
      break;
    case 500:
      res.json({
        title: "SERVER ERROR",
        message: error.message,
        stackTrace: error.stack,
      });
    case 11000:
      res.status(400).json({
        title: "Duplicate value",
        message: "email or username is not available(duplicate value)",
        stackTrace: error.stack,
      });
  }
};

export default errorHandler;
