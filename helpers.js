const Account = require('./models/account.model');

const resetAccount = async (user, firstName, res) => {
	const standard = {
		balance: 10000,
		apy: 4.5,
		earnings: 0,
	};

	const premium = {
		balance: 5000,
		apy: 8.5,
		earnings: 0,
	};

	const accountTotal = 15000;
	const earningsTotal = 0;
	const messages = [
		{
			firstName: firstName,
			type: 'welcome',
			date: Date.now(),
			id: 'msg01',
		},
	];

	await Account.updateOne(
		{ user: user },
		{
			$set: {
				standard: standard,
				premium: premium,
				accountTotal: accountTotal,
				earningsTotal: earningsTotal,
				messages: messages,
				prmTransactions: [],
				stdTransactions: [],
			},
		}
	);

	const { stdTransactions, prmTransactions, isDefault } = await Account.findOne(
		{ user: user }
	);

	const accountData = {
		firstName: firstName,
		standard: standard,
		premium: premium,
		accountTotal: accountTotal,
		earningsTotal: earningsTotal,
		messages: messages,
		stdTransactions: stdTransactions,
		prmTransactions: prmTransactions,
		isDefault: isDefault,
	};

	return res.status(200).json(accountData);
};

module.exports = { resetAccount };
