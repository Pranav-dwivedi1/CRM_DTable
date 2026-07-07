const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

const tenantMiddleware = (req, res, next) => {
  // Check if req.user is set (populated by protect middleware)
  const companyId = req.user?.companyId;
  const user = req.user;

  if (companyId) {
    tenantStorage.run({ companyId, user }, next);
  } else {
    next();
  }
};

module.exports = {
  tenantStorage,
  tenantMiddleware
};
