const ACCOUNT = {
	standard: {
		balance: 10000,
		transactions: [],
		apy: 2.5,
		earnings: 200,
	},
	premium: {
		balance: 5000,
		transactions: [],
		apy: 5.5,
		earnings: 500,
	},
	accountTotal: 15000,
	earningsTotal: 700,
};

const MESSAGES = [{ type: 'welcome', date: Date.now() }];

const STANDARD = {
	balance: 10000,
	transactions: [],
	apy: 2.5,
	earnings: 200,
};

const PREMIUM = {
	balance: 5000,
	transactions: [],
	apy: 5.5,
	earnings: 500,
};

module.exports = { ACCOUNT, MESSAGES, PREMIUM, STANDARD };
