export interface UserSettings {
  user_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  disability: 'none' | 'present';
  life_expectancy: number;
  retirement_age: number;
  current_savings: number;
}

export interface Income {
  id: string;
  name: string;
  start_age: number;
  end_age: number;
  amount: number;
  growth_rate: number;
}

export interface Expense {
  id: string;
  name: string;
  start_age: number;
  end_age: number;
  amount: number;
  inflation_rate?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  birth_date: string;
  birth_year: number;
  gender: 'male' | 'female' | 'other';
  disability: 'none' | 'present';
  life_expectancy: number;
}

export interface LifeEvent {
  id: string;
  name: string;
  age: number;
  cost: number;
}

export interface Education {
  id: string;
  owner_id: string;
  name: string;
  start_age: number;
  end_age: number;
  amount: number;
}

export interface Insurance {
  id: string;
  name: string;
  type: string;
  premium: number;
  start_age: number;
  end_age: number;
  coverage?: number;
}

export interface Pension {
  id: string;
  name: string;
  start_age: number;
  amount: number;
}

export interface Housing {
  id: string;
  name: string;
  type: 'rental' | 'owned';
  start_age: number;
  end_age?: number;
  rent?: number;
  initial?: number;
  renewal_cost?: number;
  interval?: number;
  maintenance?: number;
  tax?: number;
  loan_balance?: number;
  loan_monthly?: number;
  loan_end_age?: number;
}

export interface Asset {
  id: string;
  name: string;
  type?: string; // 資産の種類
  current_value: number;
  yearly_contribution: number;
  accumulation_end_age?: number; // 積立終了年齢
  return_rate: number;
  withdrawal_age?: number;
  withdrawal_amount?: number;
}

export interface RealEstate {
  id: string;
  name: string;
  
  // 購入情報
  purchase_date: string; // YYYY-MM
  purchase_price: number;
  initial_cost: number;
  
  // ローン設定
  loan_amount: number;
  loan_rate: number; // %
  loan_duration: number; // 回数 (months)
  
  // 運用収支
  rent_income: number; // 月額
  maintenance_cost: number; // 月額
  property_tax: number; // 年額
  
  // 売却設定 (任意)
  sell_date?: string; // YYYY-MM
  sell_price?: number;
  sell_cost?: number;
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  monthly_payment: number;
  remaining_payments: number;
}

export interface Goals {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface Deposit {
  id: string;
  name: string;
  initial_amount: number;
  return_rate: number;
}

export interface AppData {
  userSettings: UserSettings;
  incomes: Income[];
  expenses: Expense[];
  lifeEvents: LifeEvent[];
  familyMembers: FamilyMember[];
  insurances: Insurance[];
  pensions: Pension[];
  educationFunds: Education[];
  housings: Housing[];
  assets: Asset[];
  realEstates: RealEstate[];
  loans: Loan[];
  goals: Goals;
  deposits: Deposit[];
}

export interface CashFlowData {
  age: number;
  year: number;
  balance: number;      // 総資産 (Total Assets)
  cashBalance: number;  // 貯蓄残高 (Cash Savings Balance)
  assetBalance: number; // 金融資産残高 (Investment Assets Balance)
  yearlySavings: number; // 年間貯蓄額 (Annual Savings Flow)
  income: number;
  expense: number;
}

export interface Collaborator {
  id: string;
  plan_id: string;
  owner_id: string;
  collaborator_id: string | null;
  collaborator_email: string;
  permission: 'view' | 'edit';
  created_at: string;
  updated_at: string;
}

export interface LifePlan {
  id: string;
  user_id: string;
  plan_data: AppData;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  permission?: 'view' | 'edit' | 'owner';
}

export interface FinancialsTabProps {
  deposits: Deposit[];
  onDepositAdd: (deposit: Omit<Deposit, 'id'>) => void;
  onDepositEdit: (id: string, updates: Partial<Deposit>) => void;
  onDelete: (id: string, type: 'deposit') => void;
  onReorder: (id: string, type: string, direction: 'up' | 'down') => void;
}
