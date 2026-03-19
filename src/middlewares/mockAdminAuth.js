

const mockAdminAuth = (req, res, next) => {
  req.user = {
    id: 1,
    name: "Admin User",
    email: "admin@company.com",
    role_id: 1,
    Role: { name: "admin" },
    role: "admin"
  };
  next();
};

export default mockAdminAuth;