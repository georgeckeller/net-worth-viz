import { Category } from '../types';
import { CATEGORY_COLORS } from '../utils/colors';

// Category configuration with icons
export interface CategoryConfig {
  category: Category;
  color: string;
  icon: string;
  description: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    category: 'real estate',
    color: CATEGORY_COLORS['real estate'],
    icon: '🏠',
    description: 'Properties and real estate holdings',
  },
  {
    category: 'savings',
    color: CATEGORY_COLORS.savings,
    icon: '💰',
    description: 'Cash savings and bank accounts',
  },
  {
    category: 'stocks',
    color: CATEGORY_COLORS.stocks,
    icon: '📈',
    description: 'Stock portfolio and investments',
  },
  {
    category: 'precious metals',
    color: CATEGORY_COLORS['precious metals'],
    icon: '🥇',
    description: 'Gold, silver, and precious metals',
  },
  {
    category: 'crypto',
    color: CATEGORY_COLORS.crypto,
    icon: '₿',
    description: 'Cryptocurrency holdings',
  },
  {
    category: 'vehicles',
    color: CATEGORY_COLORS.vehicles,
    icon: '🚗',
    description: 'Cars, boats, and other vehicles',
  },
];

// Get config for a category
export const getCategoryConfig = (category: Category): CategoryConfig | undefined => {
  return CATEGORY_CONFIGS.find((config) => config.category === category);
};
