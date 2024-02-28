const errorHandler = (err, req, res, next) => {

    res.status(err.status || 404).render('404')
}
module.exports = errorHandler