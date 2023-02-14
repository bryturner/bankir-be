const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
	{
		user: { type: String, required: true },
		firstName: { type: String, required: true },
		standard: { type: Object, required: true },
		premium: { type: Object, required: true },
		messages: { type: Array, required: true },
		accountTotal: { type: Number, required: true },
		earningsTotal: { type: Number, required: true },
		stdTransactions: { type: Array, required: true },
		prmTransactions: { type: Array, required: true },
		isDefault: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const Account = mongoose.model('account', accountSchema);

module.exports = Account;
