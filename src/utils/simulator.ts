import { AppData, CashFlowData } from '../types';

const safeNum = (val: number | undefined | null): number => {
  const num = val ?? 0;
  return (isNaN(num) || !isFinite(num)) ? 0 : num;
};

// PMT function to calculate monthly loan payment
// rate: annual interest rate (percentage)
// nper: total number of payments (months)
// pv: present value (loan amount)
export const calculatePMT = (rate: number, nper: number, pv: number): number => {
  if (rate === 0) return pv / nper;
  const monthlyRate = rate / 100 / 12;
  return (pv * monthlyRate * Math.pow(1 + monthlyRate, nper)) / (Math.pow(1 + monthlyRate, nper) - 1);
};

export function calculateCashFlow(data: AppData): CashFlowData[] {
  const results: CashFlowData[] = [];
  const currentYear = new Date().getFullYear();
  const currentAge = data.userSettings.birth_date
    ? Math.floor((Date.now() - new Date(data.userSettings.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30;

  const startAge = currentAge;
  // Use retirement_age as the simulation end age, default to 100 if not set
  const endAge = data.userSettings.retirement_age || 100;

  let cashBalance = safeNum(data.userSettings.current_savings);

  const assetBalances: { [key: string]: number } = {};
  data.assets.forEach((asset) => {
    assetBalances[asset.id] = safeNum(asset.current_value);
  });

  for (let age = startAge; age <= endAge; age++) {
    const year = currentYear + (age - currentAge);
    let yearlyIncome = 0;
    let yearlyExpense = 0;

    // --- Basic Income ---
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

    // --- Basic Expenses ---
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

    // --- Financial Assets ---
    let totalInvestmentContribution = 0;
    let totalInvestmentWithdrawal = 0;

    data.assets.forEach((asset) => {
      const returnRate = safeNum(asset.return_rate) / 100;

      assetBalances[asset.id] = (assetBalances[asset.id] || 0) * (1 + returnRate);

      const yearlyContrib = safeNum(asset.yearly_contribution);
      if (yearlyContrib > 0) {
        // Check if within accumulation period (if end age is set)
        const isAccumulating = !asset.accumulation_end_age || age < asset.accumulation_end_age;
        // Check if before withdrawal starts (if withdrawal age is set)
        const isBeforeWithdrawal = !asset.withdrawal_age || age < asset.withdrawal_age;

        if (isAccumulating && isBeforeWithdrawal) {
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

    // --- Real Estate Simulation ---
    data.realEstates.forEach((property) => {
      const purchaseDate = new Date(property.purchase_date);
      const purchaseYear = purchaseDate.getFullYear();
      const purchaseMonth = purchaseDate.getMonth(); // 0-11

      const sellDate = property.sell_date ? new Date(property.sell_date) : null;
      const sellYear = sellDate ? sellDate.getFullYear() : 9999;
      const sellMonth = sellDate ? sellDate.getMonth() : 11;

      // Check if property is owned in this year
      if (year >= purchaseYear && year <= sellYear) {
        // Determine months owned in this specific year
        let monthsOwned = 12;
        if (year === purchaseYear) monthsOwned -= purchaseMonth;
        if (year === sellYear) monthsOwned = sellMonth + 1; // +1 because sellMonth is 0-indexed but we want count up to that month
        if (year === purchaseYear && year === sellYear) monthsOwned = (sellMonth - purchaseMonth) + 1;
        
        monthsOwned = Math.max(0, Math.min(12, monthsOwned));

        // Income: Rent
        if (property.rent_income) {
          yearlyIncome += safeNum(property.rent_income) * monthsOwned;
        }

        // Expense: Maintenance
        if (property.maintenance_cost) {
          yearlyExpense += safeNum(property.maintenance_cost) * monthsOwned;
        }

        // Expense: Property Tax (Annual)
        if (property.property_tax && monthsOwned > 0) {
           yearlyExpense += safeNum(property.property_tax);
        }

        // Expense: Loan Repayment
        if (property.loan_amount && property.loan_duration) {
          const loanStartYear = purchaseYear;
          const loanStartMonth = purchaseMonth;
          
          // Calculate total months passed since loan start to the beginning of this year
          const monthsSinceLoanStart = (year - loanStartYear) * 12 - loanStartMonth;
          
          // Calculate monthly payment
          const monthlyPayment = calculatePMT(safeNum(property.loan_rate), safeNum(property.loan_duration), safeNum(property.loan_amount) * 10000) / 10000; // Convert to Man-yen for calc then back

          // Add payments for months owned this year, but stop if loan duration exceeded
          for (let m = 0; m < monthsOwned; m++) {
            const currentLoanMonth = monthsSinceLoanStart + m;
            if (currentLoanMonth >= 0 && currentLoanMonth < property.loan_duration) {
              yearlyExpense += monthlyPayment;
            }
          }
        }
      }

      // Purchase Event
      if (year === purchaseYear) {
        yearlyExpense += safeNum(property.initial_cost);
      }

      // Sale Event
      if (year === sellYear && sellDate) {
        yearlyIncome += safeNum(property.sell_price);
        yearlyExpense += safeNum(property.sell_cost);

        // Pay off remaining loan balance
        if (property.loan_amount && property.loan_duration) {
           const loanStartYear = purchaseYear;
           const loanStartMonth = purchaseMonth;
           const monthsPassedAtSale = (sellYear - loanStartYear) * 12 + (sellMonth - loanStartMonth);
           
           if (monthsPassedAtSale < property.loan_duration) {
             // Simplified remaining balance calculation
             const r = safeNum(property.loan_rate) / 100 / 12;
             const n = monthsPassedAtSale;
             const pv = safeNum(property.loan_amount) * 10000; // in Yen
             const pmt = calculatePMT(safeNum(property.loan_rate), safeNum(property.loan_duration), pv);
             
             let remainingBalance = 0;
             if (r === 0) {
               remainingBalance = pv - (pmt * n);
             } else {
               remainingBalance = pv * Math.pow(1 + r, n) - pmt * (Math.pow(1 + r, n) - 1) / r;
             }
             
             if (remainingBalance > 0) {
               yearlyExpense += remainingBalance / 10000; // Convert back to Man-yen
             }
           }
        }
      }
    });


    // Add withdrawal to yearlyIncome for consistency with CashFlowTable
    yearlyIncome += totalInvestmentWithdrawal;

    // Net Cash Flow = Income (including withdrawal) - Expense - Investment Contribution
    const netCashFlow = yearlyIncome - yearlyExpense - totalInvestmentContribution;
    cashBalance += netCashFlow;

    const totalAssetValue = Object.values(assetBalances).reduce((sum, val) => sum + val, 0);
    const totalBalance = cashBalance + totalAssetValue;

    results.push({
      age,
      year,
      balance: Math.round(totalBalance),
      cashBalance: Math.round(cashBalance),
      assetBalance: Math.round(totalAssetValue),
      yearlySavings: Math.round(netCashFlow),
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
