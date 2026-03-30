const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function authenticate(req,res,next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).send('Invalid token');
  }
}

function authorize(roles = []) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).send('Forbidden');
}

module.exports = { authenticate, authorize };
