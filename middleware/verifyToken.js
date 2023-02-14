const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
	try {
		const token = req.cookies.token;

		if (!token) return res.status(401).json({ errorMessage: 'Unauthorized' });

		const verified = jwt.verify(token, process.env.JWT_SECRET);

		res.locals.id = verified.user;

		next();
	} catch (err) {
		console.error(err);
		res.status(401).json({ errorMessage: 'Unauthorized' });
	}
}

module.exports = verifyToken;
