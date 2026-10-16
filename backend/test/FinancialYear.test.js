const { expect } = require('chai');
const FinancialYear = require('../services/FinancialYear');
describe('Trip financial years', () => {
    it('uses the July boundary, including century rollover', () => {
        const cases = [['2026-06-30', '2025-26'], ['2026-07-01', '2026-27'], ['2099-07-01', '2099-00']];
        for (const [date, year] of cases) expect(FinancialYear.forDate(date)).to.equal(year);
        expect(FinancialYear.current(new Date('2026-10-14'))).to.equal('2026-27');
    });
    it('accepts only consecutive years in YYYY-YY format', () => {
        for (const year of ['2025-26', '2099-00']) expect(FinancialYear.isValid(year)).to.equal(true);
        for (const year of ['FY26', '2025-2026', '2025-27', '    -01', '', null, undefined]) {
            expect(FinancialYear.isValid(year)).to.equal(false);
        }
    });
});
