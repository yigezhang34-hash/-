import { Ingredient, DietarySettings, DailyMealPlan } from "../types";

// Generates an ISO date string offset from today by a number of days
export function getOffsetDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: "1",
    name: "新鲜大明虾",
    category: "海鲜",
    entryDate: getOffsetDateString(-2),
    expiryDate: getOffsetDateString(1), // Expiry tomorrow, will highlight red (1 days remaining)
    status: "expiring",
    amount: "500g",
  },
  {
    id: "2",
    name: "五花肉",
    category: "肉类",
    entryDate: getOffsetDateString(-1),
    expiryDate: getOffsetDateString(2), // Expiry in 2 days (highlight yellow)
    status: "expiring",
    amount: "350g",
  },
  {
    id: "3",
    name: "西兰花",
    category: "蔬菜",
    entryDate: getOffsetDateString(-2),
    expiryDate: getOffsetDateString(4), // Expiry in 4 days
    status: "fresh",
    amount: "1颗",
  },
  {
    id: "4",
    name: "草鸡蛋",
    category: "蛋奶",
    entryDate: getOffsetDateString(-3),
    expiryDate: getOffsetDateString(10), // Fresh
    status: "fresh",
    amount: "6枚",
  },
  {
    id: "5",
    name: "老豆腐",
    category: "豆制品",
    entryDate: getOffsetDateString(0),
    expiryDate: getOffsetDateString(1), // Expiry tomorrow!
    status: "expiring",
    amount: "1盒",
  },
  {
    id: "6",
    name: "番茄",
    category: "蔬菜",
    entryDate: getOffsetDateString(-1),
    expiryDate: getOffsetDateString(5),
    status: "fresh",
    amount: "3个",
  }
];

export const DEFAULT_DIETARY_SETTINGS: DietarySettings = {
  cuisinePreference: "中餐",
  avoidIngredients: ["香菜"],
  stapleCalendar: {
    "周一": "米饭",
    "周二": "面条",
    "周三": "红薯",
    "周四": "米饭",
    "周五": "意面",
    "周六": "杂粮饭",
    "周日": "燕麦粥"
  }
};

// Simple visual starter meal plan to display before AI is first invoked
export const MOCK_STARTER_PLAN: DailyMealPlan[] = [
  {
    dayName: "周一",
    staple: "米饭",
    breakfast: {
      dishName: "番茄炒蛋面",
      type: "快手营养早餐",
      ingredients: ["面条", "番茄", "鸡蛋"],
      availableIngredients: ["番茄", "草鸡蛋"],
      missingIngredients: ["面条", "小葱"],
      timeMinutes: 10
    },
    lunch: {
      dishName: "白灼大明虾 + 蒜蓉西兰花",
      type: "临期食材·高钙高纤搭配",
      ingredients: ["大明虾", "西兰花", "大蒜"],
      availableIngredients: ["新鲜大明虾", "西兰花"],
      missingIngredients: ["大蒜", "生姜", "料酒"],
      timeMinutes: 20
    },
    dinner: {
      dishName: "红烧肉炖老豆腐",
      type: "临期食材·高蛋白温润搭配",
      ingredients: ["五花肉", "老豆腐", "生抽"],
      availableIngredients: ["五花肉", "老豆腐"],
      missingIngredients: ["生抽", "八角", "生姜"],
      timeMinutes: 35
    }
  },
  {
    dayName: "周二",
    staple: "面条",
    breakfast: {
      dishName: "荷包蛋牛奶燕麦",
      type: "快手优质长碳水",
      ingredients: ["鸡蛋", "牛奶", "燕麦"],
      availableIngredients: ["草鸡蛋"],
      missingIngredients: ["牛奶", "燕麦"],
      timeMinutes: 8
    },
    lunch: {
      dishName: "番茄肥牛面",
      type: "健康酸甜高蛋白",
      ingredients: ["面条", "番茄", "肥牛"],
      availableIngredients: ["番茄"],
      missingIngredients: ["面条", "肥牛", "香菇"],
      timeMinutes: 15
    },
    dinner: {
      dishName: "西兰花炒蛋",
      type: "清淡素雅高纤维",
      ingredients: ["西兰花", "鸡蛋", "蒜瓣"],
      availableIngredients: ["西兰花", "草鸡蛋"],
      missingIngredients: ["蒜瓣"],
      timeMinutes: 12
    }
  },
  {
    dayName: "周三",
    staple: "红薯",
    breakfast: {
      dishName: "蒸红薯 + 煮鸡蛋",
      type: "低脂低GI轻能量粉膳",
      ingredients: ["红薯", "西兰花", "鸡蛋"],
      availableIngredients: ["草鸡蛋", "西兰花"],
      missingIngredients: ["红薯"],
      timeMinutes: 15
    },
    lunch: {
      dishName: "鲜虾西兰花意面",
      type: "均衡轻食元气餐",
      ingredients: ["大明虾", "西兰花", "橄榄油", "意面"],
      availableIngredients: ["新鲜大明虾", "西兰花"],
      missingIngredients: ["意面", "黑胡椒"],
      timeMinutes: 18
    },
    dinner: {
      dishName: "家常豆腐炖五花肉",
      type: "高钙慢碳温胃菜",
      ingredients: ["老豆腐", "五花肉", "生抽", "青椒"],
      availableIngredients: ["老豆腐", "五花肉"],
      missingIngredients: ["生抽", "盐"],
      timeMinutes: 25
    }
  },
  {
    dayName: "周四",
    staple: "米饭",
    breakfast: {
      dishName: "番茄蛋花汤泡饭",
      type: "中式热乎暖胃餐",
      ingredients: ["米饭", "番茄", "鸡蛋"],
      availableIngredients: ["番茄", "草鸡蛋"],
      missingIngredients: ["米饭", "香油"],
      timeMinutes: 10
    },
    lunch: {
      dishName: "香煎大虾生菜沙拉",
      type: "高纤维低热量减脂餐",
      ingredients: ["大明虾", "番茄", "生菜", "沙拉酱"],
      availableIngredients: ["新鲜大明虾", "番茄"],
      missingIngredients: ["生菜", "沙拉酱"],
      timeMinutes: 15
    },
    dinner: {
      dishName: "五花肉炒西兰花",
      type: "鲜美可口家常小炒",
      ingredients: ["五花肉", "西兰花", "生抽"],
      availableIngredients: ["五花肉", "西兰花"],
      missingIngredients: ["大蒜", "生抽"],
      timeMinutes: 15
    }
  },
  {
    dayName: "周五",
    staple: "意面",
    breakfast: {
      dishName: "芝士蛋吐司",
      type: "西式高钙能量点心",
      ingredients: ["鸡蛋", "面包", "起司"],
      availableIngredients: ["草鸡蛋"],
      missingIngredients: ["面包", "起司"],
      timeMinutes: 12
    },
    lunch: {
      dishName: "鲜美嫩豆腐番茄汤面",
      type: "酸甜解腻消积食餐",
      ingredients: ["老豆腐", "番茄", "挂面"],
      availableIngredients: ["老豆腐", "番茄"],
      missingIngredients: ["挂面", "香葱"],
      timeMinutes: 15
    },
    dinner: {
      dishName: "大明虾红烧五花肉套餐",
      type: "金秋硬菜·能量犒劳大餐",
      ingredients: ["新鲜大明虾", "五花肉", "姜蒜"],
      availableIngredients: ["新鲜大明虾", "五花肉"],
      missingIngredients: ["生姜", "大蒜", "八角", "料酒"],
      timeMinutes: 40
    }
  },
  {
    dayName: "周六",
    staple: "杂粮饭",
    breakfast: {
      dishName: "香甜玉米红薯羹",
      type: "谷物高纤维膳食",
      ingredients: ["红薯", "玉米", "燕麦"],
      availableIngredients: ["草鸡蛋"],
      missingIngredients: ["红薯", "玉米", "燕麦"],
      timeMinutes: 15
    },
    lunch: {
      dishName: "西兰花鸡蛋煎饼",
      type: "低GI健康快手主食",
      ingredients: ["西兰花", "草鸡蛋", "面粉"],
      availableIngredients: ["西兰花", "草鸡蛋"],
      missingIngredients: ["面粉", "熟芝麻"],
      timeMinutes: 12
    },
    dinner: {
      dishName: "番茄炖滑嫩豆腐",
      type: "无敏轻负担低热量晚餐",
      ingredients: ["老豆腐", "番茄", "香葱"],
      availableIngredients: ["老豆腐", "番茄"],
      missingIngredients: ["香葱", "水淀粉"],
      timeMinutes: 15
    }
  },
  {
    dayName: "周日",
    staple: "燕麦粥",
    breakfast: {
      dishName: "牛奶海盐燕麦粥",
      type: "暖心燕麦排毒餐",
      ingredients: ["牛奶", "燕麦", "蜂蜜"],
      availableIngredients: ["草鸡蛋"],
      missingIngredients: ["牛奶", "燕麦", "蜂蜜"],
      timeMinutes: 8
    },
    lunch: {
      dishName: "大明虾海鲜面",
      type: "鲜气满满饱腹能量餐",
      ingredients: ["新鲜大明虾", "面条", "生抽"],
      availableIngredients: ["新鲜大明虾"],
      missingIngredients: ["面条", "大蒜", "小葱"],
      timeMinutes: 15
    },
    dinner: {
      dishName: "香煎豆腐五花肉西兰花拼盘",
      type: "高纤维高敏蛋白质超级碗",
      ingredients: ["老豆腐", "五花肉", "西兰花"],
      availableIngredients: ["老豆腐", "五花肉", "西兰花"],
      missingIngredients: ["橄榄油", "胡椒粉"],
      timeMinutes: 20
    }
  }
];

export const QUICK_ADD_TAGS = [
  { name: "鸡蛋", category: "蛋奶" as const, days: 12 },
  { name: "猪五花肉", category: "肉类" as const, days: 3 },
  { name: "西兰花", category: "蔬菜" as const, days: 5 },
  { name: "番茄", category: "蔬菜" as const, days: 6 },
  { name: "大明虾", category: "海鲜" as const, days: 2 },
  { name: "豆腐", category: "豆制品" as const, days: 2 },
  { name: "生牛奶", category: "蛋奶" as const, days: 7 },
  { name: "鸡胸肉", category: "肉类" as const, days: 4 },
  { name: "青椒", category: "蔬菜" as const, days: 7 }
];
