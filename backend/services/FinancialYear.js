// backend/services/FinancialYear.js
//
// The ONLY place that knows how a financial year is defined and labelled.
// The Trip model, the visibility rules and the facade all call this class,
// so changing the rule (or the label format) is a one-place edit.
//
// Format: "2025-26", "2026-27" (never "FY26", "26Y" or "2025-2026").

class FinancialYear {
    // ---- private ----------------------------------------------------------
    static #START_MONTH = 6; // July (0-based). A financial year runs 1 Jul - 30 Jun.
    static #PATTERN = /^(\d{4})-(\d{2})$/;

    // 2025 -> "2025-26"; 2099 -> "2099-00"
    static #label(startYear) {
        return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
    }

    // ---- public -----------------------------------------------------------

    // The financial year a date falls in. UTC keeps the result independent of
    // the server's timezone: 1 Jul 2025 -> "2025-26", 30 Jun 2026 -> "2025-26".
    static forDate(date) {
        const d = new Date(date);
        const year = d.getUTCFullYear();
        const startYear = d.getUTCMonth() >= FinancialYear.#START_MONTH ? year : year - 1;
        return FinancialYear.#label(startYear);
    }

    static current(now = new Date()) {
        return FinancialYear.forDate(now);
    }

    // must look like "2025-26" with consecutive years
    static isValid(value) {
        const match = FinancialYear.#PATTERN.exec(value);
        return Boolean(match) && Number(match[2]) === (Number(match[1]) + 1) % 100;
    }
}

module.exports = FinancialYear;
