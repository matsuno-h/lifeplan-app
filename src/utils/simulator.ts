import { AppData, CashFlowData } from '../types';

const safeNum = (val: number | undefined | null): number => {
  const num = val ?? 0;
  return (isNaN(num) || !isFinite(num)) ? 0 : num;
};

export function calculateCashFlow(data: AppData): CashFlowData[] {
  const results: CashFlowData[] = [];
  const currentYear = new Date().getFullYear();
  const currentAge = data.userSettings.birth_date
    ? Math.floor((Date.now() - new Date(data.userSettings.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30;

  const startAge = currentAge;
  const endAge = data.userSettings.simulation_end_age || 85;

  let cashBalance = safeNum(data.userSettings.current_savings);

  const assetBalances: { [key: string]: number } = {};
  data.assets.forEach((asset) => {
    assetBalances[asset.id] = safeNum(asset.current_value);
  });

  for (let age = startAge; age <= endAge; age++) {
    const year = currentYear + (age - currentAge);
    let yearlyIncome = 0;
    let yearlyExpense = 0;

    data.incomes.forEach((income) => {
      if (age >= income.start_age && age <= income.end_age) {
        const yearsFromStart = age - income.start_age;
        const adjustedAmount = safeNum(income.amount) * Math.pow(1 + safeNum(income.growth_rate) / 100, yearsFromStart);
        yearlyIncome += adjustedAmount;
      }
    });

    data.pensions.forEach((pension) => {
      if (age >= pension.start_age) {
        yearlyIncome += safeNum(pension.amount);
      }
    });

    data.expenses.forEach((expense) => {
      if (age >= expense.start_age && age <= expense.end_age) {
        const yearsFromStart = age - expense.start_age;
        const inflationRate = safeNum(expense.inflation_rate);
        const adjustedAmount = safeNum(expense.amount) * Math.pow(1 + inflationRate / 100, yearsFromStart);
        yearlyExpense += adjustedAmount;
      }
    });

    data.insurances.forEach((insurance) => {
      if (age >= insurance.start_age && age <= insurance.end_age) {
        yearlyExpense += safeNum(insurance.premium);
      }
    });

    data.housings.forEach((housing) => {
      if (age >= housing.start_age && (!housing.end_age || age <= housing.end_age)) {
        if (housing.type === 'rental' && housing.rent) {
          yearlyExpense += safeNum(housing.rent) * 12;
          if (housing.renewal_cost && housing.interval) {
            const yearsFromStart = age - housing.start_age;
            if (yearsFromStart > 0 && yearsFromStart % housing.interval === 0) {
              yearlyExpense += safeNum(housing.renewal_cost);
            }
          }
        } else if (housing.type === 'owned') {
          if (housing.loan_monthly && housing.loan_end_age && age <= housing.loan_end_age) {
            yearlyExpense += safeNum(housing.loan_monthly) * 12;
          }
          if (housing.maintenance) yearlyExpense += safeNum(housing.maintenance) * 12;
          if (housing.tax) yearlyExpense += safeNum(housing.tax);
        }
      }
    });

    data.educationFunds.forEach((edu) => {
      const member = data.familyMembers.find((m) => m.id === edu.owner_id);
      if (member) {
        const memberAge = age - (currentAge - (currentYear - member.birth_year));
        if (memberAge >= edu.start_age && memberAge <= edu.end_age) {
          yearlyExpense += safeNum(edu.amount);
        }
      }
    });

    data.lifeEvents.forEach((event) => {
      if (age === event.age) {
        yearlyExpense += safeNum(event.cost);
      }
    });

    data.loans.forEach((loan) => {
      const yearsFromStart = age - startAge;
      const monthsFromStart = yearsFromStart * 12;
      if (monthsFromStart < safeNum(loan.remaining_payments)) {
        const monthsThisYear = Math.min(12, safeNum(loan.remaining_payments) - monthsFromStart);
        yearlyExpense += safeNum(loan.monthly_payment) * monthsThisYear;
      }
    });

    let totalInvestmentContribution = 0;
    let totalInvestmentWithdrawal = 0;

    data.assets.forEach((asset) => {
      const returnRate = safeNum(asset.return_rate) / 100;

      assetBalances[asset.id] = (assetBalances[asset.id] || 0) * (1 + returnRate);

      const yearlyContrib = safeNum(asset.yearly_contribution);
      if (yearlyContrib > 0) {
        if (!asset.withdrawal_age || age < asset.withdrawal_age) {
          assetBalances[asset.id] += yearlyContrib;
          totalInvestmentContribution += yearlyContrib;
        }
      }

      if (asset.withdrawal_age && age >= asset.withdrawal_age && asset.withdrawal_amount) {
        const withdrawal = Math.min(safeNum(asset.withdrawal_amount), assetBalances[asset.id]);
        assetBalances[asset.id] -= withdrawal;
        totalInvestmentWithdrawal += withdrawal;
      }
    });

    data.realEstates.forEach((property) => {
      if (age >= property.purchase_age) {
        if (property.rent_income) yearlyIncome += safeNum(property.rent_income) * 12;
        if (property.maintenance_cost) yearlyExpense += safeNum(property.maintenance_cost) * 12;
        if (property.tax) yearlyExpense += safeNum(property.tax);
        if (property.loan_payments) yearlyExpense += safeNum(property.loan_payments) * 12;
      }
    });

    const netCashFlow = yearlyIncome - yearlyExpense - totalInvestmentContribution + totalInvestmentWithdrawal;
    cashBalance += netCashFlow;

    const totalAssetValue = Object.values(assetBalances).reduce((sum, val) => sum + val, 0);
    const totalBalance = cashBalance + totalAssetValue;

    results.push({
      age,
      year,
      balance: Math.round(totalBalance),
      income: Math.round(yearlyIncome),
      expense: Math.round(yearlyExpense),
    });
  }

  return results;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
}
