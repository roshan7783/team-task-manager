const { validationResult } = require("express-validator");

/**
 * validate — runs after express-validator checks.
 * If there are validation errors, returns a 400 with the first error message.
 * Otherwise passes control to the next handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

module.exports = validate;
