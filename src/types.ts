export type IngredientCategory = '蔬菜' | '肉类' | '海鲜' | '豆制品' | '蛋奶' | '主食' | '调料';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  entryDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  daysRemaining?: number; // Calculated on the fly or stored
  status: 'fresh' | 'expiring' | 'expired' | 'used'; // expiring means <= 2 days
  amount?: string; // e.g., "500g", "2个"
}

export interface MealPlanItem {
  dishName: string;
  type: string; // e.g., "高蛋白搭配", "膳食纤维搭配", "快手营养早餐", "一荤一素"
  ingredients: string[]; // List of required food names
  availableIngredients: string[]; // List of names existing in the fridge
  missingIngredients: string[]; // List of names missing (needs purchase/substitute)
  timeMinutes: number;
}

export interface DailyMealPlan {
  dayName: string; // "周一", "周二", ..., "周日"
  staple: string; // e.g., "米饭", "面条", "红薯"
  breakfast: MealPlanItem;
  lunch: MealPlanItem;
  dinner: MealPlanItem;
}

export interface DietarySettings {
  avoidIngredients: string[]; // List of words (e.g., "香菜", "辣", "海鲜")
  cuisinePreference: '中餐' | '西餐' | '混合';
  stapleCalendar: { [key: string]: string }; // Map e.g. {"周一": "米饭", "周二": "面条", ...}
}

export interface RecipeDetails {
  id?: string;
  name: string;
  intro: string;
  timeMinutes: number;
  difficulty: '简单' | '中等' | '困难';
  ingredients: { name: string; amount: string; inStock: boolean }[];
  steps: string[];
  nutrients: {
    proteins: string;
    fibers: string;
    carbs: string;
    calories: string;
  };
}

export type ShakeTag = '快手菜' | '重口味' | '清淡' | '异国风情' | '清空冰箱';
