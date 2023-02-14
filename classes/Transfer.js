class Transfer {
	strAmount;
	date;
	description;
	type;
	accountTotal;
	id;
	floatAmount;

	constructor(strAmount, date, description, type, accountTotal) {
		this.strAmount = strAmount;
		this.date = date;
		this.description = description;
		this.type = type;
		this.accountTotal = accountTotal;

		this.#createId();
		this.#convertAmount();
	}

	#createId() {
		const dt = new Date(Date.now()).toISOString();
		this.id = dt.slice(dt.indexOf('-') + 1, -1);
	}

	#convertAmount() {
		this.floatAmount = parseFloat(this.strAmount.replace(/,/g, ''));

		if (this.floatAmount <= 0) {
			throw new Error('Amount cannot be less than or equal to 0');
		}
		return this.floatAmount;
	}
}

class Transaction extends Transfer {
	account;
	transaction;
	message;
	balance;

	constructor(
		strAmount,
		date,
		description,
		type,
		accountTotal,
		account,
		floatAmount
	) {
		super(strAmount, date, description, type, accountTotal, floatAmount);

		this.account = account;

		// this.#createMessage();
		// this.#createTransaction();
		// this.#updateAccountTotal();
		if (this.type === 'withdrawal') {
			this.floatAmount = this.floatAmount * -1;
		}
	}

	#update(value) {
		if (this.type === 'withdrawal') {
			return parseFloat((value - this.floatAmount).toFixed(2));
		} else if (this.type === 'deposit') {
			return parseFloat((value + this.floatAmount).toFixed(2));
		} else {
			throw new Error(`Type "${this.type}" does not exist`);
		}
	}

	createMessage() {
		const messageId = `msg${this.id}`;
		this.message = {
			type: this.type,
			date: this.date,
			amount: this.strAmount,
			account: this.account,
			id: messageId,
		};
		return this.message;
	}

	// !!!! Transaction for negative amounts
	createTransaction() {
		const transactionId = `t-to${this.id}`;
		this.transaction = {
			date: this.date,
			description: this.description,
			amount: this.floatAmount,
			id: transactionId,
		};
		return this.transaction;
	}

	updateAccountTotal() {
		return this.accountTotal + this.floatAmount;
	}

	updateBalance(balance) {
		return balance + this.floatAmount;
	}
}

class AccountTransfer extends Transfer {
	transferFrom;
	transferTo;
	transactionTo;
	transactionFrom;
	// otherTotal;
	// otherBalance;
	// otherMessage;
	message;
	balance;
	accountTotal;

	constructor(
		strAmount,
		date,
		description,
		type,
		transferFrom,
		transferTo,
		floatAmount
	) {
		super(strAmount, date, description, type, floatAmount);

		this.transferFrom = transferFrom;
		this.transferTo = transferTo;

		this.#createMessage();
		this.#createTransactionFrom();
		this.#createTransactionTo();
	}

	#createMessage() {
		const messageId = `msg${this.id}`;
		this.message = {
			type: this.type,
			transferFrom: this.transferFrom,
			transferTo: this.transferTo,
			date: this.date,
			amount: this.strAmount,
			id: messageId,
		};
	}

	#createTransactionFrom() {
		const transactionId = `t-fm${this.id}`;
		this.transactionFrom = {
			date: this.date,
			description: this.description,
			amount: -this.floatAmount,
			id: transactionId,
		};
	}

	#createTransactionTo() {
		const transactionId = `t-to${this.id}`;
		this.transactionTo = {
			date: this.date,
			description: this.description,
			amount: this.floatAmount,
			id: transactionId,
		};
	}

	updateFromBalance(balance) {
		return parseFloat((balance - this.floatAmount).toFixed(2));
	}

	updateToBalance(balance) {
		return parseFloat((balance + this.floatAmount).toFixed(2));
	}

	updateAccountTotal(accountTotal) {
		return parseFloat((accountTotal - this.floatAmount).toFixed(2));
	}
}

class OtherUserTransfer extends Transfer {
	message;
	transactionFrom;
	transactionTo;
	balance;

	constructor(
		strAmount,
		date,
		description,
		type,
		accountTotal,
		user,
		balance,
		floatAmount
	) {
		super(strAmount, date, description, type, accountTotal, floatAmount);

		this.user = user;
		this.balance = balance;

		this.#createMessage();
		this.#createTransaction();
		this.#updateBalance();
		this.#updateTotal();
	}

	#updateBalance() {
		this.balance = parseFloat((this.balance + this.floatAmount).toFixed(2));
	}

	#updateTotal() {
		this.accountTotal = parseFloat(
			(this.accountTotal + this.floatAmount).toFixed(2)
		);
	}

	#createTransaction() {
		const transactionId = `t-to${this.id}`;
		this.transactionTo = {
			date: this.date,
			description: this.description,
			amount: this.floatAmount,
			id: transactionId,
		};
	}

	#createMessage() {
		const messageId = `msg${this.id}`;
		this.message = {
			type: this.type,
			transferFrom: this.user,
			transferTo: 'standard',
			date: this.date,
			amount: this.strAmount,
			id: messageId,
		};
	}
}

module.exports = { Transaction, AccountTransfer, OtherUserTransfer };
