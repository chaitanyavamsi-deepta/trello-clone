// Routes async handler rejections into the central errorHandler.
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
