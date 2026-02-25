// Category types (lowercase to match backend)
export type Category =
  | 'real estate'
  | 'savings'
  | 'stocks'
  | 'precious metals'
  | 'crypto'
  | 'vehicles'
  | 'retirement'
  | 'debt';

// Raw asset data from Google Sheets
export interface Asset {
  name: string;
  category: Category;
  value: number;
  credit: number;
  debit: number;
  date: string;
}

// Processed category data with totals and percentages
export interface CategoryData {
  category: Category;
  totalValue: number;
  percentage: number;
  assets: Asset[];
  color: string;
  icon: string;
}

// Complete net worth data structure
export interface NetWorthData {
  totalNetWorth: number;
  categories: CategoryData[];
  debtCategories: CategoryData[];
}

// Google Sheets hook return type
export interface UseGoogleSheetsResult {
  data: Asset[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Authentication hook return type
export interface UseAuthResult {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  isBiometricsAvailable: boolean;
  isBiometricsEnabled: boolean;
  enableBiometrics: () => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
}
