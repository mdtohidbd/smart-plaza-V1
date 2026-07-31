/**
 * EMI Calculations — Single source of truth
 *
 * Field definitions on EMIInvoice:
 *   totalAmount          — sale price (e.g. ৳125,000)
 *   emiPlan.interestAmount    — interest added on top
 *   emiPlan.totalPayableAmount — totalAmount + interest (full obligation)
 *   downPayment.amount   — upfront payment (e.g. ৳50,000)
 *   paidAmount           — cumulative payments INCLUDING down payment
 *   outstandingBalance   — stored field (may be stale; prefer computed)
 *   instalments[]        — individual instalment records
 *
 * Derived values:
 *   totalPayable  = emiPlan.totalPayableAmount  (or totalAmount + interestAmount)
 *   emiAmount     = totalPayable - downPayment   (the EMI portion = ৳75,000)
 *   emiPaid       = paidAmount - downPayment     (instalments collected so far)
 *   outstanding   = emiAmount - emiPaid
 *   recoveryRate  = (downPayment + emiPaid) / totalPayable * 100
 */

/**
 * Compute all derived EMI figures from a raw EMIInvoice document.
 * Safe to call from any component — returns 0s for missing fields.
 *
 * @param {Object} invoice — raw EMIInvoice from API
 * @returns {Object}
 */
export function calcEMI(invoice = {}) {
  // Total Payment = Sale Price + Interest (The absolute total amount for the product)
  const totalPayment = (invoice.totalAmount || 0) + (invoice.emiPlan?.interestAmount || 0);

  const downPayment = invoice.downPayment?.amount || 0;

  // Total Payable = The amount left to pay via EMI after down payment
  // (In DB, emiPlan.totalPayableAmount holds this)
  const totalPayable = invoice.emiPlan?.totalPayableAmount || Math.max(0, totalPayment - downPayment);

  // EMI Paid = The sum of all instalment payments collected.
  // We sum directly from instalments array to guarantee downpayment is NEVER included,
  // bypassing any stale or incorrect invoice.paidAmount data.
  const instalments = invoice.instalments || [];
  const emiPaid = instalments.reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);

  // Total Outstanding = What's still owed in instalments
  const totalOutstanding = Math.max(0, totalPayable - emiPaid);

  // Recovery as a percentage of Total Payable
  const recoveryRate =
    totalPayable > 0
      ? Math.min(100, (emiPaid / totalPayable) * 100)
      : 0;

  const totalInstalments = instalments.length;
  const paidInstalments = instalments.filter((i) => i.status === 'paid').length;
  const overdueInstalments = instalments.filter(
    (i) => i.status === 'overdue' || (i.status === 'pending' && new Date(i.dueDate) < new Date())
  ).length;

  return {
    totalPayment,      // total price + interest
    downPayment,       // upfront payment
    totalPayable,      // remaining EMI obligation
    emiPaid,           // strictly instalment payments
    totalOutstanding,  // strictly remaining instalments
    outstanding: totalOutstanding, // Alias for backward compatibility
    interestRate: invoice.emiPlan?.interestRate || 0,
    recoveryRate: parseFloat(recoveryRate.toFixed(1)),
    totalInstalments,
    paidInstalments,
    overdueInstalments,
  };
}

/** Format a number as Bangladeshi Taka string */
export function fmt(amount = 0) {
  return `৳${Number(amount).toLocaleString()}`;
}
