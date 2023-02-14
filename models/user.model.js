const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
	},
	{ timestamps: true }
);

const User = mongoose.model('user', userSchema);

module.exports = User;
