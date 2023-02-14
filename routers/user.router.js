const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/user.model');

// Delete user
router.delete('/delete', verifyToken, async (req, res) => {
	try {
		const { user } = req.cookies;

		await User.findByIdAndDelete(user);
		res.status(200).json('User has been deleted');
	} catch (err) {
		console.error(err);
		res.status(500).json(err);
	}
});

module.exports = router;
