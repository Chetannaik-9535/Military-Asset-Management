// src/middlewares/rbacMiddleware.js
//
// Two complementary pieces of access control:
//
// 1. authorizeRoles(...roles)   -> coarse-grained: which roles may hit this route at all.
// 2. enforceBaseScope           -> fine-grained: Base Commanders (and Logistics Officers tied
//                                  to a base) are silently restricted to their own base's data,
//                                  regardless of what baseId they pass in the request.
//
// RBAC matrix (see README for the full table):
//   ADMIN               - unrestricted, all bases, all endpoints
//   BASE_COMMANDER       - read/write scoped to own base only; cannot manage users
//   LOGISTICS_OFFICER    - purchases + transfers only, scoped to own base if assigned one

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: insufficient authorization level for this action.',
      });
    }
    next();
  };
};

/**
 * Forces query/body baseId to the authenticated user's own base when they are
 * a Base Commander or a base-assigned Logistics Officer. Admins pass through
 * untouched. Applied AFTER authenticateToken.
 */
export const enforceBaseScope = (req, res, next) => {
  const { role, baseId } = req.user;

  if (role === 'ADMIN') {
    return next();
  }

  if (role === 'BASE_COMMANDER' || role === 'LOGISTICS_OFFICER') {
    if (!baseId) {
      return res.status(403).json({ message: 'Your account is not assigned to a base.' });
    }
    // Overwrite any client-supplied baseId — the user's own assignment always wins.
    req.query.baseId = String(baseId);
    if (req.body && typeof req.body === 'object') {
      req.enforcedBaseId = baseId; // controllers use this to validate body.baseId / sourceBaseId
    }
    return next();
  }

  return res.status(403).json({ message: 'Unrecognized role.' });
};
