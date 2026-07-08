// Usage: router.get('/route', protect, allowRoles('ADMIN', 'HOD'), controllerFn)
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This action requires one of: ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { allowRoles };
