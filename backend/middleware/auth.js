const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies the JWT from the Authorization header.
 * Attaches the authenticated user to req.user for downstream use.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data (so revoked accounts can't use old tokens)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * authorizeRoles — restricts a route to specific roles.
 * Usage: authorizeRoles("admin") or authorizeRoles("admin", "member")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
