const { findAdmin } = require("../models/users");

module.exports = async (req, res, next) => {
  req.isAdmin = await findAdmin(req.session.userId, false);

  if (!req.isAdmin) {
    return res.status(401).send("");
  }

  return next();
};
