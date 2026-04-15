/**
 * Debt Simplification Algorithm
 * Minimizes the number of transactions needed to settle all debts in a group.
 * Uses a greedy approach with min/max heaps.
 */

/**
 * Calculate net balances for each user in a group
 * @param {Array} expenses - Array of expense objects with paidBy and splitBetween
 * @param {Array} payments - Array of payment objects (settlements)
 * @returns {Object} - Map of userId -> net balance (positive = owed money, negative = owes money)
 */
const calculateNetBalances = (expenses, payments) => {
  const balances = {};

  // Process expenses
  for (const expense of expenses) {
    if (expense.isDeleted) continue;

    const payerId = expense.paidBy._id?.toString() || expense.paidBy.toString();

    // Payer gets credit for the full amount
    balances[payerId] = (balances[payerId] || 0) + expense.amount;

    // Each person in splitBetween owes their share
    for (const split of expense.splitBetween) {
      const userId = split.user._id?.toString() || split.user.toString();
      balances[userId] = (balances[userId] || 0) - split.share;
    }
  }

  // Process payments (settlements)
  for (const payment of payments) {
    const payerId = payment.payer._id?.toString() || payment.payer.toString();
    const receiverId = payment.receiver._id?.toString() || payment.receiver.toString();

    balances[payerId] = (balances[payerId] || 0) + payment.amount;
    balances[receiverId] = (balances[receiverId] || 0) - payment.amount;
  }

  return balances;
};

/**
 * Simplify debts to minimize transactions
 * @param {Object} balances - Map of userId -> net balance
 * @returns {Array} - Array of {from, to, amount} transactions
 */
const simplifyDebts = (balances) => {
  const transactions = [];

  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = []; // people who are owed money
  const debtors = [];   // people who owe money

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < -0.01) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    }
  }

  // Sort by amount descending for efficiency
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(settleAmount * 100) / 100;

    if (rounded > 0.01) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: rounded,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
};

/**
 * Calculate who owes what in a group
 * @param {Array} expenses 
 * @param {Array} payments 
 * @returns {Object} { balances, transactions }
 */
const calculateGroupBalances = (expenses, payments = []) => {
  const balances = calculateNetBalances(expenses, payments);
  const transactions = simplifyDebts(balances);

  return { balances, transactions };
};

/**
 * Get balance between two specific users
 */
const getBalanceBetweenUsers = (userId1, userId2, expenses, payments) => {
  let balance = 0; // positive means userId1 is owed by userId2

  for (const expense of expenses) {
    if (expense.isDeleted) continue;

    const payerId = expense.paidBy._id?.toString() || expense.paidBy.toString();
    const uid1 = userId1.toString();
    const uid2 = userId2.toString();

    for (const split of expense.splitBetween) {
      const splitUserId = split.user._id?.toString() || split.user.toString();

      if (payerId === uid1 && splitUserId === uid2) {
        balance += split.share;
      } else if (payerId === uid2 && splitUserId === uid1) {
        balance -= split.share;
      }
    }
  }

  // Account for payments
  for (const payment of payments) {
    const payerId = payment.payer._id?.toString() || payment.payer.toString();
    const receiverId = payment.receiver._id?.toString() || payment.receiver.toString();
    const uid1 = userId1.toString();
    const uid2 = userId2.toString();

    if (payerId === uid2 && receiverId === uid1) {
      balance -= payment.amount;
    } else if (payerId === uid1 && receiverId === uid2) {
      balance += payment.amount;
    }
  }

  return Math.round(balance * 100) / 100;
};

module.exports = {
  calculateNetBalances,
  simplifyDebts,
  calculateGroupBalances,
  getBalanceBetweenUsers,
};
