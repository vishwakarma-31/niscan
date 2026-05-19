const { forbidden } = require('../utils/responseUtils');


function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access restricted to ${allowedRoles.join(', ')} only`);
    }

    next();
  };
}

module.exports = requireRole;