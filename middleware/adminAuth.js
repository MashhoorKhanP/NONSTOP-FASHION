const loggedIn = (req, res, next) => {
    try {
        if (req.session.admin) {
            next();
        } else {
            return res.redirect('/admin');
        }
    } catch (error) {
        next(error)
    }
}
const loggedOut = (req, res, next) => {
    try {
        if (req.session.admin) {
            return res.redirect('/admin/dashboard');
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