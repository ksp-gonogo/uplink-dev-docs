/**
 * The two shrink-only rules every debt list in this repo follows, as pure
 * functions so `check-ratchets.mjs` can grade a planted violation with the
 * same code the real lists go through.
 */

/** Counts over a ceiling, and entries whose violation is already gone. */
export function againstDebt(counts, debt) {
  const over = [];
  const stale = [];
  for (const [file, count] of Object.entries(counts)) {
    const allowed = debt[file] ?? 0;
    if (count > allowed) over.push({ file, count, allowed });
  }
  for (const [file, allowed] of Object.entries(debt)) {
    const count = counts[file] ?? 0;
    if (count < allowed) stale.push({ file, count, allowed });
  }
  return { over, stale };
}

/** Links with no reference entry that the list does not allow, and allowed names that now resolve. */
export function linkDebtFaults(missed, debtList) {
  const debt = new Set(debtList);
  return {
    unresolved: missed.filter((name) => !debt.has(name)),
    stale: [...debt].filter((name) => !missed.includes(name)),
  };
}
