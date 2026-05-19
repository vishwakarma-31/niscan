

function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

function error(res, message, statusCode = 400, code = 'ERROR') {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
}

function notFound(res, message = 'Resource not found') {
  return error(res, message, 404, 'NOT_FOUND');
}

function serverError(res, message = 'Internal server error') {
  return error(res, message, 500, 'INTERNAL_ERROR');
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401, 'UNAUTHORIZED');
}

function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403, 'FORBIDDEN');
}

function paginated(res, data, pagination) {
  return success(res, { ...data, pagination });
}

module.exports = {
  success,
  error,
  notFound,
  serverError,
  unauthorized,
  forbidden,
  paginated,
};
