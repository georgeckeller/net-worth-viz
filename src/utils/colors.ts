import { Category } from '../types';

// Category color mapping - vibrant, accessible colors
export const CATEGORY_COLORS: Record<string, string> = {
  'real estate': '#3B82F6',      // Blue
  'savings': '#10B981',           // Green
  'stocks': '#8B5CF6',            // Purple
  'precious metals': '#F59E0B',   // Amber
  'crypto': '#EC4899',            // Pink
  'vehicles': '#6366F1',          // Indigo
  'retirement': '#14B8A6',        // Teal
  'debt': '#FF0000',              // Fire Engine Red
};

// Get color for a category
export const getCategoryColor = (category: Category | string): string => {
  const normalizedCategory = category.toLowerCase();
  return CATEGORY_COLORS[normalizedCategory] || '#6B7280'; // Fallback to gray
};
