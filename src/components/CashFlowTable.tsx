import { useState } from 'react';
import { ChevronRight, ChevronDown, Download } from 'lucide-react';
import { CashFlowData, AppData } from '../types';

interface CashFlowTableProps {
  data: CashFlowData[];
  appData?: AppData;
}

interface RowData {
  year: number;
  age: number;
  familyAges: { [id: string]: number | null };
  income: number;
  incomeDetails: { [name: string]: number };
  investmentWithdrawal: number;
  investmentWithdrawalDetails: { [name: string]: number };
  basicExpenses: number;
  expenseDetails: { [name: string]: number };
  educationCost: number;
  educationDetails: { [name: string]: number };
  housingCost: number;
  housingDetails: { [name: string]: number };
  insuranceCost: number;
  insuranceDetails: { [name: string]: number };
  investmentContribution: number;
  investmentContributionDetails: { [name: string]: number };
  eventCost: number;
  eventNames: string;
  balance: number;
  cashBalance: number;
  investmentBalance: number;
  assetBalances: { [name: string]: number };
  savings: number;
}

export function CashFlowTable({ data, appData }: CashFlowTableProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  if (!data || data.length === 0 || !appData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
        <p className="text-gray-500">
          各項目にデータを入力してください
        </p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const userBirthYear = appData.userSettings.birth_date
    ? new Date(appData.userSettings.birth_date).getFullYear()
    : currentYear - 30;
  const currentAge = currentYear - userBirthYear;

  const calculateDetailedData = (): RowData[] => {
    const results: RowData[] = [];
    const endAge = appData.userSettings.simulation_end_age || 85;
    let cashBalance = appData.userSettings.current_savings || 0;

    const assetBalances: { [key: string]: number } = {};
    appData.assets.forEach((asset) => {
      assetBalances[asset.id] = asset.current_value;
    });

    for (let age = currentAge; age <= endAge; age++) {
      const year = currentYear + (age - currentAge);

      const familyAges: { [id: string]: number | null } = {};
      appData.familyMembers.forEach((member) => {
        const memberAge = year - member.birth_year;
        if (memberAge < 0 || (member.life_expectancy && memberAge > member.life_expectancy)) {
          familyAges[member.id] = null;
        } else {
          familyAges[member.id] = memberAge;
        }
      });

      let totalIncome = 0;
      const incomeDetails: { [name: string]: number } = {};

      appData.incomes.forEach((income) => {
        if (age >= income.start_age && age <= income.end_age) {
          const yearsFromStart = age - income.start_age;
          const amount = income.amount * Math.pow(1 + income.growth_rate / 100, yearsFromStart);
          incomeDetails[income.name] = Math.round(amount);
          totalIncome += amount;
        }
      });

      appData.pensions.forEach((pension) => {
        if (age >= pension.start_age) {
          incomeDetails[pension.name] = pension.amount;
          totalIncome += pension.amount;
        }
      });

      let basicExpenses = 0;
      const expenseDetails: { [name: string]: number } = {};

      appData.expenses.forEach((expense) => {
        if (age >= expense.start_age && age <= expense.end_age) {
          const yearsFromStart = age - expense.start_age;
          const inflationRate = expense.inflation_rate || 0;
          const amount = expense.amount * Math.pow(1 + inflationRate / 100, yearsFromStart);
          expenseDetails[expense.name] = Math.round(amount);
          basicExpenses += amount;
        }
      });

      let educationCost = 0;
      const educationDetails: { [name: string]: number } = {};

      appData.educationFunds.forEach((edu) => {
        const member = appData.familyMembers.find((m) => m.id === edu.owner_id);
        if (member) {
          const memberAge = year - member.birth_year;
          if (memberAge >= edu.start_age && memberAge <= edu.end_age) {
            educationDetails[`${member.name}: ${edu.name}`] = edu.amount;
            educationCost += edu.amount;
          }
        }
      });

      let housingCost = 0;
      const housingDetails: { [name: string]: number } = {};

      appData.housings.forEach((housing) => {
        if (age >= housing.start_age && (!housing.end_age || age <= housing.end_age)) {
          let cost = 0;
          if (housing.type === 'rental' && housing.rent) {
            cost = housing.rent * 12;
            if (housing.renewal_cost && housing.interval) {
              const yearsFromStart = age - housing.start_age;
              if (yearsFromStart > 0 && yearsFromStart % housing.interval === 0) {
                cost += housing.renewal_cost;
              }
            }
          } else if (housing.type === 'owned') {
            if (housing.loan_monthly && housing.loan_end_age && age <= housing.loan_end_age) {
              cost += housing.loan_monthly * 12;
            }
            if (housing.maintenance) cost += housing.maintenance * 12;
            if (housing.tax) cost += housing.tax;
          }
          if (cost > 0) {
            housingDetails[housing.name] = Math.round(cost);
            housingCost += cost;
          }
        }
      });

      let insuranceCost = 0;
      const insuranceDetails: { [name: string]: number } = {};

      appData.insurances.forEach((insurance) => {
        if (age >= insurance.start_age && age <= insurance.end_age) {
          insuranceDetails[insurance.name] = insurance.premium;
          insuranceCost += insurance.premium;
        }
      });

      let eventCost = 0;
      const eventNames: string[] = [];

      appData.lifeEvents.forEach((event) => {
        if (event.age === age) {
          eventNames.push(event.name);
          eventCost += event.cost;
        }
      });

      appData.loans.forEach((loan) => {
        const yearsFromStart = age - currentAge;
        const monthsFromStart = yearsFromStart * 12;
        if (monthsFromStart < loan.remaining_payments) {
          const monthsThisYear = Math.min(12, loan.remaining_payments - monthsFromStart);
          const loanPayment = loan.monthly_payment * monthsThisYear;
          housingDetails[`${loan.name} (ローン)`] = Math.round(loanPayment);
          housingCost += loanPayment;
        }
      });

      let totalInvestmentContribution = 0;
      let totalInvestmentWithdrawal = 0;
      const investmentContributionDetails: { [name: string]: number } = {};
      const investmentWithdrawalDetails: { [name: string]: number } = {};

      appData.assets.forEach((asset) => {
        const returnRate = asset.return_rate / 100;
        assetBalances[asset.id] = (assetBalances[asset.id] || 0) * (1 + returnRate);

        if (asset.yearly_contribution > 0) {
          const shouldContribute = !asset.withdrawal_age || age < asset.withdrawal_age;
          const belowEndAge = !asset.contribution_end_age || age <= asset.contribution_end_age;

          if (shouldContribute && belowEndAge) {
            assetBalances[asset.id] += asset.yearly_contribution;
            totalInvestmentContribution += asset.yearly_contribution;
            investmentContributionDetails[asset.name] = asset.yearly_contribution;
          }
        }

        if (asset.withdrawal_age && age >= asset.withdrawal_age && asset.withdrawal_amount) {
          const withdrawal = Math.min(asset.withdrawal_amount, assetBalances[asset.id]);
          assetBalances[asset.id] -= withdrawal;
          totalInvestmentWithdrawal += withdrawal;
          investmentWithdrawalDetails[asset.name] = Math.round(withdrawal);
        }
      });

      appData.realEstates.forEach((property) => {
        if (age >= property.purchase_age) {
          if (property.monthly_rent_income) {
            incomeDetails[`${property.name} (賃料)`] = property.monthly_rent_income * 12;
            totalIncome += property.monthly_rent_income * 12;
          }
          if (property.monthly_maintenance_cost) {
            housingDetails[`${property.name} (管理費)`] = property.monthly_maintenance_cost * 12;
            housingCost += property.monthly_maintenance_cost * 12;
          }
          if (property.annual_property_tax) {
            housingDetails[`${property.name} (税金)`] = property.annual_property_tax;
            housingCost += property.annual_property_tax;
          }
          if (property.loan_payments) {
            housingDetails[`${property.name} (ローン)`] = property.loan_payments * 12;
            housingCost += property.loan_payments * 12;
          }
        }
      });

      const totalExpense = basicExpenses + educationCost + housingCost + insuranceCost + eventCost + totalInvestmentContribution;
      const balance = totalIncome + totalInvestmentWithdrawal - totalExpense;
      cashBalance += balance;

      const investmentBalance = Object.values(assetBalances).reduce((sum, val) => sum + val, 0);
      const savings = cashBalance + investmentBalance;

      const currentAssetBalances: { [name: string]: number } = {};
      appData.assets.forEach((asset) => {
        if (assetBalances[asset.id] && assetBalances[asset.id] > 0) {
          currentAssetBalances[asset.name] = Math.round(assetBalances[asset.id]);
        }
      });

      results.push({
        year,
        age,
        familyAges,
        income: Math.round(totalIncome),
        incomeDetails,
        investmentWithdrawal: Math.round(totalInvestmentWithdrawal),
        investmentWithdrawalDetails,
        basicExpenses: Math.round(basicExpenses),
        expenseDetails,
        educationCost: Math.round(educationCost),
        educationDetails,
        housingCost: Math.round(housingCost),
        housingDetails,
        insuranceCost: Math.round(insuranceCost),
        insuranceDetails,
        investmentContribution: Math.round(totalInvestmentContribution),
        investmentContributionDetails,
        eventCost: Math.round(eventCost),
        eventNames: eventNames.join(', '),
        balance: Math.round(balance),
        cashBalance: Math.round(cashBalance),
        investmentBalance: Math.round(investmentBalance),
        assetBalances: currentAssetBalances,
        savings: Math.round(savings),
      });
    }

    return results;
  };

  const detailedData = calculateDetailedData();

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];

    const yearRow = ['西暦', ...detailedData.map(d => d.year.toString())];
    csvRows.push(yearRow.join(','));

    const userAgeRow = [`${appData.userSettings.user_name || '本人'} (本人)`, ...detailedData.map(d => `${d.age}歳`)];
    csvRows.push(userAgeRow.join(','));

    const otherFamilyMembers = appData.familyMembers.filter(member => member.relation !== 'self');
    if (otherFamilyMembers.length > 0) {
      csvRows.push('');
      csvRows.push('家族情報');

      otherFamilyMembers.forEach(member => {
        const memberRow = [
          `${member.name} (${getRelationLabel(member.relation)})`,
          ...detailedData.map(d => d.familyAges[member.id] !== null ? `${d.familyAges[member.id]}歳` : '-')
        ];
        csvRows.push(memberRow.join(','));
      });
    }

    csvRows.push('');
    csvRows.push('収入');

    const incomeRow = ['収入合計', ...detailedData.map(d => d.income > 0 ? d.income.toString() : '-')];
    csvRows.push(incomeRow.join(','));

    const withdrawalRow = ['金融資産取崩', ...detailedData.map(d => d.investmentWithdrawal > 0 ? d.investmentWithdrawal.toString() : '-')];
    csvRows.push(withdrawalRow.join(','));

    csvRows.push('');
    csvRows.push('支出');

    const basicExpRow = ['基本生活費', ...detailedData.map(d => d.basicExpenses > 0 ? d.basicExpenses.toString() : '-')];
    csvRows.push(basicExpRow.join(','));

    const eduRow = ['教育費', ...detailedData.map(d => d.educationCost > 0 ? d.educationCost.toString() : '-')];
    csvRows.push(eduRow.join(','));

    const housingRow = ['住居費・ローン', ...detailedData.map(d => d.housingCost > 0 ? d.housingCost.toString() : '-')];
    csvRows.push(housingRow.join(','));

    const insuranceRow = ['保険料', ...detailedData.map(d => d.insuranceCost > 0 ? d.insuranceCost.toString() : '-')];
    csvRows.push(insuranceRow.join(','));

    const contributionRow = ['金融資産積立', ...detailedData.map(d => d.investmentContribution > 0 ? d.investmentContribution.toString() : '-')];
    csvRows.push(contributionRow.join(','));

    csvRows.push('');
    csvRows.push('イベント');

    const eventNameRow = ['イベント内容', ...detailedData.map(d => d.eventNames || '-')];
    csvRows.push(eventNameRow.join(','));

    const eventCostRow = ['イベント費用', ...detailedData.map(d => {
      if (d.eventCost !== 0) {
        return d.eventCost < 0 ? `+${Math.abs(d.eventCost)}` : `-${d.eventCost}`;
      }
      return '-';
    })];
    csvRows.push(eventCostRow.join(','));

    csvRows.push('');
    csvRows.push('資産推移');

    const balanceRow = ['年間収支', ...detailedData.map(d => d.balance.toString())];
    csvRows.push(balanceRow.join(','));

    const cashRow = ['預金残高', ...detailedData.map(d => d.cashBalance.toString())];
    csvRows.push(cashRow.join(','));

    const investmentRow = ['金融資産残高', ...detailedData.map(d => d.investmentBalance.toString())];
    csvRows.push(investmentRow.join(','));

    const totalRow = ['総資産残高', ...detailedData.map(d => d.savings.toString())];
    csvRows.push(totalRow.join(','));

    const csv = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cashflow.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderDetailRows = (detailsKey: string, details: { [name: string]: number }[], label: string) => {
    const allKeys = new Set<string>();
    details.forEach((d) => Object.keys(d).forEach((k) => allKeys.add(k)));
    const keys = Array.from(allKeys).sort();

    if (keys.length === 0) return null;

    const isExpanded = expandedSections[detailsKey];

    return (
      <>
        <tr
          className="cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection(detailsKey)}
        >
          <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
            <span className="flex items-center">
              {isExpanded ? <ChevronDown className="h-4 w-4 mr-1 text-gray-400" /> : <ChevronRight className="h-4 w-4 mr-1 text-gray-400" />}
              {label}
            </span>
          </td>
          {detailedData.map((_, i) => {
            const total = Object.values(details[i]).reduce((sum, v) => sum + v, 0);
            return (
              <td key={i} className="px-3 py-2 text-right whitespace-nowrap">
                {total > 0 ? total.toLocaleString() : '-'}
              </td>
            );
          })}
        </tr>
        {isExpanded &&
          keys.map((key) => (
            <tr key={key} className="bg-blue-50">
              <td className="px-3 py-1 text-gray-600 text-xs pl-8 sticky left-0 z-10 border-r border-gray-300 bg-blue-50">
                {key}
              </td>
              {detailedData.map((_, i) => (
                <td key={i} className="px-3 py-1 text-right whitespace-nowrap text-xs text-gray-600">
                  {details[i][key] ? details[i][key].toLocaleString() : '-'}
                </td>
              ))}
            </tr>
          ))}
      </>
    );
  };

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case 'self': return '本人';
      case 'spouse': return '配偶者';
      case 'child': return '子';
      case 'parent': return '親';
      default: return 'その他';
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={handleDownloadCSV}
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          CSV保存
        </button>
      </div>
      <div className="overflow-x-auto max-h-[600px] border rounded">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-20">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-30 min-w-[150px] border-r border-b border-gray-300">
                西暦
              </th>
              {detailedData.map((d, i) => (
                <th key={i} className="px-3 py-2 text-right font-medium text-gray-600 min-w-[80px] border-b border-gray-300">
                  {d.year}
                </th>
              ))}
            </tr>
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-30 min-w-[150px] border-r border-gray-300">
                {appData.userSettings.user_name || '本人'} (本人)
              </th>
              {detailedData.map((d, i) => (
                <th key={i} className="px-3 py-2 text-right font-medium text-gray-500 min-w-[80px]">
                  {d.age}歳
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appData.familyMembers.filter((member) => member.relation !== 'self').length > 0 && (
              <>
                <tr className="bg-gray-200">
                  <td colSpan={detailedData.length + 1} className="px-3 py-1 font-bold text-xs text-gray-700 sticky left-0 z-10">
                    家族情報
                  </td>
                </tr>
                {appData.familyMembers
                  .filter((member) => member.relation !== 'self')
                  .map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                        {member.name} ({getRelationLabel(member.relation)})
                      </td>
                      {detailedData.map((d, i) => (
                        <td key={i} className="px-3 py-2 text-right text-gray-500 text-sm">
                          {d.familyAges[member.id] !== null ? `${d.familyAges[member.id]}歳` : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
              </>
            )}

            <tr className="bg-blue-100">
              <td colSpan={detailedData.length + 1} className="px-3 py-1 font-bold text-xs text-blue-800 sticky left-0 z-10">
                収入
              </td>
            </tr>
            {renderDetailRows('income', detailedData.map((d) => d.incomeDetails), '収入合計')}
            {renderDetailRows('investmentWithdrawal', detailedData.map((d) => d.investmentWithdrawalDetails), '金融資産取崩')}

            <tr className="bg-red-100">
              <td colSpan={detailedData.length + 1} className="px-3 py-1 font-bold text-xs text-red-800 sticky left-0 z-10">
                支出
              </td>
            </tr>
            {renderDetailRows('expense', detailedData.map((d) => d.expenseDetails), '基本生活費')}
            {renderDetailRows('education', detailedData.map((d) => d.educationDetails), '教育費')}
            {renderDetailRows('housing', detailedData.map((d) => d.housingDetails), '住居費・ローン')}
            {renderDetailRows('insurance', detailedData.map((d) => d.insuranceDetails), '保険料')}
            {renderDetailRows('investmentContribution', detailedData.map((d) => d.investmentContributionDetails), '金融資産積立')}

            <tr className="bg-yellow-100">
              <td colSpan={detailedData.length + 1} className="px-3 py-1 font-bold text-xs text-yellow-800 sticky left-0 z-10">
                イベント
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                イベント内容
              </td>
              {detailedData.map((d, i) => (
                <td key={i} className="px-3 py-2 text-right text-xs whitespace-nowrap">
                  {d.eventNames || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                イベント費用
              </td>
              {detailedData.map((d, i) => (
                <td key={i} className="px-3 py-2 text-right whitespace-nowrap">
                  {d.eventCost !== 0 ? (
                    d.eventCost < 0 ? (
                      <span className="text-green-600">+{Math.abs(d.eventCost).toLocaleString()}</span>
                    ) : (
                      <span className="text-red-600">-{d.eventCost.toLocaleString()}</span>
                    )
                  ) : '-'}
                </td>
              ))}
            </tr>

            <tr className="bg-green-100">
              <td colSpan={detailedData.length + 1} className="px-3 py-1 font-bold text-xs text-green-800 sticky left-0 z-10">
                資産推移
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-700 font-bold bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                年間収支
              </td>
              {detailedData.map((d, i) => (
                <td key={i} className={`px-3 py-2 text-right whitespace-nowrap font-bold ${d.balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {d.balance.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-gray-700 font-medium bg-gray-50 sticky left-0 z-10 border-r border-gray-300">
                預金残高
              </td>
              {detailedData.map((d, i) => (
                <td key={i} className={`px-3 py-2 text-right whitespace-nowrap ${d.cashBalance < 0 ? 'text-red-600 font-bold' : ''}`}>
                  {d.cashBalance.toLocaleString()}
                </td>
              ))}
            </tr>
            {renderDetailRows('assets', detailedData.map((d) => d.assetBalances), '金融資産残高')}
            <tr className="bg-green-50">
              <td className="px-3 py-2 text-gray-700 font-bold bg-green-50 sticky left-0 z-10 border-r border-gray-300">
                総資産残高
              </td>
              {detailedData.map((d, i) => (
                <td key={i} className={`px-3 py-2 text-right whitespace-nowrap font-bold ${d.savings < 0 ? 'text-red-600 bg-red-50' : ''}`}>
                  {d.savings.toLocaleString()}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center py-2">
        単位：万円 / 項目をクリックすると詳細を表示
      </div>
    </div>
  );
}
