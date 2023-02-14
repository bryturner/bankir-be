const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const Account = require('../models/account.model');
const {
	Transaction,
	AccountTransfer,
	OtherUserTransfer,
} = require('../classes/Transfer');
const { Interest } = require('../classes/Interest');
const { resetAccount } = require('../helpers');

router.get('/', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const dbAccount = await Account.findOne({ user: user });

		const {
			firstName,
			standard,
			premium,
			accountTotal,
			earningsTotal,
			messages,
			stdTransactions,
			prmTransactions,
			isDefault,
		} = dbAccount;

		// If account total is over 1,000,000 -> reset account
		if (accountTotal > 10000000) {
			resetAccount(user, firstName, res);
			return;
		}

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
		res.status(200).json(accountData);
	} catch (err) {
		res.status(500).json(err);
	}
});

router.post('/newAccount', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;

		const firstName = req.body.firstName.trim().replace(/\s{2,}/g, '');

		if (!firstName) {
			return res
				.status(400)
				.json({ errorMessage: 'Please fill out all required fields' });
		}

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
			{ firstName: firstName, type: 'welcome', date: Date.now(), id: 'msg01' },
		];

		const newAccount = new Account({
			user,
			firstName,
			standard,
			premium,
			accountTotal,
			earningsTotal,
			messages,
		});

		const savedAccount = await newAccount.save();

		res.status(200).json(savedAccount);
	} catch (err) {
		res.status(500).json({ errorMessage: 'New account could not be created' });
	}
});

// ** Make a deposit or withdrawal to/from standard or premium
router.put('/transaction', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const { amount, date, type, account, description } = req.body;

		if (!description || !amount) {
			return res
				.status(400)
				.json({ errorMessage: 'Please fill out all fields' });
		}

		if (amount < 1) {
			return res
				.status(400)
				.json({ errorMessage: 'Minimum transaction amount is $1.00' });
		}

		if (amount > 2000) {
			return res.status(400).json({
				errorMessage: 'Maximum transaction amount is $2,000.00',
			});
		}

		const accountData = await Account.findOne({ user: user });

		const { accountTotal } = accountData;

		// (amount, date, description, type, accountTotal, account)
		const transaction = new Transaction(
			amount,
			date,
			description,
			type,
			accountTotal,
			account
		);

		// Standard Account
		if (account === 'standard') {
			const { balance } = accountData.standard;

			if (amount > balance && transaction.type === 'withdrawal') {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make a withdrawal',
				});
			}

			const newBalance = transaction.updateBalance(balance);
			const newTransaction = transaction.createTransaction();
			const message = transaction.createMessage();
			const newAccountTotal = transaction.updateAccountTotal();

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'standard.balance': newBalance,
						accountTotal: newAccountTotal,
					},
					$push: {
						messages: { $each: [message], $position: 0 },
						stdTransactions: { $each: [newTransaction], $position: 0 },
					},
				}
			);
		}

		// Premium Account
		if (account === 'premium') {
			const { balance } = accountData.premium;

			if (amount > balance && transaction.type === 'withdrawal') {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make a withdrawal',
				});
			}

			const newBalance = transaction.updateBalance(balance);
			const newTransaction = transaction.createTransaction();
			const message = transaction.createMessage();
			const newAccountTotal = transaction.updateAccountTotal();

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'premium.balance': newBalance,
						accountTotal: newAccountTotal,
					},
					$push: {
						messages: { $each: [message], $position: 0 },
						prmTransactions: { $each: [newTransaction], $position: 0 },
					},
				}
			);
		}

		const updated = await Account.findOne({ user: user });
		res.status(200).json(updated);
	} catch (err) {
		console.error(err);
		res.status(500).json({ errorMessage: 'Server error: transaction' });
	}
});

// ===== Transfer money to another user's account =====
router.put('/transferToOther', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const { amount, date, description, type, transferFrom, transferTo } =
			req.body;

		if (!description || !amount) {
			return res
				.status(400)
				.json({ errorMessage: 'Please fill out all fields' });
		}

		if (amount < 1) {
			return res
				.status(400)
				.json({ errorMessage: 'Minimum transfer amount is $1.00' });
		}

		if (amount > 2000) {
			return res
				.status(400)
				.json({ errorMessage: 'Maximum transfer amount is $2,000.00' });
		}

		const accountData = await Account.findOne({ user: user });
		const { accountTotal } = accountData;

		// amount, date, description, type, transferFrom, transferTo
		const transfer = new AccountTransfer(
			amount,
			date,
			description,
			type,
			transferFrom,
			transferTo
		);

		const other = await Account.findOne({ user: transferTo });

		// check to see if other user exists
		if (!other) {
			return res.status(400).json({
				errorMessage: 'Username not found, please check spelling',
			});
		}
		// get account total and balance from other user account the money is being transfered too
		const otherAccountTotal = other.accountTotal;
		const otherBalance = other.standard.balance;

		// amount, date, description, type, transferFrom, balance, accountTotal
		const otherTransfer = new OtherUserTransfer(
			amount,
			date,
			description,
			type,
			otherAccountTotal,
			user,
			otherBalance
		);

		await Account.updateOne(
			{ user: transferTo },
			{
				$set: {
					'standard.balance': otherTransfer.balance,
					accountTotal: otherTransfer.accountTotal,
				},
				$push: {
					messages: { $each: [otherTransfer.message], $position: 0 },
					stdTransactions: {
						$each: [otherTransfer.transactionTo],
						$position: 0,
					},
				},
			}
		);

		// update account money is transferred from (standard or premium)
		if (transferFrom === 'standard') {
			const { balance } = accountData.standard;

			if (amount > balance) {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make transfer',
				});
			}

			// Subtract amount transferred from balance and total
			const newBalance = transfer.updateFromBalance(balance);
			const newAccountTotal = transfer.updateAccountTotal(accountTotal);

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'standard.balance': newBalance,
						accountTotal: newAccountTotal,
					},
					$push: {
						messages: { $each: [transfer.message], $position: 0 },
						stdTransactions: {
							$each: [transfer.transactionFrom],
							$position: 0,
						},
					},
				}
			);
		}

		if (transferFrom === 'premium') {
			const { balance } = accountData.premium;

			if (amount > balance) {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make transfer',
				});
			}

			// Subtract amount transferred from balance and total
			const newBalance = transfer.updateFromBalance(balance);
			const newAccountTotal = transfer.updateAccountTotal(accountTotal);

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'premium.balance': newBalance,
						accountTotal: newAccountTotal,
					},
					$push: {
						messages: { $each: [transfer.message], $position: 0 },
						prmTransactions: {
							$each: [transfer.transactionFrom],
							$position: 0,
						},
					},
				}
			);
		}

		res.status(200).json();
	} catch (err) {
		console.error(err);
		res.status(500).json({ errorMessage: 'Server error: transfer to other' });
	}
});

// ===== Transfer money between accounts =====
router.put('/transferToSame', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const { amount, date, description, type, transferFrom, transferTo } =
			req.body;

		if (!description || !amount) {
			return res
				.status(400)
				.json({ errorMessage: 'Please fill out all fields' });
		}

		if (amount < 1) {
			return res
				.status(400)
				.json({ errorMessage: 'Minimum transfer amount is $1.00' });
		}

		if (amount > 2000) {
			return res
				.status(400)
				.json({ errorMessage: 'Maximum transfer amount is $2,000.00' });
		}

		const accountData = await Account.findOne({ user: user });

		// amount, date, description, type, transferFrom, transferTo
		const transfer = new AccountTransfer(
			amount,
			date,
			description,
			type,
			transferFrom,
			transferTo
		);

		const standardBalance = accountData.standard.balance;
		const premiumBalance = accountData.premium.balance;
		const { message, transactionFrom, transactionTo } = transfer;

		// update account, money is transferred from (standard or premium)
		if (transferFrom === 'standard') {
			if (amount > standardBalance) {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make transfer',
				});
			}

			// update balances -> transfer going from standard to premium
			const newFromBalance = transfer.updateFromBalance(standardBalance);
			const newToBalance = transfer.updateToBalance(premiumBalance);

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'standard.balance': newFromBalance,
						'premium.balance': newToBalance,
					},
					$push: {
						messages: { $each: [message], $position: 0 },
						stdTransactions: { $each: [transactionFrom], $position: 0 },
						prmTransactions: { $each: [transactionTo], $position: 0 },
					},
				}
			);
		}

		if (transferFrom === 'premium') {
			if (amount > premiumBalance) {
				return res.status(400).json({
					errorMessage: 'Insuffecient funds to make transfer',
				});
			}

			// update balances -> transfer going from premium to standard
			const newFromBalance = transfer.updateFromBalance(premiumBalance);
			const newToBalance = transfer.updateToBalance(standardBalance);

			await Account.updateOne(
				{ user: user },
				{
					$set: {
						'standard.balance': newToBalance,
						'premium.balance': newFromBalance,
					},
					$push: {
						messages: { $each: [message], $position: 0 },
						stdTransactions: { $each: [transactionTo], $position: 0 },
						prmTransactions: { $each: [transactionFrom], $position: 0 },
					},
				}
			);
		}

		res.status(200).json();
	} catch (err) {
		console.error(err);
		res.status(500).json({ errorMessage: 'Server error: transfer to same' });
	}
});

router.put('/interest', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const { standardEarned, premiumEarned } = req.body;

		const accountData = await Account.findOne({ user: user });

		const { accountTotal, earningsTotal } = accountData;

		const interest = new Interest(standardEarned, premiumEarned);

		const { message, prmTransaction, stdTransaction } = interest;

		const updatedEarningsTotal = interest.addToAccountTotals(earningsTotal);
		const updatedAccountTotal = interest.addToAccountTotals(accountTotal);
		const updatedPremiumBalance = interest.addToPremium(
			accountData.premium.balance
		);
		const updatedPremiumEarnings = interest.addToPremium(
			accountData.premium.earnings
		);
		const updatedStandardBalance = interest.addToStandard(
			accountData.standard.balance
		);
		const updatedStandardEarnings = interest.addToStandard(
			accountData.standard.earnings
		);

		await Account.updateOne(
			{ user: user },
			{
				$set: {
					'premium.balance': updatedPremiumBalance,
					'premium.earnings': updatedPremiumEarnings,
					'standard.balance': updatedStandardBalance,
					'standard.earnings': updatedStandardEarnings,
					accountTotal: updatedAccountTotal,
					earningsTotal: updatedEarningsTotal,
				},
				$push: {
					messages: { $each: [message], $position: 0 },
					prmTransactions: { $each: [prmTransaction], $position: 0 },
					stdTransactions: { $each: [stdTransaction], $position: 0 },
				},
			}
		);

		res.status(200).json();
	} catch (err) {
		console.error(err);
		res
			.status(500)
			.json({ errorMessage: `An error has occurred, please try again.` });
	}
});

// Reset account info (Admin only)
router.put('/reset', verifyToken, async (req, res) => {
	try {
		const user = res.locals.id;
		const { firstName } = req.body;

		resetAccount(user, firstName, res);
	} catch (err) {
		console.error(err);
		res.status(500).json(err);
	}
});

module.exports = router;
