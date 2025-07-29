module.exports = function (req, res, next) {
  if (req.session.user && req.session.user.role === 'owner') {
    return res.redirect('/users/owner-dashboard');
  }
  if (req.session.user && req.session.user.role === 'admin') {
    return res.redirect('/users/dashboard');
  }
  next();
}; 