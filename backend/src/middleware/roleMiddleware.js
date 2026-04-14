export function authorize(...allowedRoles) {
  return function authorizeRoles(req, res, next) {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized. User context missing.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('You do not have permission to perform this action.'));
    }

    next();
  };
}
