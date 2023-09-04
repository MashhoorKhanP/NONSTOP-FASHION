const User = require('../models/userModel');
const loggedIn = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user._id;
      const userData = await User.findOne({ _id: userId });
      if (userData.blocked) {
        req.session.destroy();
        req.app.locals.message = 'You have been blocked by the admin'
        return res.redirect('/login');
      } else {
        next();
      }
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    next(error)
  }
}
const loggedOut = (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect('/');
    }
    next();
  } catch (error) {
    next(error);
  }
}
module.exports = {
  loggedIn,
  loggedOut
}