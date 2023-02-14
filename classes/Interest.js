class Interest {
	id;
	standardEarned;
	premiumEarned;
	message;
	date;
	prmTransaction;
	stdTransaction;

	constructor(standardEarned, premiumEarned) {
		this.standardEarned = this.#convertToFloat(standardEarned);
		this.premiumEarned = this.#convertToFloat(premiumEarned);

		this.#createId();
		this.#getCurDate();
		this.#createMessage();
		this.#createPremiumTransaction();
		this.#createStandardTransaction();
	}

	#createId() {
		const dt = new Date(Date.now()).toISOString();
		this.id = dt.slice(dt.indexOf('-') + 1, -1);
	}

	#getCurDate() {
		this.date = new Date(Date.now());
	}

	#convertToFloat(str) {
		return parseFloat(str);
	}

	#createMessage() {
		const messageId = `msg${this.id}`;
		this.message = {
			type: 'interest',
			premium: this.premiumEarned.toFixed(2),
			standard: this.standardEarned.toFixed(2),
			date: this.date,
			id: messageId,
		};
	}

	#createPremiumTransaction() {
		const transactionId = `t-pin${this.id}`;
		this.prmTransaction = {
			date: this.date,
			description: 'Premium interest paid',
			amount: this.premiumEarned,
			id: transactionId,
		};
	}

	#createStandardTransaction() {
		const transactionId = `t-sin${this.id}`;
		this.stdTransaction = {
			date: this.date,
			description: 'Standard interest paid',
			amount: this.standardEarned,
			id: transactionId,
		};
	}

	addToStandard(amount) {
		return parseFloat((amount + this.standardEarned).toFixed(2));
	}

	addToPremium(amount) {
		return parseFloat((amount + this.premiumEarned).toFixed(2));
	}

	addToAccountTotals(amount) {
		return parseFloat(
			(amount + this.premiumEarned + this.standardEarned).toFixed(2)
		);
	}
}

module.exports = { Interest };
