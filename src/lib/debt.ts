import Decimal from 'decimal.js'

interface Balance {
  userId: string
  amount: Decimal // positive = owed money (creditor), negative = owes money (debtor)
}

export interface SimplifiedDebt {
  from: string // debtor userId
  to: string // creditor userId
  amount: number
}

/**
 * Greedy graph-reduction algorithm for debt simplification.
 * Compute net balance per user, then greedily match largest creditor
 * with largest debtor to minimize total transactions.
 */
export function simplifyDebts(
  netBalances: Map<string, number>
): SimplifiedDebt[] {
  const balances: Balance[] = []

  for (const [userId, amount] of Array.from(netBalances.entries())) {
    if (Math.abs(amount) > 0.01) {
      balances.push({ userId, amount: new Decimal(amount) })
    }
  }

  const debts: SimplifiedDebt[] = []
  const creditors = balances
    .filter((b) => b.amount.greaterThan(0))
    .sort((a, b) => b.amount.minus(a.amount).toNumber())
  const debtors = balances
    .filter((b) => b.amount.lessThan(0))
    .map((b) => ({ ...b, amount: b.amount.abs() }))
    .sort((a, b) => b.amount.minus(a.amount).toNumber())

  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]

    const transferAmount = Decimal.min(creditor.amount, debtor.amount)

    if (transferAmount.greaterThan(0.01)) {
      debts.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: transferAmount.toDecimalPlaces(2).toNumber(),
      })
    }

    creditor.amount = creditor.amount.minus(transferAmount)
    debtor.amount = debtor.amount.minus(transferAmount)

    if (creditor.amount.lessThanOrEqualTo(0.01)) ci++
    if (debtor.amount.lessThanOrEqualTo(0.01)) di++
  }

  return debts
}

/**
 * Calculate net balances from expenses and settlements.
 * For each expense: payer gets +amount for each split, split user gets -splitAmount.
 * For each settlement: payer gets -amount, payee gets +amount.
 */
export function calculateNetBalances(
  expenses: Array<{
    paidById: string
    splits: Array<{ userId: string; amount: number; settled: boolean }>
  }>,
  settlements: Array<{
    payerId: string
    payeeId: string
    amount: number
  }>
): Map<string, number> {
  const balances = new Map<string, number>()

  const addBalance = (userId: string, amount: number) => {
    balances.set(userId, (balances.get(userId) || 0) + amount)
  }

  for (const expense of expenses) {
    for (const split of expense.splits) {
      if (!split.settled) {
        // Payer is owed this split amount
        addBalance(expense.paidById, split.amount)
        // Split user owes this amount
        addBalance(split.userId, -split.amount)
      }
    }
  }

  for (const settlement of settlements) {
    // Payer paid off debt (positive for payer)
    addBalance(settlement.payerId, settlement.amount)
    // Payee received payment (negative for payee)
    addBalance(settlement.payeeId, -settlement.amount)
  }

  return balances
}
