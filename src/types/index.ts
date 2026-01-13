export interface UserSettings {
  user_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  disability: 'none' | 'present';
  life_expectancy: number;
  simulation_end_age: number;
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
  current_value: number;
  yearly_contribution: number;
  return_rate: number;
  withdrawal_age?: number;
  withdrawal_amount?: number;
}

export interface RealEstate {
  id: string;
  name: string;
  purchase_price: number;
  current_value: number;
  purchase_age: number;
  initial_cost?: number;
  loan_amount?: number;
  loan_rate?: number;
  loan_payments?: number;
  rent_income?: number;
  maintenance_cost?: number;
  tax?: number;
  sell_date?: string;
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
}

export interface CashFlowData {
  age: number;
  year: number;
  balance: number;
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
