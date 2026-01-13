import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { AppData, Loan, RealEstate } from '../types';

interface LoanBalanceTableProps {
  appData: AppData;
}

interface LoanBalanceData {
  age: number;
  year: number;
  loanBalances: { [loanId: string]: number };
}

interface LoanItem {
  id: string;
  name: string;
  type: 'loan' | 'realEstate';
  initialBalance: number;
}

export function LoanBalanceTable({ appData }: LoanBalanceTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasLoans = appData?.loans?.length > 0;
  const hasRealEstateLoans = appData?.realEstates?.some(re => re.loan_amount && re.loan_payments);

  if (!appData || (!hasLoans && !hasRealEstateLoans)) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const userBirthYear = appData.userSettings.birth_date
    ? new Date(appData.userSettings.birth_date).getFullYear()
    : currentYear - 30;
  const currentAge = currentYear - userBirthYear;

  const calculateLoanBalances = (): LoanBalanceData[] => {
    const results: LoanBalanceData[] = [];
    const endAge = appData.userSettings.simulation_end_age || 85;

    for (let age = currentAge; age <= endAge; age++) {
      const year = currentYear + (age - currentAge);
      const loanBalances: { [loanId: string]: number } = {};

      appData.loans.forEach((loan: Loan) => {
        const yearsFromStart = age - currentAge;
        const monthsFromStart = yearsFromStart * 12;

        if (monthsFromStart < loan.remaining_payments) {
          const remainingBalance = loan.balance - (loan.monthly_payment * monthsFromStart);
          loanBalances[loan.id] = Math.max(0, remainingBalance);
        } else {
          loanBalances[loan.id] = 0;
        }
      });

      appData.realEstates.forEach((realEstate: RealEstate) => {
        if (realEstate.loan_payments && realEstate.loan_term_months) {
          const purchaseYear = new Date(realEstate.purchase_date + '-01').getFullYear();
          const birthYear = new Date(appData.userSettings.birth_date).getFullYear();
          const purchaseAge = realEstate.purchase_age || (purchaseYear - birthYear);

          if (age >= purchaseAge) {
            const monthsFromPurchase = (age - purchaseAge) * 12;
            const remainingMonths = Math.max(0, realEstate.loan_term_months - monthsFromPurchase);
            const remainingBalance = realEstate.loan_payments * remainingMonths;

            loanBalances[`re_${realEstate.id}`] = remainingBalance;
          }
        }
      });

      results.push({
        age,
        year,
        loanBalances,
      });
    }

    return results;
  };

  const loanBalanceData = calculateLoanBalances();

  if (loanBalanceData.length === 0) {
    return null;
  }

  const allLoanItems: LoanItem[] = [
    ...appData.loans.map(loan => ({
      id: loan.id,
      name: loan.name,
      type: 'loan' as const,
      initialBalance: loan.balance,
    })),
    ...appData.realEstates
      .filter(re => re.loan_amount && re.loan_payments)
      .map(re => ({
        id: `re_${re.id}`,
        name: `${re.name} (不動産ローン)`,
        type: 'realEstate' as const,
        initialBalance: re.loan_amount!,
      })),
  ];

  return (
    <div className="mt-6">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 mr-2 text-gray-600" />
        ) : (
          <ChevronRight className="h-5 w-5 mr-2 text-gray-600" />
        )}
        <h3 className="text-lg font-semibold text-gray-800">ローン返済残高一覧</h3>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto max-h-[600px] border rounded">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-30 min-w-[150px] border-r border-b border-gray-300">
                  西暦
                </th>
                {loanBalanceData.map((d, i) => (
                  <th key={i} className="px-3 py-2 text-right font-medium text-gray-600 min-w-[80px] border-b border-gray-300">
                    {d.year}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-30 min-w-[150px] border-r border-gray-300">
                  年齢
                </th>
                {loanBalanceData.map((d, i) => (
                  <th key={i} className="px-3 py-2 text-right font-medium text-gray-500 min-w-[80px]">
                    {d.age}歳
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allLoanItems.map((loanItem) => (
                <tr key={loanItem.id}>
                  <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                    {loanItem.name}
                  </td>
                  {loanBalanceData.map((d, i) => {
                    const balance = d.loanBalances[loanItem.id] ?? 0;
                    const hasBalance = balance !== undefined;
                    return (
                      <td key={i} className="px-3 py-2 text-right whitespace-nowrap">
                        {hasBalance && balance > 0 ? (
                          <span className={balance < loanItem.initialBalance * 0.2 ? 'text-green-600' : ''}>
                            {Math.round(balance).toLocaleString()}
                          </span>
                        ) : hasBalance ? (
                          <span className="text-gray-400">完済</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="px-3 py-2 text-gray-800 sticky left-0 z-10 border-r border-gray-300">
                  合計残高
                </td>
                {loanBalanceData.map((d, i) => {
                  const total = Object.values(d.loanBalances).reduce((sum, val) => sum + val, 0);
                  return (
                    <td key={i} className="px-3 py-2 text-right whitespace-nowrap text-blue-700">
                      {Math.round(total).toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {isExpanded && (
        <div className="mt-2 text-xs text-gray-500 text-center py-2">
          単位：万円 / 残高が初期値の20%以下になると緑色で表示
        </div>
      )}
    </div>
  );
}
