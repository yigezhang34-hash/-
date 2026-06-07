/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Refrigerator, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  Clock, 
  Flame, 
  Check, 
  X, 
  Settings, 
  Utensils, 
  ChefHat, 
  AlertTriangle, 
  CalendarDays, 
  CheckCircle, 
  HelpCircle,
  HelpCircle as QuestionIcon,
  RotateCw,
  Search,
  ShoppingCart,
  Egg,
  Heart,
  ChevronRight,
  Sparkle,
  User,
  Pencil,
  Award,
  BookOpen,
  Smile,
  Activity,
  TrendingUp,
  Compass,
  Lock,
  Shield,
  LogOut
} from "lucide-react";
import { 
  Ingredient, 
  IngredientCategory, 
  DailyMealPlan, 
  DietarySettings, 
  RecipeDetails, 
  ShakeTag 
} from "./types";
import { 
  INITIAL_INGREDIENTS, 
  DEFAULT_DIETARY_SETTINGS, 
  MOCK_STARTER_PLAN, 
  QUICK_ADD_TAGS,
  getOffsetDateString 
} from "./utils/defaultData";
import RecipeModal from "./components/RecipeModal";

export interface UserProfile {
  username: string;
  isRegistered: boolean;
  ageGroup: string;       // "18-24 岁" | "25-34 岁" | "35-49 岁" | "50 岁以上"
  gender: string;         // '👨 男性' | '👩 女性' | '🔒 不透露'
  livingCount: string;    // '1人' | '2人' | '3人+'
  bodyStatus: string;     // '🌿 无特殊' | '🌡️ 肠胃敏感' ...
  lifeGoals: string[];    // max 2
  avoidItems: string[];   // fast avoid items
  avatarUrl: string;      // e.g. "🥦" or emoji
  signature: string;      // e.g. "正在减脂的独居选手"
  dietPersonality: string; // e.g. "蛋白质狂魔"
  registerDate: string;    // date string
}

export interface RegisteredAccount {
  username: string;
  password?: string;
  profile: UserProfile;
}

export default function App() {
  // Local state persisted in localStorage
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem("daily_recipe_ingredients");
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [dietarySettings, setDietarySettings] = useState<DietarySettings>(() => {
    const saved = localStorage.getItem("daily_recipe_settings");
    return saved ? JSON.parse(saved) : DEFAULT_DIETARY_SETTINGS;
  });

  const [mealPlan, setMealPlan] = useState<DailyMealPlan[]>(() => {
    const saved = localStorage.getItem("daily_recipe_mealplan");
    return saved ? JSON.parse(saved) : MOCK_STARTER_PLAN;
  });

  // Registered Accounts & Current User
  const [accounts, setAccounts] = useState<RegisteredAccount[]>(() => {
    const saved = localStorage.getItem("daily_recipe_accounts");
    return saved ? JSON.parse(saved) : [];
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("daily_recipe_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<'home' | 'plan' | 'creative' | 'profile'>('home');
  
  // Onboarding UI Flow states
  const [onboardingStep, setOnboardingStep] = useState<number>(0); // 0: Login/Register, 1: Age, 2: Gender & Household, 3: Diet & Avoid
  const [onboardingMode, setOnboardingMode] = useState<'register' | 'login'>('register');
  
  // Onboarding temp variables
  const [tempUsername, setTempUsername] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [tempAgeGroup, setTempAgeGroup] = useState("25-34 岁 (职场白领)");
  const [tempGender, setTempGender] = useState("🔒 不透露");
  const [tempLivingCount, setTempLivingCount] = useState("1人");
  const [tempBodyStatus, setTempBodyStatus] = useState("🌿 无特殊");
  const [tempLifeGoals, setTempLifeGoals] = useState<string[]>(["📚 日常"]);
  const [tempAvoidItems, setTempAvoidItems] = useState<string[]>([]);
  const [tempAvatar, setTempAvatar] = useState("🥑");
  const [tempSignature, setTempSignature] = useState("独处时，好好吃饭。");

  // Profile page state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editSignature, setEditSignature] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPersonality, setEditPersonality] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editLivingCount, setEditLivingCount] = useState("");
  const [editBodyStatus, setEditBodyStatus] = useState("");
  const [editLifeGoals, setEditLifeGoals] = useState<string[]>([]);
  const [editAvoidItems, setEditAvoidItems] = useState<string[]>([]);

  // Mood history (index 0 for Sunday... 6 for Saturday or simple array of size 7)
  const [moodHistory, setMoodHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("daily_recipe_mood_history");
    return saved ? JSON.parse(saved) : ["😋", "😌", "😐", "😋", "😌", "😋", "😋"];
  });
  const [selectedMood, setSelectedMood] = useState<string>(() => {
    return moodHistory[6] || "😋"; // Default to check today's mood
  });
  const [showMoodCalendar, setShowMoodCalendar] = useState(false);

  // Creative overlays in Profile Tab
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'handbook' | 'badges' | 'personality' | 'report'>('none');
  const [profileStatsZero, setProfileStatsZero] = useState(false);
  
  // App states
  const [selectedDay, setSelectedDay] = useState<string>("周一");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Modals / Overlays
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState<boolean>(false);
  const [isPlanGenerating, setIsPlanGenerating] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  
  // Interactive additions
  const [foodInput, setFoodInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<IngredientCategory>("蔬菜");
  const [amountInput, setAmountInput] = useState("");
  const [expDaysInput, setExpDaysInput] = useState("5");
  const [bulkInput, setBulkInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Creative Shake tab states
  const [shakeTag, setShakeTag] = useState<ShakeTag>("快手菜");
  const [isShaking, setIsShaking] = useState(false);
  const [shakeResult, setShakeResult] = useState<RecipeDetails | null>(null);
  const [isShakeLoading, setIsShakeLoading] = useState(false);

  // Settings edits
  const [newAvoidItem, setNewAvoidItem] = useState("");
  
  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("daily_recipe_ingredients", JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem("daily_recipe_settings", JSON.stringify(dietarySettings));
  }, [dietarySettings]);

  useEffect(() => {
    localStorage.setItem("daily_recipe_mealplan", JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem("daily_recipe_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("daily_recipe_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("daily_recipe_mood_history", JSON.stringify(moodHistory));
  }, [moodHistory]);

  // Utility toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Turn rough technical Gemini error strings into cozy, friendly alerts
  const getFriendlyErrorMessage = (errorMsg: string): string => {
    if (!errorMsg) return "料理灵感暂没对上频道，我们稍微一会再试试哦 🍮";
    
    let parsedMessage = errorMsg;
    try {
      if (errorMsg.includes("{")) {
        const startIdx = errorMsg.indexOf("{");
        const endIdx = errorMsg.lastIndexOf("}") + 1;
        const jsonStr = errorMsg.slice(startIdx, endIdx);
        const parsed = JSON.parse(jsonStr);
        if (parsed?.error?.message) {
          parsedMessage = parsed.error.message;
        } else if (parsed?.message) {
          parsedMessage = parsed.message;
        }
      }
    } catch (_) {
      // Keep original message if parsing fails
    }

    const lower = parsedMessage.toLowerCase();
    if (lower.includes("503") || lower.includes("demand") || lower.includes("unavailable") || lower.includes("busy") || lower.includes("overload")) {
      return "🍛 AI大厨客满排单中 (Google Gemini 503 忙碌)，已为您奉上我们特调的高品质参考餐单，可以稍微喝杯茶晚一点重新生成哦~";
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("limit") || lower.includes("rate")) {
      return "🍵 大厨研磨灵感太快啦（请求触发限流），已为您呈上经典经典膳食谱，等一两秒再次尝试摇一摇吧~";
    }
    if (lower.includes("key") || lower.includes("api_key") || lower.includes("credential")) {
      return "🔑 尚未检测到有效的 AI 秘钥，请在设置中配置 GEMINI_API_KEY 后，体验极致智能大厨调配！";
    }
    
    return parsedMessage;
  };

  // Status computation for ingredients
  const getDaysRemaining = (expiryDateStr?: string): number => {
    if (!expiryDateStr) return 99;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Add Ingredient
  const handleAddIngredient = (name: string, category: IngredientCategory, days: number, amount: string = "") => {
    if (!name.trim()) return;
    const expiryDate = getOffsetDateString(days);
    const newIng: Ingredient = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      entryDate: getOffsetDateString(0),
      expiryDate,
      daysRemaining: days,
      status: days <= 2 ? 'expiring' : 'fresh',
      amount: amount.trim() || undefined
    };
    setIngredients(prev => [newIng, ...prev]);
    showToast(`成功放入冰箱: ${name} (${amount || "适量"})`, 'success');
  };

  // Handle Form submit
  const submitSingleIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;
    const days = parseInt(expDaysInput) || 5;
    handleAddIngredient(foodInput, categoryInput, days, amountInput);
    setFoodInput("");
    setAmountInput("");
  };

  // Bulk input parser split by commas/newlines
  const submitBulkIngredients = () => {
    if (!bulkInput.trim()) return;
    const items = bulkInput.split(/[,\n，\n]/).map(x => x.trim()).filter(Boolean);
    let count = 0;
    items.forEach(item => {
      // Simple smart heuristics to guess category
      let cat: IngredientCategory = '蔬菜';
      let days = 5;
      
      const meatKeywords = ["肉", "鸡", "鸭", "牛", "羊", "排骨", "翅", "熟食"];
      const seafoodKeywords = ["虾", "蟹", "鱼", "贝", "海带", "蚝"];
      const soyKeywords = ["豆腐", "豆浆", "豆皮", "腐竹", "豆制品"];
      const milkKeywords = ["奶", "蛋", "芝士", "乳", "黄油"];
      const stapleKeywords = ["米", "面", "粉", "薯", "馒头", "面包", "燕麦"];
      const spiceKeywords = ["盐", "油", "酱", "醋", "蒜", "姜", "葱", "椒", "八角", "桂皮"];

      if (meatKeywords.some(kw => item.includes(kw))) { cat = '肉类'; days = 3; }
      else if (seafoodKeywords.some(kw => item.includes(kw))) { cat = '海鲜'; days = 2; }
      else if (soyKeywords.some(kw => item.includes(kw))) { cat = '豆制品'; days = 2; }
      else if (milkKeywords.some(kw => item.includes(kw))) { cat = '蛋奶'; days = 10; }
      else if (stapleKeywords.some(kw => item.includes(kw))) { cat = '主食'; days = 30; }
      else if (spiceKeywords.some(kw => item.includes(kw))) { cat = '调料'; days = 180; }

      handleAddIngredient(item, cat, days);
      count++;
    });
    setBulkInput("");
    if (count > 0) {
      showToast(`批量录入成功，已智能归类 ${count} 种食材`, 'success');
    }
  };

  // Delete/Use ingredient
  const deleteIngredient = (id: string, name: string) => {
    setIngredients(prev => prev.filter(item => item.id !== id));
    showToast(`已从冰箱清理食材: ${name}`, 'info');
  };

  const markAsUsed = (id: string, name: string) => {
    setIngredients(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'used' as const };
      }
      return item;
    }));
    showToast(`标记已制作完成: ${name}`, 'success');
  };

  // Generate Weekly diet plan via server-side Gemini logic
  const handleGenerateAIPlan = async () => {
    setIsPlanGenerating(true);
    showToast("大厨正在分析冰箱库存，进行智能排餐...", "info");
    try {
      const activeIngredients = ingredients.filter(i => i.status !== 'used');
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: activeIngredients,
          settings: dietarySettings
        })
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.plan) && data.plan.length > 0) {
        setMealPlan(data.plan);
        showToast("✨ AI 专属科学膳食主食日历排餐成功生成！", "success");
      } else {
        throw new Error(data.error || "排餐格式有误");
      }
    } catch (e: any) {
      console.error(e);
      const friendlyMsg = getFriendlyErrorMessage(e.message);
      showToast(friendlyMsg, "error");
    } finally {
      setIsPlanGenerating(false);
    }
  };

  // Click on a meal option to view recipe steps
  const fetchRecipeDetails = async (dishName: string, available: string[]) => {
    setIsRecipeLoading(true);
    setSelectedRecipe({
      name: dishName,
      intro: "大厨正用文火慢熬这道菜谱...",
      timeMinutes: 15,
      difficulty: "简单",
      ingredients: [],
      steps: [],
      nutrients: { proteins: "计算中", fibers: "分析中", carbs: "调配中", calories: "估算中" }
    });
    
    try {
      const response = await fetch("/api/recipe-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName, availableIngredients: available })
      });
      const data = await response.json();
      if (data.success && data.recipe) {
        setSelectedRecipe(data.recipe);
      } else {
        throw new Error(data.error || "大厨忙碌中");
      }
    } catch (e: any) {
      const friendlyMsg = getFriendlyErrorMessage(e.message);
      showToast(`获取详细菜谱失败: ${friendlyMsg}`, 'error');
      setSelectedRecipe(null);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // Creative Tab: Shake feature
  const triggerShake = async () => {
    if (isShaking) return;
    setIsShaking(true);
    setShakeResult(null);
    
    // Simulate interactive dynamic physics shaking
    setTimeout(async () => {
      setIsShaking(false);
      setIsShakeLoading(true);
      showToast(`哐当哐当~ 正在为您检索 [${shakeTag}] 灵感`, 'info');
      
      try {
        const response = await fetch("/api/shake-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredients: ingredients.filter(i => i.status !== 'used'),
            tag: shakeTag,
            dietarySettings
          })
        });
        const data = await response.json();
        if (data.success && data.recipe) {
          setShakeResult(data.recipe);
          showToast(`💡 成功发现一道美味: ${data.recipe.name}!`, 'success');
        } else {
          throw new Error(data.error || "没有摇中灵感");
        }
      } catch (e: any) {
        const friendlyMsg = getFriendlyErrorMessage(e.message);
        showToast(`摇一摇失败: ${friendlyMsg}`, 'error');
      } finally {
        setIsShakeLoading(false);
      }
    }, 1200);
  };

  // Add more avoidance tags
  const addAvoidItem = () => {
    if (!newAvoidItem.trim()) return;
    if (dietarySettings.avoidIngredients.includes(newAvoidItem.trim())) return;
    setDietarySettings(prev => ({
      ...prev,
      avoidIngredients: [...prev.avoidIngredients, newAvoidItem.trim()]
    }));
    setNewAvoidItem("");
    showToast(`忌口添加成功: ${newAvoidItem}`, 'success');
  };

  const removeAvoidItem = (itemToDelete: string) => {
    setDietarySettings(prev => ({
      ...prev,
      avoidIngredients: prev.avoidIngredients.filter(it => it !== itemToDelete)
    }));
    showToast(`已移出忌口名单: ${itemToDelete}`, 'info');
  };

  const updateStaple = (day: string, value: string) => {
    setDietarySettings(prev => ({
      ...prev,
      stapleCalendar: {
        ...prev.stapleCalendar,
        [day]: value
      }
    }));
  };

  // Staple Food Adorable Icon Mapping Helper
  const getStapleIcon = (stapleName: string) => {
    const s = stapleName || "";
    if (s.includes("米饭")) return "🍚";
    if (s.includes("面") || s.includes("粉")) return "🍜";
    if (s.includes("薯") || s.includes("紫薯")) return "🍠";
    if (s.includes("麦") || s.includes("粥")) return "🥣";
    if (s.includes("包") || s.includes("面包")) return "🍞";
    if (s.includes("玉") || s.includes("玉米")) return "🌽";
    if (s.includes("饺") || s.includes("馄饨")) return "🥟";
    return "🍽️";
  };

  // Account logging/switching handlers
  const handleOnboardingComplete = () => {
    if (!tempUsername.trim()) {
      showToast("别忘了给自己取一个心仪的昵称哦 🥑", "error");
      return;
    }
    
    let dietPersonality = "膳食平衡大师";
    if (tempLifeGoals.includes("🥗 减脂")) {
      dietPersonality = "减脂燃脂专家";
    } else if (tempLifeGoals.includes("💪 增肌")) {
      dietPersonality = "优质蛋白质狂魔";
    } else if (tempLifeGoals.includes("🍬 控糖")) {
      dietPersonality = "低GI慢碳先锋";
    } else if (tempLifeGoals.includes("⏰ 轻断食")) {
      dietPersonality = "轻断自律达人";
    } else if (tempLifeGoals.includes("🌙 熬夜多")) {
      dietPersonality = "熬夜修仙养生掌门";
    } else if (tempLifeGoals.includes("📚 日常")) {
      dietPersonality = "家常暖胃掌勺人";
    }
    
    const newProfile: UserProfile = {
      username: tempUsername,
      isRegistered: true,
      ageGroup: tempAgeGroup,
      gender: tempGender,
      livingCount: tempLivingCount,
      bodyStatus: tempBodyStatus,
      lifeGoals: tempLifeGoals,
      avoidItems: tempAvoidItems,
      avatarUrl: tempAvatar,
      signature: tempSignature || "独处时，好好吃饭。",
      dietPersonality: dietPersonality,
      registerDate: new Date().toISOString().split("T")[0]
    };

    // Save to accounts registry
    const foundIdx = accounts.findIndex(ac => ac.username.trim().toLowerCase() === tempUsername.trim().toLowerCase());
    let updatedAccs = [...accounts];
    if (foundIdx >= 0) {
      updatedAccs[foundIdx] = { ...updatedAccs[foundIdx], profile: newProfile };
    } else {
      updatedAccs.push({
        username: tempUsername,
        password: tempPassword,
        profile: newProfile
      });
    }

    setAccounts(updatedAccs);
    setUserProfile(newProfile);
    
    // Auto sync avoid items back to dietarySettings
    setDietarySettings(prev => ({
      ...prev,
      avoidIngredients: tempAvoidItems.length > 0 ? tempAvoidItems.map(it => it.replace("不吃", "").replace("无", "")) : prev.avoidIngredients
    }));

    showToast(`🎉 欢迎入住！保卫官 ${tempUsername}，大厨已为您就绪！`, "success");
    setOnboardingStep(0);
  };

  const handleLogin = () => {
    if (!tempUsername.trim()) {
      showToast("请输入用户名 🔑", "error");
      return;
    }
    const found = accounts.find(ac => ac.username.trim().toLowerCase() === tempUsername.trim().toLowerCase());
    if (found) {
      setUserProfile(found.profile);
      showToast(`✨ 欢迎回来！保卫官 ${found.profile.username}，您的资料及设置已同步。`, "success");
    } else {
      showToast("用户名未找到，请先注册全新帐户 🍳", "info");
      setOnboardingMode('register');
    }
  };

  // Open half-screen edit sheet
  const handleOpenEditProfile = () => {
    if (!userProfile) return;
    setEditUsername(userProfile.username);
    setEditSignature(userProfile.signature);
    setEditAvatar(userProfile.avatarUrl);
    setEditPersonality(userProfile.dietPersonality);
    setEditAgeGroup(userProfile.ageGroup);
    setEditGender(userProfile.gender);
    setEditLivingCount(userProfile.livingCount);
    setEditBodyStatus(userProfile.bodyStatus);
    setEditLifeGoals(userProfile.lifeGoals);
    setEditAvoidItems(userProfile.avoidItems);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!editUsername.trim()) {
      showToast("用户名不能为空哦", "error");
      return;
    }

    const updatedProfile: UserProfile = {
      ...userProfile!,
      username: editUsername,
      signature: editSignature,
      avatarUrl: editAvatar,
      dietPersonality: editPersonality,
      ageGroup: editAgeGroup,
      gender: editGender,
      livingCount: editLivingCount,
      bodyStatus: editBodyStatus,
      lifeGoals: editLifeGoals,
      avoidItems: editAvoidItems
    };

    // Update state & store
    setUserProfile(updatedProfile);
    setAccounts(prev => prev.map(ac => ac.username === userProfile?.username ? { ...ac, profile: updatedProfile, username: editUsername } : ac));
    
    // Sync dietary settings too
    setDietarySettings(prev => ({
      ...prev,
      avoidIngredients: editAvoidItems.length > 0 ? editAvoidItems.map(it => it.replace("不吃", "").replace("无", "")) : prev.avoidIngredients
    }));

    setShowEditProfileModal(false);
    showToast("个人资料修改成功！🌾", "success");
  };

  const toggleEditLifeGoal = (goal: string) => {
    setEditLifeGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(it => it !== goal);
      } else {
        if (prev.length >= 2) {
          showToast("生活目标最多选择两项哦 🥗", "info");
          return prev;
        }
        return [...prev, goal];
      }
    });
  };

  const toggleEditAvoidItem = (item: string) => {
    setEditAvoidItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(it => it !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    // Update daily mood index (Sunday-Saturday)
    const updated = [...moodHistory];
    updated[6] = mood; // update today's index
    setMoodHistory(updated);
    showToast(`今天的心情为 ${mood}，已记录到心情日历`, "success");
  };

  const handleSignOut = () => {
    setUserProfile(null);
    setOnboardingStep(0);
    setOnboardingMode('register');
    setTempUsername("");
    setTempPassword("");
    setCurrentTab('home');
    showToast("已成功退出登录，期待下一次的回归 ✨", "info");
  };

  // Renders the onboarding questionnaire flow
  const renderOnboarding = () => {
    return (
      <div className="min-h-screen bg-[#F5F1EB] text-[#3D405B] py-10 px-4 flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl border border-[#F5F1EB]/80 p-6 space-y-6 animate-scale-up relative overflow-hidden">
          
          {/* Background decoration bubble */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#D4A373]/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#E07A5F]/10 rounded-full blur-2xl"></div>

          {/* Welcome Header */}
          <div className="text-center space-y-1.5 relative z-10 select-none">
            <span className="inline-block p-3 bg-[#D4A373]/10 text-3xl rounded-2xl animate-pulse">
              🧊
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#3D405B]">冰箱保卫战</h1>
            <p className="text-[11px] text-[#9A9B9C] font-mono uppercase tracking-widest font-semibold">Smart Fridge & Cozy Diet Butler</p>
          </div>

          {/* Step indicators */}
          {onboardingStep > 0 && (
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[10px] font-mono font-bold text-[#D4A373]">进度 {onboardingStep} / 3</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <span 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${onboardingStep === s ? "w-6 bg-[#D4A373]" : "w-1.5 bg-slate-200"}`}
                  ></span>
                ))}
              </div>
            </div>
          )}

          {/* PAGE 1: LOGIN/REGISTER TAB */}
          {onboardingStep === 0 && (
            <div className="space-y-5 relative z-10 animate-fade-in">
              <div className="flex bg-[#F5F1EB] p-1 rounded-2xl">
                <button
                  onClick={() => setOnboardingMode('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${onboardingMode === 'register' ? "bg-white text-[#3D405B] shadow-sm" : "text-[#9A9B9C] hover:text-[#3D405B]"}`}
                >
                  🥑 新成员入住 (注册)
                </button>
                <button
                  onClick={() => setOnboardingMode('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${onboardingMode === 'login' ? "bg-white text-[#3D405B] shadow-sm" : "text-[#9A9B9C] hover:text-[#3D405B]"}`}
                >
                  🔑 已有账号 (登录)
                </button>
              </div>

              {onboardingMode === 'register' ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs text-[#9A9B9C] font-sans">
                      独居生活，从好好保护冰箱、不浪费食材开始吧！
                    </p>
                    {/* Cute Avatar Select */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-[#9A9B9C] block mb-2 font-mono">选择您的保卫大厨头像</span>
                      <div className="flex justify-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                        {["🥑", "🍳", "🥩", "🥦", "🍕", "🥬", "🍓", "🥖", "🍩"].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setTempAvatar(emoji)}
                            className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-all cursor-pointer shrink-0 ${tempAvatar === emoji ? "bg-[#D4A373] text-white scale-110 shadow-sm" : "bg-[#F5F1EB]/50 hover:bg-[#F5F1EB]"}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 uppercase font-mono">设置保卫官昵称 (用户名)</label>
                      <input
                        type="text"
                        placeholder="请输入您的昵称"
                        value={tempUsername}
                        onChange={e => setTempUsername(e.target.value)}
                        className="w-full text-xs bg-[#F5F1EB] border-0 rounded-2xl px-4 py-3 text-[#3D405B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4A373]/85"
                        maxLength={14}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 uppercase font-mono">设置独立密码 (选填)</label>
                      <input
                        type="password"
                        placeholder="设置登录保护暗号"
                        value={tempPassword}
                        onChange={e => setTempPassword(e.target.value)}
                        className="w-full text-xs bg-[#F5F1EB] border-0 rounded-2xl px-4 py-3 text-[#3D405B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4A373]/85"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 uppercase font-mono">个性签名 / 每日心情口号</label>
                      <input
                        type="text"
                        placeholder="e.g. 认真减脂的独居选手"
                        value={tempSignature}
                        onChange={e => setTempSignature(e.target.value)}
                        className="w-full text-xs bg-[#F5F1EB] border-0 rounded-2xl px-4 py-3 text-[#3D405B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4A373]/85"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!tempUsername.trim()) {
                        showToast("请输入您的起步保卫官昵称 🥑", "error");
                        return;
                      }
                      setOnboardingStep(1);
                    }}
                    className="w-full py-3 bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer mt-2"
                  >
                    开始填写个性化定制 🧾
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#9A9B9C] text-center px-4">
                    输入您之前设置的昵称，快速恢复所有的设置及冰箱数据档案。
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 uppercase font-mono">保卫官用户名</label>
                      <input
                        type="text"
                        placeholder="之前注册的昵称"
                        value={tempUsername}
                        onChange={e => setTempUsername(e.target.value)}
                        className="w-full text-xs bg-[#F5F1EB] border-0 rounded-2xl px-4 py-3 text-[#3D405B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4A373]/85"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 uppercase font-mono">保护密码 (如有)</label>
                      <input
                        type="password"
                        placeholder="请输入登录密码（非必填）"
                        value={tempPassword}
                        onChange={e => setTempPassword(e.target.value)}
                        className="w-full text-xs bg-[#F5F1EB] border-0 rounded-2xl px-4 py-3 text-[#3D405B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4A373]/85"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    className="w-full py-3 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer mt-2"
                  >
                    一键登录档案 🏡
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: AGE GROUP - SCIENCE BASE */}
          {onboardingStep === 1 && (
            <div className="space-y-5 relative z-10 animate-fade-in">
              <div className="space-y-1 select-none">
                <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">1/3 周期学龄选型</span>
                <h2 className="text-base font-bold text-[#3D405B]">选择您所属的年龄段段</h2>
                <p className="text-[11px] text-[#9A9B9C] leading-relaxed">
                  科学指出：不同年龄段的胃肠吸收和物质代谢存在本质差异，我们将基于此进行高精度的膳食微调：
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { value: "18-24 岁 (朝气青年)", desc: "🥬 朝气蓬勃！代谢和吸收效率旺盛，更适合蛋白质补充、高纤维及不重样的网红烹调灵感。" },
                  { value: "25-34 岁 (职场白领)", desc: "🥕 熬夜和疲惫多！生活节奏快，更适配抗炎、养胃消食并强化护肝明目的膳食规划。" },
                  { value: "35-49 岁 (社会中坚)", desc: "🥦 预防代谢减缓。注重少油盐低脂搭配，更适配慢GI饱腹谷物与保护心血管能量配比。" },
                  { value: "50 岁以上 (健康乐活)", desc: "🍲 肌肉流失关照。胃动力平稳，更推荐高钙强抗氧化、营养高度浓缩并易于咀嚼消化的做法。" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setTempAgeGroup(item.value);
                      setOnboardingStep(2);
                    }}
                    className={`p-4 rounded-[20px] text-left transition-all border cursor-pointer select-none ${
                      tempAgeGroup === item.value 
                        ? "bg-[#D4A373] text-white border-[#D4A373] shadow" 
                        : "bg-[#F5F1EB]/50 text-[#3D405B] border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">{item.value}</span>
                      {tempAgeGroup === item.value && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className={`text-[10px] leading-relaxed select-none ${tempAgeGroup === item.value ? "text-orange-50" : "text-[#9A9B9C]"}`}>
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setOnboardingStep(0)}
                  className="flex-1 py-2.5 bg-[#F5F1EB] hover:bg-[#F5F1EB]/85 text-[#3D405B] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  上一步
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GENDER & LIVES COUNT */}
          {onboardingStep === 2 && (
            <div className="space-y-6 relative z-10 animate-fade-in">
              <div className="space-y-1 select-none">
                <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">2/3 居家背景</span>
                <h2 className="text-base font-bold text-[#3D405B]">您的性别与常住人口</h2>
                <p className="text-[11px] text-[#9A9B9C] leading-relaxed">
                  性别决定了能量的基础负荷，常住人口则用于判定每一顿备菜的分量算法。
                </p>
              </div>

              {/* Gender Radio Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9A9B9C] uppercase font-mono block">您的性别选择 (3选1)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["👨 男性", "👩 女性", "🔒 不透露"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setTempGender(g)}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        tempGender === g
                          ? "bg-[#D4A373] text-white border-[#D4A373] shadow"
                          : "bg-[#F5F1EB]/60 hover:bg-[#F0EBE3] text-[#3D405B] border-slate-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Household volume Radio Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9A9B9C] uppercase font-mono block">常住用餐人数 (影响单餐分量)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["1人", "2人", "3人+"].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setTempLivingCount(cnt)}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        tempLivingCount === cnt
                          ? "bg-[#D4A373] text-white border-[#D4A373] shadow"
                          : "bg-[#F5F1EB]/60 hover:bg-[#F0EBE3] text-[#3D405B] border-slate-100"
                      }`}
                    >
                      {cnt === "1人" ? "🏠 1人 独居" : cnt === "2人" ? "👩‍❤️‍👨 2人 幸福" : "👪 3人及以上"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="flex-1 py-2.5 bg-[#F5F1EB] text-[#3D405B] rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  上一步
                </button>
                <button
                  onClick={() => setOnboardingStep(3)}
                  className="flex-1 py-2.5 bg-[#D4A373] text-white rounded-xl text-xs font-bold hover:bg-[#D4A373]/95 shadow cursor-pointer"
                >
                  下一步 🥗
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: STATUS, GOALS & TABOOS */}
          {onboardingStep === 3 && (
            <div className="space-y-5 relative z-10 animate-fade-in">
              <div className="space-y-1 select-none">
                <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">3/3 身体契合与目标</span>
                <h2 className="text-base font-bold text-[#3D405B]">身体状态与忌口调查</h2>
                <p className="text-[11px] text-[#9A9B9C] leading-relaxed">
                  让我们来配置您本周的特殊时刻、生活追寻及极速忌口名单：
                </p>
              </div>

              {/* Body Status (Single select tags) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 font-mono uppercase block">🌱 当前身体状况 (单选)</label>
                <div className="flex flex-wrap gap-1.5">
                  {["🌿 无特殊", "🌡️ 肠胃敏感", "🤒 感冒恢复", "🔥 上火", "🌸 生理期", "⚠️ 过敏"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setTempBodyStatus(status)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        tempBodyStatus === status
                          ? "bg-[#D4A373] text-white shadow-sm"
                          : "bg-[#F0EBE3] hover:bg-[#F0EBE3]/90 text-[#3D405B]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life Goals (max 2) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 font-mono uppercase flex justify-between items-center">
                  <span>🥗 本周餐单目标 (多选，最多2个)</span>
                  <span className="text-[9px] font-normal text-amber-600 font-sans">{tempLifeGoals.length}/2 已选</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["🥗 减脂", "💪 增肌", "🍬 控糖", "⏰ 轻断食", "🌙 熬夜多", "📚 日常"].map((goal) => {
                    const isSelected = tempLifeGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => {
                          if (isSelected) {
                            setTempLifeGoals(prev => prev.filter(it => it !== goal));
                          } else {
                            if (tempLifeGoals.length >= 2) {
                              showToast("生活目标最多选2个哦~", "info");
                              return;
                            }
                            setTempLifeGoals(prev => [...prev, goal]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#D4A373] text-white shadow-sm"
                            : "bg-[#F0EBE3] hover:bg-[#F0EBE3]/90 text-[#3D405B]"
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Avoid Items list tags */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#9A9B9C] pl-1 font-mono uppercase block">🚫 快速忌口设定 (多选，符合即可选中)</label>
                <div className="flex flex-wrap gap-1.5">
                  {["不吃香菜", "不吃辣", "不吃内脏", "不吃海鲜", "无麸质", "不吃芹菜"].map((avoid) => {
                    const isSelected = tempAvoidItems.includes(avoid);
                    return (
                      <button
                        key={avoid}
                        onClick={() => {
                          if (isSelected) {
                            setTempAvoidItems(prev => prev.filter(it => it !== avoid));
                          } else {
                            setTempAvoidItems(prev => [...prev, avoid]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#D4A373] text-white shadow-sm"
                            : "bg-[#F0EBE3] hover:bg-[#F0EBE3]/90 text-[#3D405B]"
                        }`}
                      >
                        {avoid}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="flex-1 py-2.5 bg-[#F5F1EB] text-[#3D405B] rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  上一步
                </button>
                <button
                  onClick={handleOnboardingComplete}
                  className="flex-1 py-2.5 bg-[#E07A5F] text-white rounded-xl text-xs font-bold hover:bg-[#E07A5F]/95 shadow active:scale-98 cursor-pointer"
                >
                  完工！开启膳食 🍳
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  const activeDayPlan = mealPlan.find(plan => plan.dayName === selectedDay) || mealPlan[0];

  if (!userProfile?.isRegistered) {
    return renderOnboarding();
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB] text-[#3D405B] pb-24 font-sans selection:bg-[#E07A5F]/20 selection:text-[#E07A5F]">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-white rounded-3xl p-4 shadow-xl border-l-4 border-[#E07A5F] flex items-start gap-3 animate-bounce">
          <div className="p-1 rounded-full bg-orange-50">
            <Sparkle className="w-5 h-5 text-[#E07A5F]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3D405B]">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Top Beautiful Minimal Cafe Banner */}
      <header className="bg-white border-b border-[#F5F1EB] sticky top-0 z-40 px-4 py-3.5 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#D4A373]/10 text-[#D4A373] rounded-2xl flex items-center justify-center font-bold text-xl tracking-tight shadow-inner">
              ☕
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#3D405B] flex items-center gap-1.5">
                冰箱保卫战 <span className="text-[10px] bg-[#A8D5BA] text-emerald-900 px-1.5 py-0.5 rounded-full font-normal">冰箱管家</span>
              </h1>
              <p className="text-[10px] text-[#9A9B9C] font-medium tracking-wide">Warm Seoul Cozy Cafe Vibe</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2.5 bg-[#F5F1EB] text-[#3D405B] hover:bg-[#D4A373]/10 hover:text-[#D4A373] rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-1 text-[11px] font-bold"
            id="settings-btn"
          >
            <Settings className="w-4 h-4 text-[#D4A373]" />
            <span>饮食定制</span>
          </button>
        </div>
      </header>

      {/* Main Wrapper */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-6">

        {/* ==================== TAB 1: HOME ==================== */}
        {currentTab === 'home' && (
          <div className="space-y-6 animate-fade-in" id="home-tab-content">
            
            {/* Fridge stock summary card */}
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-[#F5F1EB]/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-[#3D405B] flex items-center gap-1.5">
                    <Refrigerator className="w-4 h-4 text-[#D4A373]" />
                    我的温暖冰箱
                  </h2>
                  <p className="text-[11px] text-[#9A9B9C]">
                    目前冰箱中存有 <span className="text-[#E07A5F] font-bold">{ingredients.filter(i => i.status !== 'used').length}</span> 种食材
                  </p>
                </div>
                <div className="flex gap-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[10px] font-bold text-emerald-800 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-[#A8D5BA] rounded-full"></span> 新鲜健康
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-[10px] font-bold text-rose-800 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-[#E07A5F] rounded-full animate-ping"></span> 临期预警
                  </span>
                </div>
              </div>
            </div>

            {/* Expiring Ingredients Highlight section */}
            {ingredients.filter(i => getDaysRemaining(i.expiryDate) <= 2 && i.status !== 'used').length > 0 && (
              <div className="bg-[#E07A5F]/10 rounded-[20px] p-4 border border-[#E07A5F]/20 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#E07A5F]" />
                  <h3 className="text-xs font-bold text-[#3D405B]">临近过期！大厨建议周初优先烹饪</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ingredients
                    .filter(i => getDaysRemaining(i.expiryDate) <= 2 && i.status !== 'used')
                    .map(item => {
                      const daysLeft = getDaysRemaining(item.expiryDate);
                      return (
                        <span 
                          key={item.id} 
                          className="bg-white px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#3D405B] shadow-sm flex items-center gap-1.5 border-l-4 border-[#E07A5F]"
                        >
                          <span className="w-2 h-2 bg-[#E07A5F] rounded-full"></span>
                          <span>{item.name}</span>
                          <span className="text-[9px] text-[#E07A5F] font-semibold bg-orange-50 px-1 py-0.5 rounded">
                            {daysLeft <= 0 ? "已到期" : `${daysLeft}天后过期`}
                          </span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Input form for ingredients - Warm, Brown-tinted Style */}
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-[#F5F1EB] space-y-4">
              <h3 className="text-xs font-bold text-[#3D405B] flex items-center gap-1">
                <span>🧺 新增单件食材录入</span>
              </h3>
              <form onSubmit={submitSingleIngredient} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9A9B9C] uppercase tracking-wider">食材名称*</label>
                    <input 
                      type="text"
                      required
                      placeholder="快写下采购的食材..."
                      value={foodInput}
                      onChange={e => setFoodInput(e.target.value)}
                      className="w-full text-xs bg-[#F5F1EB]/50 border border-[#D4A373]/20 rounded-xl px-3 py-2.5 text-[#3D405B] placeholder-[#9A9B9C] focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9A9B9C] uppercase tracking-wider">食材分量描述</label>
                    <input 
                      type="text"
                      placeholder="例如: 350g, 2个, 1把"
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      className="w-full text-xs bg-[#F5F1EB]/50 border border-[#D4A373]/20 rounded-xl px-3 py-2.5 text-[#3D405B] placeholder-[#9A9B9C] focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9A9B9C] uppercase tracking-wider">所属分类</label>
                    <select 
                      value={categoryInput}
                      onChange={e => setCategoryInput(e.target.value as IngredientCategory)}
                      className="w-full text-xs bg-[#F5F1EB]/30 border border-[#D4A373]/20 rounded-xl px-2 py-2.5 text-[#3D405B] focus:outline-none focus:border-[#D4A373] transition-colors font-medium"
                    >
                      {(['蔬菜', '肉类', '海鲜', '豆制品', '蛋奶', '主食', '调料'] as IngredientCategory[]).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9A9B9C] uppercase tracking-wider">保质期 (保质天数)*</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      max="365"
                      placeholder="可保存的天数"
                      value={expDaysInput}
                      onChange={e => setExpDaysInput(e.target.value)}
                      className="w-full text-xs bg-[#F5F1EB]/50 border border-[#D4A373]/20 rounded-xl px-3 py-2.5 text-[#3D405B] focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full mt-1 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  放进冰箱保存
                </button>
              </form>

              {/* Quick Add Tag Suggestions */}
              <div className="pt-3 border-t border-slate-50 space-y-2">
                <p className="text-[11px] font-bold text-[#9A9B9C]">👉 快捷录入推荐 (一键加冰箱):</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ADD_TAGS.map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => handleAddIngredient(tag.name, tag.category, tag.days, "适量")}
                      className="bg-[#F5F1EB]/80 hover:bg-[#D4A373]/10 hover:text-[#D4A373] px-2 py-1 text-[10px] font-medium text-[#3D405B] rounded-xl transition-all cursor-pointer"
                    >
                      +{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Batch entry option */}
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-[#F5F1EB] space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-[#3D405B] flex items-center gap-1.5">
                  📝 一次采购了多件？批量智能录入
                </h3>
                <p className="text-[9px] text-[#9A9B9C]">
                  在下方输入任意食材（用逗号或回车分割），AI将自动拆分并智能归纳冰箱分类
                </p>
              </div>
              <textarea
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                placeholder="猪里脊, 冰鲜黄花鱼, 鸡毛菜, 鲜香菇, 大蒜, 小番茄..."
                rows={2}
                className="w-full text-xs bg-[#F5F1EB]/50 border border-[#D4A373]/20 rounded-xl p-3 text-[#3D405B] placeholder-[#9A9B9C] focus:outline-none focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373]/20 transition-all font-medium"
              />
              <button
                onClick={submitBulkIngredients}
                className="w-full bg-[#D4A373]/20 hover:bg-[#D4A373]/35 text-[#D4A373] hover:text-[#3D405B] rounded-xl py-2 text-xs font-bold transition-all cursor-pointer font-sans"
              >
                🪄 批量放进冰箱
              </button>
            </div>

            {/* Fridge list search & segment filter */}
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#9A9B9C]">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="输入名字搜索冰箱..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs text-[#3D405B] bg-white rounded-xl pl-9 pr-3 py-2 border border-[#F5F1EB] focus:outline-none focus:border-[#D4A373] transition-colors"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1.5 p-1 text-[#9A9B9C] text-xs">清除</button>
                  )}
                </div>
              </div>

              {/* Ingredients Card Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {ingredients
                  .filter(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => {
                    const daysRemaining = getDaysRemaining(item.expiryDate);
                    // Determine if fresh or urgent based on design requirements:
                    // (sage=good, terracotta=urgent/overdue)
                    const isUrgent = daysRemaining <= 2;
                    const isUsed = item.status === 'used';
                    
                    return (
                      <div 
                        key={item.id}
                        className={`bg-white rounded-[20px] p-4 flex justify-between items-center transition-all ${
                          isUsed ? 'opacity-40 line-through' : 'shadow-md border border-[#F5F1EB] hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Freshness Dot Indicator */}
                          <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 relative ${
                            isUsed ? 'bg-slate-300' : isUrgent ? 'bg-[#E07A5F]' : 'bg-[#A8D5BA]'
                          }`} title={isUrgent ? '临期需优先烹饪' : '新鲜食材可用'}>
                            {!isUsed && isUrgent && (
                              <span className="absolute inset-0 rounded-full bg-[#E07A5F] opacity-75 animate-ping"></span>
                            )}
                          </span>

                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-[#3D405B] flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.amount && (
                                <span className="text-[10px] font-mono text-[#9A9B9C] font-semibold bg-[#F5F1EB] px-1.5 py-0.5 rounded-lg">
                                  {item.amount}
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#9A9B9C] font-medium font-sans">
                                类别: {item.category}
                              </span>
                              {!isUsed && item.expiryDate && (
                                <span className={`text-[10px] font-mono font-bold ${
                                  isUrgent ? 'text-[#E07A5F]' : 'text-[#87BC9B]'
                                }`}>
                                  · {daysRemaining <= 0 ? "已过期" : `在 ${daysRemaining} 天后过期`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Operations */}
                        <div className="flex items-center gap-1">
                          {!isUsed && (
                            <button
                              onClick={() => markAsUsed(item.id, item.name)}
                              className="px-2.5 py-1.5 bg-[#A8D5BA]/20 hover:bg-[#A8D5BA]/40 text-[#4E7D5F] rounded-xl text-[10px] font-bold tracking-wider transition-colors cursor-pointer"
                              title="标记用完"
                            >
                              ✓ 已用完
                            </button>
                          )}
                          <button
                            onClick={() => deleteIngredient(item.id, item.name)}
                            className="p-1 px-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100/80 rounded-xl transition-all cursor-pointer"
                            aria-label="清理食材"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {ingredients.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-[20px] p-6 text-slate-400 space-y-2 border border-dashed border-[#D4A373]/20">
                    <p className="text-sm">🍳 冰箱里空荡荡的，喝杯燕麦拿铁先~</p>
                    <p className="text-xs">点击上方按钮录入本周采购原料，开启膳食旅程吧</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MEAL PLAN ==================== */}
        {currentTab === 'plan' && (
          <div className="space-y-6 animate-fade-in" id="plan-tab-content">
            
            {/* Calendar Week Header with Brown Active States */}
            <div className="bg-white rounded-[20px] p-4 shadow-lg border border-[#F5F1EB] space-y-2">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-bold text-[#3D405B] flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-[#D4A373]" />
                  我的每周膳食规划日历
                </h3>
                <span className="text-[10px] font-bold text-[#D4A373] bg-[#D4A373]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {dietarySettings.cuisinePreference}偏好
                </span>
              </div>
              
              {/* Mon-Sun interactive bar */}
              <div className="grid grid-cols-7 gap-1 scrollbar-hidden">
                {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((dayName) => {
                  const isSelected = selectedDay === dayName;
                  return (
                    <button
                      key={dayName}
                      onClick={() => setSelectedDay(dayName)}
                      className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#D4A373] text-white shadow-md shadow-[#D4A373]/20" 
                          : "bg-[#F5F1EB]/70 hover:bg-[#D4A373]/10 text-[#3D405B]"
                      }`}
                    >
                      <p>{dayName}</p>
                      <p className="text-[9px] opacity-75">{getStapleIcon(dietarySettings.stapleCalendar[dayName])}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart planning dispatch trigger */}
            <div className="bg-[#D4A373]/10 rounded-[20px] p-5 shadow-sm border border-[#D4A373]/20 text-center space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#3D405B] flex items-center justify-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-[#D4A373]" />
                  根据当前冰箱食材重新一键智能排餐
                </h4>
                <p className="text-[10px] text-[#9A9B9C] leading-snug">
                  排餐优先考虑临期食材，匹配不重样的高品质荤素均衡食谱
                </p>
              </div>

              <button
                disabled={isPlanGenerating}
                onClick={handleGenerateAIPlan}
                className="w-full bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white rounded-xl py-3 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isPlanGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>大厨正在构思本周食谱中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>重新生成本周膳食计划</span>
                  </>
                )}
              </button>
            </div>

            {/* Meal detail rendering (3 standard meals per day) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-[#3D405B] flex items-center gap-1.5">
                  🍱 {selectedDay} 餐饮组合已就绪
                </span>
                <span className="text-[10px] font-mono text-[#D4A373] font-bold">
                  主食搭配: {activeDayPlan?.staple || dietarySettings.stapleCalendar[selectedDay]} {getStapleIcon(activeDayPlan?.staple || dietarySettings.stapleCalendar[selectedDay])}
                </span>
              </div>

              {/* BREAKFAST */}
              <div 
                onClick={() => fetchRecipeDetails(activeDayPlan?.breakfast?.dishName || "营养燕麦粥", activeDayPlan?.breakfast?.availableIngredients || [])}
                className="bg-white hover:scale-[1.01] rounded-[20px] p-4 shadow-md border border-[#F5F1EB] cursor-pointer transition-all space-y-2 group"
                id="breakfast-card"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 bg-[#A8D5BA]/30 text-emerald-800 rounded-lg font-bold">
                      ☀️ 早餐
                    </span>
                    <span className="text-[10px] text-[#9A9B9C] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" /> {activeDayPlan?.breakfast?.timeMinutes || 10}分钟
                    </span>
                  </div>
                  <span className="text-xs text-[#D4A373] font-bold group-hover:underline flex items-center gap-0.5">
                    查看做法 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#3D405B]">{activeDayPlan?.breakfast?.dishName || "暖心活力燕麦粥"}</h4>
                <p className="text-[10px] text-[#9A9B9C] font-mono">{activeDayPlan?.breakfast?.type || "快手营养能量餐"}</p>
                <div className="pt-2 border-t border-slate-50 flex gap-1 flex-wrap">
                  {activeDayPlan?.breakfast?.availableIngredients?.map(ki => (
                    <span key={ki} className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                      冰箱已有: {ki}
                    </span>
                  ))}
                  {activeDayPlan?.breakfast?.missingIngredients?.map(mi => (
                    <span key={mi} className="text-[9px] bg-rose-50 text-[#E07A5F] px-1.5 py-0.5 rounded-md font-medium">
                      补/调味: {mi}
                    </span>
                  ))}
                </div>
              </div>

              {/* LUNCH */}
              <div 
                onClick={() => fetchRecipeDetails(activeDayPlan?.lunch?.dishName || "经典午餐搭配", activeDayPlan?.lunch?.availableIngredients || [])}
                className="bg-white hover:scale-[1.01] rounded-[20px] p-4 shadow-md border border-[#F5F1EB] cursor-pointer transition-all space-y-2 group"
                id="lunch-card"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 bg-amber-100/50 text-amber-800 rounded-lg font-bold">
                      🌤️ 正餐 / 午餐
                    </span>
                    <span className="text-[10px] text-[#9A9B9C] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" /> {activeDayPlan?.lunch?.timeMinutes || 20}分钟
                    </span>
                  </div>
                  <span className="text-xs text-[#D4A373] font-bold group-hover:underline flex items-center gap-0.5">
                    查看做法 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#3D405B]">{activeDayPlan?.lunch?.dishName || "鲜美一荤一素营养午餐"}</h4>
                <p className="text-[10px] text-[#9A9B9C] font-mono">{activeDayPlan?.lunch?.type || "高蛋白+充足纤维膳食平衡"}</p>
                <div className="pt-2 border-t border-slate-50 flex gap-1 flex-wrap">
                  {activeDayPlan?.lunch?.availableIngredients?.map(ki => (
                    <span key={ki} className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                      冰箱已有: {ki}
                    </span>
                  ))}
                  {activeDayPlan?.lunch?.missingIngredients?.map(mi => (
                    <span key={mi} className="text-[9px] bg-rose-50 text-[#E07A5F] px-1.5 py-0.5 rounded-md font-medium">
                      补/调味: {mi}
                    </span>
                  ))}
                </div>
              </div>

              {/* DINNER */}
              <div 
                onClick={() => fetchRecipeDetails(activeDayPlan?.dinner?.dishName || "轻负担晚餐", activeDayPlan?.dinner?.availableIngredients || [])}
                className="bg-white hover:scale-[1.01] rounded-[20px] p-4 shadow-md border border-[#F5F1EB] cursor-pointer transition-all space-y-2 group"
                id="dinner-card"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 bg-orange-100/45 text-orange-900 rounded-lg font-bold">
                      🌙 晚餐
                    </span>
                    <span className="text-[10px] text-[#9A9B9C] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" /> {activeDayPlan?.dinner?.timeMinutes || 30}分钟
                    </span>
                  </div>
                  <span className="text-xs text-[#D4A373] font-bold group-hover:underline flex items-center gap-0.5">
                    查看做法 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#3D405B]">{activeDayPlan?.dinner?.dishName || "红烧肉炖老豆腐"}</h4>
                <p className="text-[10px] text-[#9A9B9C] font-mono">{activeDayPlan?.dinner?.type || "温润暖胃·完美消耗临期海肉"}</p>
                <div className="pt-2 border-t border-slate-50 flex gap-1 flex-wrap">
                  {activeDayPlan?.dinner?.availableIngredients?.map(ki => (
                    <span key={ki} className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                      冰箱已有: {ki}
                    </span>
                  ))}
                  {activeDayPlan?.dinner?.missingIngredients?.map(mi => (
                    <span key={mi} className="text-[9px] bg-rose-50 text-[#E07A5F] px-1.5 py-0.5 rounded-md font-medium">
                      补/调味: {mi}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: CREATIVE SHAKE ==================== */}
        {currentTab === 'creative' && (
          <div className="space-y-6 animate-fade-in" id="creative-tab-content">
            
            {/* Tag Selection Filter */}
            <div className="bg-white rounded-[20px] p-5 shadow-lg border border-[#F5F1EB] space-y-3">
              <div className="space-y-1">
                <h2 className="text-xs font-bold text-[#3D405B] flex items-center gap-2">
                  <span>📱 摇一摇创意心情标签选择</span>
                </h2>
                <p className="text-[9px] text-[#9A9B9C]">
                  在摇动手机或点击前，选择您当前最渴望的特定口感偏好吧
                </p>
              </div>

              <div className="grid grid-cols-5 gap-1.5 pt-2">
                {(['快手菜', '重口味', '清淡', '异国风情', '清空冰箱'] as ShakeTag[]).map((tagOption) => {
                  const isSelected = shakeTag === tagOption;
                  return (
                    <button
                      key={tagOption}
                      onClick={() => setShakeTag(tagOption)}
                      className={`py-2 px-1 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#D4A373] text-white shadow"
                          : "bg-[#F5F1EB]/80 hover:bg-[#D4A373]/10 text-[#3D405B]"
                      }`}
                    >
                      {tagOption === '快手菜' && "⚡"}
                      {tagOption === '重口味' && "🌶️"}
                      {tagOption === '清淡' && "🥗"}
                      {tagOption === '异国风情' && "✈️"}
                      {tagOption === '清空冰箱' && "📦"}
                      <div className="mt-0.5">{tagOption}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shake Interactive Pulse Area */}
            <div className="bg-white rounded-[20px] p-8 shadow-xl border border-[#F5F1EB]/80 text-center flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <ChefHat className="w-24 h-24 text-[#D4A373]" />
              </div>
              
              <div className="space-y-1 z-10">
                <h3 className="text-base font-bold text-[#3D405B] tracking-tight">冰箱空清 · 灵感转盘</h3>
                <p className="text-[11px] text-[#9A9B9C] max-w-[260px] mx-auto leading-relaxed">
                  随机抽取 1 道专治不吃啥的创意惊艳菜式，完美融合大厨精心测定的冰箱素材。
                </p>
              </div>

              {/* Shaking visual target container with Terracotta Pulse */}
              <div className="relative py-4 flex justify-center items-center">
                
                {/* Visual pulse circles */}
                <div className={`absolute w-36 h-36 rounded-full bg-[#E07A5F]/10 border border-[#E07A5F]/20 animate-ping duration-[3000ms] ${
                  isShaking ? 'scale-125' : ''
                }`}></div>
                <div className="absolute w-28 h-28 rounded-full bg-[#E07A5F]/10"></div>
                
                {/* Kitchen appliance phone avatar visual shake target */}
                <div className={`w-20 h-20 bg-[#E07A5F] text-white rounded-full flex items-center justify-center shadow-lg relative cursor-pointer active:scale-95 transition-all select-none ${
                  isShaking ? "shake-animation" : ""
                }`} onClick={triggerShake}>
                  <p className="text-3xl">🍲</p>
                </div>
              </div>

              <div className="w-full max-w-[240px] space-y-2 z-10">
                <button
                  onClick={triggerShake}
                  disabled={isShaking || isShakeLoading}
                  className="w-full bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md"
                >
                  {isShaking ? (
                    <span>等一下，正在碰撞美味灵感中...</span>
                  ) : (
                    <>
                      <span>🍳 摇一摇创意匹配</span>
                    </>
                  )}
                </button>
                <p className="text-[9px] text-[#9A9B9C] italic">提示: 手机端可直接摇晃(或点击上方温润红心摇奖)</p>
              </div>
            </div>

            {/* Shake Loading */}
            {isShakeLoading && (
              <div className="bg-white rounded-[20px] p-10 shadow-lg text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#D4A373]/10 border-t-[#E07A5F] rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-[#9A9B9C] font-mono animate-pulse-slow">
                  大厨正在根据您的冰箱与 [{shakeTag}] 匹配创意单品中...
                </p>
              </div>
            )}

            {/* Shaked Result card featuring Warm Food Overlay styling */}
            {shakeResult && !isShakeLoading && (
              <div className="bg-white rounded-[20px] overflow-hidden shadow-xl border border-[#F5F1EB] space-y-4 animate-scale-up" id="shake-result-card">
                
                {/* Simulated warmth ambient header overlay */}
                <div className="p-6 text-[#3D405B] space-y-2 relative" style={{ background: "linear-gradient(135deg, rgba(212,163,115,0.12) 0%, rgba(245,241,235,0.7) 100%)" }}>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E07A5F] bg-[#E07A5F]/15 px-2.5 py-1 rounded-lg">
                      ✨ 摇中今日最佳: {shakeTag}
                    </span>
                    <span className="text-[9px] text-[#9A9B9C] font-mono">{shakeResult.timeMinutes}分钟烹制</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#3D405B]">{shakeResult.name}</h4>
                  <p className="text-[11px] text-[#3D405B]/85 italic line-clamp-2 leading-relaxed">
                    “ {shakeResult.intro || "这道极富新式美感的高分菜完美适配您的食材存储。"} ”
                  </p>
                </div>

                <div className="p-5 pt-0 space-y-4">
                  {/* Ingredients needed */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-[#9A9B9C]">🔍 原作匹配程度:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {shakeResult.ingredients?.map((item, id) => (
                        <span 
                          key={id} 
                          className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                            item.inStock 
                              ? "bg-[#A8D5BA]/20 text-[#3D405B]" 
                              : "bg-orange-50 text-[#E07A5F]"
                          }`}
                        >
                          {item.inStock ? "✓" : "+"} {item.name} ({item.amount})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tiny instruction snapshot */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-[#9A9B9C]">👩‍🍳 烹饪指引快照 (Steps):</p>
                    <div className="space-y-2">
                      {shakeResult.steps?.slice(0, 3).map((st, i) => (
                        <div key={i} className="flex gap-2 items-start text-[11px] text-[#3D405B] bg-[#F5F1EB]/40 p-2 rounded-xl">
                          <span className="w-4 h-4 rounded-full bg-[#D4A373] text-white flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 shrink-0">
                            {i+1}
                          </span>
                          <span className="line-clamp-2 bg-transparent text-[#3D405B] font-medium leading-normal">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fully display button */}
                  <button
                    onClick={() => setSelectedRecipe(shakeResult)}
                    className="w-full bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    💡 获取完整大图食材比例与烹制品尝
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: PROFILE ==================== */}
        {currentTab === 'profile' && userProfile && (
          <div className="space-y-6 animate-fade-in" id="profile-tab-content">
            
            {/* Header info card */}
            <div className="bg-white rounded-[24px] p-5 shadow-lg border border-[#F5F1EB]/80 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A373]/5 rounded-full -mr-6 -mt-6"></div>
              
              <button 
                onClick={handleOpenEditProfile}
                className="w-16 h-16 rounded-full bg-[#D4A373]/10 text-3xl flex items-center justify-center shrink-0 border-2 border-white shadow hover:scale-105 transition-all cursor-pointer relative group"
                title="更换头像/资料"
              >
                <span>{userProfile.avatarUrl || "🥦"}</span>
                <span className="absolute bottom-0 right-0 bg-[#D4A373] text-white p-1 rounded-full text-[8px] flex items-center justify-center">
                  <Pencil className="w-2.5 h-2.5" />
                </span>
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 mt-0.5">
                  <h2 className="text-base font-bold text-[#3D405B]">{userProfile.username}</h2>
                  <button 
                    onClick={handleOpenEditProfile} 
                    className="text-[#9A9B9C] hover:text-[#D4A373] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-xs text-[#9A9B9C] font-semibold leading-relaxed">
                  “ {userProfile.signature || "独处时，好好吃饭。"} ”
                </p>

                <div className="pt-1 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#EAB308]/10 text-[#854D0E] text-[10px] font-bold">
                    🛡️ 黄金保卫官
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">
                    🥦 {userProfile.dietPersonality || "蛋白质狂魔"}
                  </span>
                </div>
              </div>
            </div>

            {/* Fun Stats Area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A9B9C] font-mono">📊 趣味保卫数据</span>
                <button
                  onClick={() => {
                    const nextZero = !profileStatsZero;
                    setProfileStatsZero(nextZero);
                    showToast(nextZero ? "已模拟 0 数据状态 (新用户鼓励文案已触发) 🥣" : "已恢复至保卫官满级数据 🛡️", "info");
                  }}
                  className="text-[10px] text-[#D4A373] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  🧪 {profileStatsZero ? "切换真实数据" : "查看零数据鼓励"}
                </button>
              </div>

              {profileStatsZero ? (
                <div className="bg-white rounded-[24px] p-6 border border-[#F5F1EB] text-center space-y-3.5 shadow-md flex flex-col items-center justify-center min-h-[140px] animate-fade-in">
                  <p className="text-2xl animate-bounce-slow">🥣</p>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#3D405B]">开始记录你的第一顿吧～</p>
                    <p className="text-[10px] text-[#9A9B9C] max-w-[220px] mx-auto leading-relaxed">
                      录入食材保质期，一键开启膳食推荐。我们将自动帮您盘查剩余食材、统计每日膳食与成就。
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('home')}
                    className="px-5 py-2.5 bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all cursor-pointer"
                  >
                    立即去冰箱录入食材 🥕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Swipeable container */}
                  <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 snap-x scroll-smooth scrollbar-none">
                    
                    <div className="snap-center bg-white rounded-2xl p-3.5 min-w-[140px] w-[140px] h-[100px] border border-slate-50 shadow-md hover:scale-95 active:scale-95 transition-all text-left shrink-0 select-none flex flex-col justify-between">
                      <span className="text-[10px] font-medium text-[#9A9B9C] font-sans">🛡️ 保卫冰箱守护</span>
                      <p className="text-3xl font-extrabold text-[#D4A373] font-mono leading-none py-1">42</p>
                      <span className="text-[10px] font-bold text-[#3D405B]">天保卫记录</span>
                    </div>

                    <div className="snap-center bg-white rounded-2xl p-3.5 min-w-[140px] w-[140px] h-[100px] border border-slate-50 shadow-md hover:scale-95 active:scale-95 transition-all text-left shrink-0 select-none flex flex-col justify-between">
                      <span className="text-[10px] font-medium text-[#9A9B9C] font-sans">🔥 消灭濒危食材</span>
                      <p className="text-3xl font-extrabold text-[#7EC8A3] font-mono leading-none py-1">38</p>
                      <span className="text-[10px] font-bold text-[#3D405B]">个食材被抢救</span>
                    </div>

                    <div className="snap-center bg-white rounded-2xl p-3.5 min-w-[140px] w-[140px] h-[100px] border border-slate-50 shadow-md hover:scale-95 active:scale-95 transition-all text-left shrink-0 select-none flex flex-col justify-between">
                      <span className="text-[10px] font-medium text-[#9A9B9C] font-sans">💰 省下浪费预算</span>
                      <p className="text-2xl font-extrabold text-[#E07A5F] font-mono leading-none py-1">￥267</p>
                      <span className="text-[10px] font-bold text-[#3D405B]">元家庭开支</span>
                    </div>

                    <div className="snap-center bg-white rounded-2xl p-3.5 min-w-[140px] w-[140px] h-[100px] border border-slate-50 shadow-md hover:scale-95 active:scale-95 transition-all text-left shrink-0 select-none flex flex-col justify-between">
                      <span className="text-[10px] font-medium text-[#9A9B9C] font-sans">🍳 连续开火率</span>
                      <p className="text-3xl font-extrabold text-[#D4A373] font-mono leading-none py-1">7</p>
                      <span className="text-[10px] font-bold text-[#3D405B]">天开火 (最高12)</span>
                    </div>

                  </div>
                  {/* Small Pagination circles for swipeable indicator */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    <span className="w-2.5 h-1 rounded-full bg-[#D4A373]"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Diet Stats Zone */}
            <div className="bg-white rounded-[24px] p-5 shadow-lg border border-[#F5F1EB]/80 space-y-4">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">WEEKLY SUMMARY</span>
                <h3 className="text-sm font-bold text-[#3D405B] flex items-center justify-between">
                  <span>📊 本周饮食档案</span>
                  <span className="text-[10px] text-[#9A9B9C] font-mono font-medium">06.01 - 06.07（本页）</span>
                </h3>
              </div>

              {/* Flex row with Stats card & Radar SVG */}
              <div className="grid grid-cols-5 gap-3 pt-1">
                
                {/* Left Side: Favour Card */}
                <div className="col-span-2 bg-[#F5F1EB]/55 p-3.5 rounded-2xl flex flex-col justify-between text-left min-h-[110px]">
                  <span className="text-[10px] font-bold text-[#9A9B9C]">🍳 本周最爱食材</span>
                  <div className="py-1">
                    <p className="text-[12px] font-extrabold text-[#3D405B] leading-tight">鸡蛋 × 6 次</p>
                    <p className="text-[11px] text-[#9A9B9C] pt-0.5 font-sans leading-tight">西红柿 × 4 次也紧随其后</p>
                  </div>
                  <span className="text-[8px] bg-[#A8D5BA]/30 text-emerald-800 px-1.5 py-0.5 rounded-full inline-block font-bold">高蛋白高纤维搭</span>
                </div>

                {/* Right Side: Radar graph polygon SVG */}
                <div className="col-span-3 flex justify-center items-center bg-[#FDFBF7] rounded-2xl p-1.5 border border-slate-50">
                  <svg className="w-[100px] h-[100px]" viewBox="0 0 100 100">
                    {/* Five concentric pentagons */}
                    {[0.2, 0.4, 0.6, 0.8, 1].map((r, idx) => {
                      const points = [0, 1, 2, 3, 4].map(idx5 => {
                        const angle = -Math.PI / 2 + (idx5 * 2 * Math.PI) / 5;
                        const px = 50 + 34 * r * Math.cos(angle);
                        const py = 50 + 34 * r * Math.sin(angle);
                        return `${px},${py}`;
                      }).join(' ');
                      return <polygon key={idx} points={points} fill="none" stroke="#E2E8F0" strokeWidth="0.5" />;
                    })}
                    {/* 5 axis lines */}
                    {[0, 1, 2, 3, 4].map(idx5 => {
                      const angle = -Math.PI / 2 + (idx5 * 2 * Math.PI) / 5;
                      return <line key={idx5} x1="50" y1="50" x2={50 + 34 * Math.cos(angle)} y2={50 + 34 * Math.sin(angle)} stroke="#E2E8F0" strokeWidth="0.5" />;
                    })}
                    {/* Actual filled data polygon */}
                    {(() => {
                      const values = [0.85, 0.65, 0.75, 0.50, 0.80];
                      const points = [0, 1, 2, 3, 4].map(idx5 => {
                        const angle = -Math.PI / 2 + (idx5 * 2 * Math.PI) / 5;
                        const px = 50 + 34 * values[idx5] * Math.cos(angle);
                        const py = 50 + 34 * values[idx5] * Math.sin(angle);
                        return `${px},${py}`;
                      }).join(' ');
                      return (
                        <>
                          <polygon points={points} fill="#A8D5BA" fillOpacity="0.22" stroke="#A8D5BA" strokeWidth="1.5" strokeLinejoin="round" />
                          {[0, 1, 2, 3, 4].map(idx5 => {
                            const angle = -Math.PI / 2 + (idx5 * 2 * Math.PI) / 5;
                            const px = 50 + 34 * values[idx5] * Math.cos(angle);
                            const py = 50 + 34 * values[idx5] * Math.sin(angle);
                            return <circle key={idx5} cx={px} cy={py} r="1.8" fill="#A8D5BA" stroke="white" strokeWidth="0.5" />;
                          })}
                        </>
                      );
                    })()}
                    {/* Labels around radar axes */}
                    <text x="50" y="11" textAnchor="middle" fontSize="6px" fontWeight="black" fill="#3D405B" className="font-sans">蛋白质</text>
                    <text x="82" y="32" textAnchor="start" fontSize="6px" fontWeight="black" fill="#3D405B" className="font-sans">碳水</text>
                    <text x="73" y="77" textAnchor="start" fontSize="6px" fontWeight="black" fill="#3D405B" className="font-sans">脂肪</text>
                    <text x="24" y="77" textAnchor="end" fontSize="6px" fontWeight="black" fill="#3D405B" className="font-sans">维他命</text>
                    <text x="15" y="32" textAnchor="end" fontSize="6px" fontWeight="black" fill="#3D405B" className="font-sans">膳食纤维</text>
                  </svg>
                </div>
              </div>

              {/* Two Column small card info details */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Left: Cuisine distribution style bar */}
                <div className="bg-[#FDFBF7] border border-slate-100 rounded-2xl p-3.5 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-[#3D405B] block">🍚 本周菜系分布</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-[#3D405B] font-mono">
                      <span>中餐比例 (家常)</span>
                      <span className="font-bold">70%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#D4A373]" style={{ width: "70%" }}></div>
                      <div className="h-full bg-[#A8D5BA]" style={{ width: "20%" }}></div>
                      <div className="h-full bg-[#E9D8A6]" style={{ width: "10%" }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-[#9A9B9C] pt-0.5">
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A373] block"></span>中餐 70%
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A8D5BA] block"></span>西餐 20%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Fridge Health rate ring circular gauge */}
                <div className="bg-[#FDFBF7] border border-slate-100 rounded-2xl p-3.5 flex items-center justify-between gap-2 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#3D405B] block">🧊 冰箱健康度</span>
                    <p className="text-[8px] text-[#9A9B9C] leading-tight">
                      完成率 85%。消耗表现领先 92% 保卫官！
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center relative">
                    <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#F1F5F9" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#A8D5BA" strokeWidth="3.5" strokeDasharray="85 100" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[8px] font-mono font-black text-[#3D405B]">85%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood record box */}
            <div className="bg-white rounded-[24px] p-5 shadow-lg border border-[#F5F1EB]/80 space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-[#D4A373] font-bold">MOOD</span>
                  <h3 className="text-sm font-bold text-[#3D405B]">今天吃得开心吗？</h3>
                </div>
                <button
                  onClick={() => setShowMoodCalendar(!showMoodCalendar)}
                  className="text-[10px] text-[#E07A5F] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  📅 {showMoodCalendar ? "隐藏看板" : "心情日历"}
                </button>
              </div>

              {showMoodCalendar && (
                <div className="bg-[#FDFBF7] rounded-2xl p-3 border border-slate-100 animate-scale-up space-y-2 text-left">
                  <p className="text-[10px] font-bold text-[#3D405B] flex justify-between">
                    <span>📅 本周情绪拼图 (7日历看板)</span>
                    <span className="text-[#9A9B9C] font-normal leading-none text-[8px]">点击圆格即可自由修补</span>
                  </p>
                  <div className="grid grid-cols-7 gap-1">
                    {["日", "一", "二", "三", "四", "五", "六"].map((dayName, idx) => {
                      const dayMood = moodHistory[idx] || "😋";
                      return (
                        <div 
                          key={dayName} 
                          onClick={() => {
                            const availableMoods = ["😋", "😌", "😐", "😫", "🥡"];
                            const currIdx = availableMoods.indexOf(dayMood);
                            const nextEmoji = availableMoods[(currIdx + 1) % availableMoods.length];
                            const updated = [...moodHistory];
                            updated[idx] = nextEmoji;
                            setMoodHistory(updated);
                            showToast(`已更换 周${dayName} 的心情为 ${nextEmoji} 🌟`, "success");
                          }}
                          className="bg-white py-1.5 px-1 border border-slate-100 rounded-xl hover:bg-[#F5F1EB]/30 cursor-pointer active:scale-95 transition-all text-center select-none"
                        >
                          <span className="text-[8px] font-black text-[#9A9B9C] block mb-0.5">{dayName}</span>
                          <span className="text-base block">{dayMood}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5 Emojis list */}
              <div className="flex justify-between items-center py-1 bg-[#FDFBF7] rounded-2xl p-2 border border-slate-50">
                {["😋", "😌", "😐", "😫", "🥡"].map((mood) => {
                  const isSelected = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodSelect(mood)}
                      className={`w-11 h-11 flex items-center justify-center text-2xl rounded-full transition-all cursor-pointer ${
                        isSelected 
                          ? "scale-115 border-[3px] border-[#D4A373] bg-[#D4A373]/10 shadow-sm" 
                          : "opacity-45 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#FAF8F5] p-2.5 rounded-xl text-center border border-dashed border-[#D4A373]/20">
                <p className="text-[10px] text-[#3D405B] font-semibold leading-relaxed">
                  🍨 本周心情指标：<span className="text-[#E07A5F] font-bold">83% 满足</span>。即使工作再忙，也要记得好好开火宠溺自我。
                </p>
              </div>
            </div>

            {/* Creative Functions Grid (2x2 Layout) */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A9B9C] font-mono px-1">🧪 冰箱保卫研究所</span>
              
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* 1. 美食手账 */}
                <button
                  onClick={() => setActiveOverlay('handbook')}
                  className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 hover:scale-95 active:scale-95 transition-all cursor-pointer text-center space-y-1.5 group flex flex-col items-center justify-center min-h-[90px]"
                >
                  <span className="text-3xl block group-hover:scale-110 duration-200">🍱</span>
                  <span className="text-xs font-bold text-[#3D405B]">美食手账</span>
                  <span className="text-[9px] text-[#9A9B9C]">生成本周计划长图</span>
                </button>

                {/* 2. 冰箱成就 */}
                <button
                  onClick={() => setActiveOverlay('badges')}
                  className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 hover:scale-95 active:scale-95 transition-all cursor-pointer text-center space-y-1.5 group flex flex-col items-center justify-center min-h-[90px]"
                >
                  <span className="text-3xl block group-hover:rotate-6 duration-250">🏅</span>
                  <span className="text-xs font-bold text-[#3D405B]">冰箱成就</span>
                  <span className="text-[9px] text-[#9A9B9C]">查看获得勋章荣誉墙</span>
                </button>

                {/* 3. 饮食人格 */}
                <button
                  onClick={() => setActiveOverlay('personality')}
                  className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 hover:scale-95 active:scale-95 transition-all cursor-pointer text-center space-y-1.5 group flex flex-col items-center justify-center min-h-[90px]"
                >
                  <span className="text-3xl block group-hover:scale-105 duration-200">🧬</span>
                  <span className="text-xs font-bold text-[#3D405B]">饮食人格</span>
                  <span className="text-[9px] text-[#9A9B9C]">DNA编码体质评测</span>
                </button>

                {/* 4. 饮食月报 */}
                <button
                  onClick={() => setActiveOverlay('report')}
                  className="bg-white p-4 rounded-2xl shadow-md border border-slate-50 hover:scale-95 active:scale-95 transition-all cursor-pointer text-center space-y-1.5 group flex flex-col items-center justify-center min-h-[90px]"
                >
                  <span className="text-3xl block group-hover:animate-pulse">📊</span>
                  <span className="text-xs font-bold text-[#3D405B]">饮食月报</span>
                  <span className="text-[9px] text-[#9A9B9C]">Wrap 战报分析大片</span>
                </button>

              </div>
            </div>

            {/* Bottom logout area */}
            <div className="bg-[#F5F1EB]/50 rounded-[24px] p-4 text-center border border-slate-100 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="text-xs text-[#3D405B] font-bold hover:text-[#D4A373] flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#D4A373]" />
                  <span>偏好定制</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-[#E07A5F] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>注销登录/换号</span>
                </button>
              </div>
              <p className="text-[9px] text-[#9A9B9C] italic">
                冰箱保卫战 v1.4.2 · 认真对待每一个食材，不浪费每次开火 ☕
              </p>
            </div>

          </div>
        )}
      </main>

      {/* Settings Options Popup Dialog (主食日历与忌口忌讳) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="settings-dialog-overlay">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up border border-[#F5F1EB] flex flex-col max-h-[85vh]">
            <div className="bg-[#D4A373] p-5 text-white flex justify-between items-center shrink-0">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-bold tracking-tight">☕ 个人膳食客制中心</h3>
                <p className="text-[10px] text-orange-50">定制您个人的主食日历与饮食偏好避让</p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer"
                id="close-settings-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Avoid taboos */}
              <div className="space-y-2 text-left">
                <h4 className="text-xs font-bold text-[#3D405B]">🚫 忌口或禁忌避让 (例如: 香菜、不吃辣)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入不喜欢的材料, 比如: 蒜苔, 洋葱"
                    value={newAvoidItem}
                    onChange={e => setNewAvoidItem(e.target.value)}
                    className="flex-1 text-xs bg-[#F5F1EB]/50 border border-[#D4A373]/20 rounded-xl px-3 py-2 text-[#3D405B] focus:outline-none focus:border-[#D4A373]"
                  />
                  <button
                    onClick={addAvoidItem}
                    className="px-3 bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    添加
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dietarySettings.avoidIngredients.length > 0 ? (
                    dietarySettings.avoidIngredients.map((item) => (
                      <span 
                        key={item} 
                        className="bg-rose-50 text-[#E07A5F] px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-100"
                      >
                        <span>{item}</span>
                        <button onClick={() => removeAvoidItem(item)} className="hover:text-rose-900 text-[9px] font-bold">×</button>
                      </span>
                    ))
                  ) : (
                    <p className="text-[10px] text-[#9A9B9C] italic">无特定忌口。排餐将默认匹配通用香辛配料。</p>
                  )}
                </div>
              </div>

              {/* Cuisine Preferences */}
              <div className="space-y-2 pt-2 border-t border-slate-50 text-left">
                <h4 className="text-xs font-bold text-[#3D405B]">🎨 偏好菜系倾向权重</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(["中餐", "西餐", "混合"] as const).map(pref => (
                    <button
                      key={pref}
                      onClick={() => setDietarySettings(p => ({ ...p, cuisinePreference: pref }))}
                      className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        dietarySettings.cuisinePreference === pref
                          ? "bg-[#D4A373] text-white shadow"
                          : "bg-[#F5F1EB]/80 text-[#3D405B]"
                      }`}
                    >
                      {pref === "混合" ? "☕ 混合" : pref === "中餐" ? "🍚 中式家常" : "🍝 西餐轻食"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staple Calendar Rotation settings */}
              <div className="space-y-2 pt-2 border-t border-slate-50 text-left">
                <h4 className="text-xs font-bold text-[#3D405B] flex items-center justify-between">
                  <span>📅 主食日历设定 (Staple Calendar)</span>
                  <span className="text-[9px] font-normal text-[#9A9B9C]">点击周几切换配比主食</span>
                </h4>
                
                <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => (
                    <div key={day} className="flex items-center justify-between gap-2 bg-[#F5F1EB]/40 p-2 rounded-xl text-xs">
                      <span className="font-bold text-[#3D405B] shrink-0 font-sans">{day}</span>
                      <select
                        value={dietarySettings.stapleCalendar[day] || "米饭"}
                        onChange={e => updateStaple(day, e.target.value)}
                        className="text-xs bg-white border border-[#D4A373]/20 text-[#3D405B] rounded-lg p-1.5 focus:outline-none select-none font-medium text-right font-sans"
                      >
                        <option value="米饭">🍚 米饭</option>
                        <option value="面条">🍜 面条</option>
                        <option value="红薯">🍠 红薯</option>
                        <option value="杂粮饭">🥣 杂粮饭</option>
                        <option value="燕麦粥">🥣 燕麦粥</option>
                        <option value="意面">🍝 意面</option>
                        <option value="面包">🍞 面包</option>
                        <option value="玉米">🌽 玉米</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#F5F1EB] p-4 flex justify-between items-center shrink-0 border-t border-[#F5F1EB]">
              <button
                onClick={() => {
                  setDietarySettings(DEFAULT_DIETARY_SETTINGS);
                  showToast("已重置为主食日历配置 ☕", "info");
                }}
                className="text-xs font-medium text-slate-500 hover:underline cursor-pointer"
              >
                恢复默认
              </button>
              <button 
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast("饮食定制已起效，本周计划已同步主食日历 📅", "success");
                }}
                className="px-5 py-2 bg-[#E07A5F] hover:bg-[#E07A5F]/95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
                id="save-settings-btn"
              >
                应用首选
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Up Edit Sheet Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end justify-center" id="edit-profile-modal-overlay">
          <div className="absolute inset-0" onClick={() => setShowEditProfileModal(false)}></div>
          
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 space-y-5 animate-slide-up overflow-y-auto max-h-[85vh] shadow-2xl relative border-t border-[#F5F1EB]/50 z-10 flex flex-col">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto shrink-0 cursor-pointer mb-2" onClick={() => setShowEditProfileModal(false)}></div>
            
            <div className="flex justify-between items-center shrink-0">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-bold text-[#3D405B]">🥑 保卫官资料工作室</h3>
                <p className="text-[10px] text-[#9A9B9C]">定制您的保卫身份标识与特殊体质参数</p>
              </div>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 px-3 bg-slate-100 hover:bg-[#D4A373]/10 text-slate-500 hover:text-[#D4A373] rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                关闭
              </button>
            </div>

            <div className="space-y-4 py-2 overflow-y-auto pr-1 flex-1 text-left">
              {/* Profile Avatar Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">选择保卫官头像 (Avatar Emoji)</label>
                <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                  {["🥑", "🍳", "🥩", "🥦", "🍕", "🥬", "🍓", "🥖", "🍩", "👨‍🍳", "👩‍🍳", "🐱", "🐶"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl shrink-0 transition-all cursor-pointer ${
                        editAvatar === emoji ? "bg-[#D4A373] text-white scale-110 shadow-sm" : "bg-[#F5F1EB]/50 hover:bg-[#F5F1EB]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">设置昵称 / 呼号</label>
                <input
                  type="text"
                  maxLength={14}
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="w-full text-xs bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[#3D405B] font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-[#D4A373]/50"
                  placeholder="请输入您的昵称"
                />
              </div>

              {/* Edit Signature */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">个性签名 (手写态度)</label>
                <input
                  type="text"
                  maxLength={40}
                  value={editSignature}
                  onChange={e => setEditSignature(e.target.value)}
                  className="w-full text-xs bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[#3D405B] font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-[#D4A373]/50"
                  placeholder="e.g. 认真开火的独居生活家"
                />
              </div>

              {/* Edit Personality */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">膳食人格标签</label>
                <select
                  value={editPersonality}
                  onChange={e => setEditPersonality(e.target.value)}
                  className="w-full text-xs bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[#3D405B] font-semibold border-0 focus:outline-none focus:ring-2"
                >
                  <option value="膳食平衡大师">🥗 膳食平衡大师</option>
                  <option value="减脂燃脂专家">🏃 减脂燃脂专家</option>
                  <option value="优质蛋白质狂魔">🥩 优质蛋白质狂魔</option>
                  <option value="低GI慢碳先锋">🍬 低GI慢碳先锋</option>
                  <option value="轻断自律达人">⏰ 轻断自律达人</option>
                  <option value="精益求精美食家">🍣 精益求精美食家</option>
                </select>
              </div>

              {/* Edit Age Group */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">年龄周期选型 (科学算法适配)</label>
                <select
                  value={editAgeGroup}
                  onChange={e => setEditAgeGroup(e.target.value)}
                  className="w-full text-xs bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[#3D405B] font-semibold border-0"
                >
                  <option value="18-24 岁 (朝气青年)">18-24 岁 (朝气青年)</option>
                  <option value="25-34 岁 (职场白领)">25-34 岁 (职场白领)</option>
                  <option value="35-49 岁 (社会中坚)">35-49 岁 (社会中坚)</option>
                  <option value="50 岁以上 (健康乐活)">50 岁以上 (健康乐活)</option>
                </select>
              </div>

              {/* Gender radio selectors */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">您的性别</label>
                <div className="grid grid-cols-3 gap-2">
                  {["👨 男性", "👩 女性", "🔒 不透露"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditGender(g)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editGender === g
                          ? "bg-[#D4A373] text-white border-[#D4A373]"
                          : "bg-[#F5F1EB]/50 hover:bg-[#F5F1EB] text-[#3D405B] border-slate-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Living volume */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">用餐常住人口</label>
                <div className="grid grid-cols-3 gap-2">
                  {["1人", "2人", "3人+"].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setEditLivingCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        editLivingCount === cnt
                          ? "bg-[#D4A373] text-white border-[#D4A373]"
                          : "bg-[#F5F1EB]/50 hover:bg-[#F5F1EB] text-[#3D405B] border-slate-100"
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body conditions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">身体瞬间状况</label>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {["🌿 无特殊", "🌡️ 肠胃敏感", "🤒 感冒恢复", "🔥 上火", "🌸 生理期", "⚠️ 过敏"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setEditBodyStatus(status)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        editBodyStatus === status
                          ? "bg-[#D4A373] text-white"
                          : "bg-[#F5F1EB]/50 hover:bg-[#F0EBE3] text-[#3D405B]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Life goals (max 2) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono flex justify-between pr-1">
                  <span>每周膳食主焦目标 (多选，最多2个)</span>
                  <span className="font-mono text-[9px] text-[#D4A373]">{editLifeGoals.length}/2</span>
                </label>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {["🥗 减脂", "💪 增肌", "🍬 控糖", "⏰ 轻断食", "🌙 熬夜多", "📚 日常"].map((goal) => {
                    const isSelected = editLifeGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => toggleEditLifeGoal(goal)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#D4A373] text-white"
                            : "bg-[#F5F1EB]/50 hover:bg-[#F0EBE3] text-[#3D405B]"
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avoid taboos */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#9A9B9C] block uppercase font-mono">极度忌口偏好黑名单</label>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {["不吃香菜", "不吃辣", "不吃内脏", "不吃海鲜", "无麸质", "不吃芹菜"].map((avoid) => {
                    const isSelected = editAvoidItems.includes(avoid);
                    return (
                      <button
                        key={avoid}
                        onClick={() => toggleEditAvoidItem(avoid)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#D4A373] text-white"
                            : "bg-[#F5F1EB]/50 hover:bg-[#F0EBE3] text-[#3D405B]"
                        }`}
                      >
                        {avoid}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-50 flex gap-2.5 shrink-0">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#E07A5F] rounded-xl hover:bg-[#E07A5F]/95 cursor-pointer shadow-md"
              >
                保存工作室数据 🍉
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 6. 创意功能全屏浮窗 (Creative Features Overlay Screens) */}
      {activeOverlay !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[85vh] border border-[#F5F1EB] relative">
            
            {/* Top Close icon */}
            <button 
              onClick={() => setActiveOverlay('none')}
              className="absolute top-4 right-4 z-45 p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content for 🍱 美食手账 */}
            {activeOverlay === 'handbook' && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-6 text-center space-y-1 relative" style={{ background: "linear-gradient(135deg, rgba(212,163,115,0.2) 0%, rgba(245,241,235,0.8) 100%)" }}>
                  <span className="text-3xl block">🍱</span>
                  <h4 className="text-xs font-black text-[#D4A373]">Cozy Kitchen Diary</h4>
                  <h3 className="text-base font-black text-[#3D405B] tracking-tight">「每周美食手账」</h3>
                  <p className="text-[9px] text-[#9A9B9C] font-mono uppercase tracking-widest">Calculated by Diet-Bot</p>
                </div>
                
                {/* Simulated hand sketched paper list */}
                <div className="p-6 bg-[#FAF8F5] flex-1 space-y-4 font-sans select-none text-left">
                  <p className="text-[10px] text-[#9A9B9C] font-bold border-b-2 border-[#D4A373]/30 pb-1">🥑 保卫官: {userProfile?.username || "未知保卫官"} · 本周消耗速报</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2.5 items-start">
                      <span className="text-xs">📅</span>
                      <div className="text-[11px] leading-relaxed text-[#3D405B] space-y-0.5">
                        <p className="font-extrabold text-[#3D405B]">周一 · 鲜肉时段</p>
                        <p className="text-[#9A9B9C]">主食: 米饭 · 消耗: 猪肉 150g, 生菜 1包</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="text-xs">🍳</span>
                      <div className="text-[11px] leading-relaxed text-[#3D405B] space-y-0.5">
                        <p className="font-extrabold text-[#3D405B]">周二 · 快手午餐</p>
                        <p className="text-[#9A9B9C]">主食: 面条 · 消耗: 鸡蛋 2颗, 番茄 1颗</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="text-xs">🥦</span>
                      <div className="text-[11px] leading-relaxed text-[#3D405B] space-y-0.5">
                        <p className="font-extrabold text-[#3D405B]">周四 · 绿叶纤维汇</p>
                        <p className="text-[#9A9B9C]">主食: 红薯 · 消耗: 西兰花 200g, 豆腐 1块</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="text-xs">🐟</span>
                      <div className="text-[11px] leading-relaxed text-[#3D405B] space-y-0.5">
                        <p className="font-extrabold text-[#3D405B]">周日 · 周末轻食</p>
                        <p className="text-[#9A9B9C]">主食: 面包 · 消耗: 虾仁 6只, 菠菜少量</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-[#D4A373]/15 text-center space-y-2">
                    <div className="inline-block p-1 bg-white border border-[#D4A373]/20 rounded-lg text-[9px] text-[#D4A373] font-bold shadow-sm">
                      ✨ 本周拯救率 98%
                    </div>
                    <p className="text-[8px] text-[#9A9B9C] italic">手账数据基于冰箱实际取出和标记记录自动成账</p>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-50 flex gap-2 justify-end shrink-0">
                  <button 
                    onClick={() => {
                      showToast("手账导图已生成！已存至手机相册 🖼️", "success");
                      setActiveOverlay('none');
                    }}
                    className="w-full py-2.5 bg-[#E07A5F] hover:bg-[#E07A5F]/95 text-white text-xs font-bold rounded-xl shadow cursor-pointer text-center transition-all"
                  >
                    💾 导出每周手账长图
                  </button>
                </div>
              </div>
            )}

            {/* Content for 🏅 冰箱成就 */}
            {activeOverlay === 'badges' && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-5 text-center space-y-1 relative" style={{ background: "linear-gradient(135deg, rgba(168,213,186,0.2) 0%, rgba(245,241,235,0.8) 100%)" }}>
                  <span className="text-3xl block">🏆</span>
                  <h3 className="text-base font-bold text-[#3D405B] tracking-tight flex items-center justify-center gap-1">
                    <span>🏅 冰箱保卫勋章荣誉墙</span>
                  </h3>
                  <p className="text-[10px] text-[#9A9B9C]">在对抗浪费和科学膳食中解锁专属印油</p>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  {/* 3x2 badglist */}
                  <div className="grid grid-cols-3 gap-3.5">
                    {[
                      { icon: "🥬", label: "光盘行动派", unlocked: true, desc: "吃光所有在库的绿色蔬菜" },
                      { icon: "🥩", label: "蛋白质领袖", unlocked: true, desc: "消耗了主肉食品补给" },
                      { icon: "🛡️", label: "临期拯救官", unlocked: true, desc: "抢救高危临期食材超过 5次" },
                      { icon: "🍲", label: "开釜大厨", unlocked: true, desc: "利用菜谱做成 6 次以上的饭" },
                      { icon: "🍪", label: "控糖大师", unlocked: false, desc: "设定本周控糖目标且零含糖破格" },
                      { icon: "☕", label: "零废弃守护", unlocked: false, desc: "连续 3周冰箱零废弃腐烂记录" }
                    ].map((badge, i) => (
                      <div 
                        key={i} 
                        onClick={() => showToast(`🏅【${badge.label}】: ${badge.desc}`, "info")}
                        className={`p-2 bg-white rounded-2xl text-center border cursor-pointer hover:scale-105 active:scale-95 transition-all space-y-1 select-none ${
                          badge.unlocked ? "border-emerald-100 shadow-sm" : "border-slate-50 opacity-45 block"
                        }`}
                      >
                        <span className="text-2xl block">{badge.icon}</span>
                        <p className="text-[9px] font-black text-[#3D405B] truncate">{badge.label}</p>
                        <span className={`text-[8px] font-mono block ${badge.unlocked ? "text-emerald-700 font-bold" : "text-[#9A9B9C]"}`}>
                          {badge.unlocked ? "✓" : "🔒"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-2xl text-center">
                    <p className="text-[10px] text-[#3D405B] leading-relaxed">
                      已解锁 <span className="text-emerald-700 font-bold">4 / 6</span> 勋章。继续用完食材即可点亮剩下的神秘成就啦！
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-50 shrink-0">
                  <button 
                    onClick={() => setActiveOverlay('none')}
                    className="w-full py-2.5 bg-[#D4A373] text-white text-xs font-bold rounded-xl text-center cursor-pointer shadow-sm"
                  >
                    我知道了 🎖️
                  </button>
                </div>
              </div>
            )}

            {/* Content for 🧬 饮食人格 */}
            {activeOverlay === 'personality' && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-5 text-center space-y-1 relative" style={{ background: "linear-gradient(135deg, rgba(232,245,233,0.3) 0%, rgba(245,241,235,0.7) 100%)" }}>
                  <span className="text-3xl block">🧬</span>
                  <h3 className="text-base font-bold text-[#3D405B] tracking-tight">「DNA饮食物理特征报告」</h3>
                  <p className="text-[10px] text-[#9A9B9C] font-mono uppercase tracking-widest">Cozy Cafe Gen-Analysis</p>
                </div>

                <div className="p-5 flex-1 space-y-4 text-left">
                  <p className="text-[11px] leading-relaxed text-[#3D405B]">
                    通过对您的身体状况、忌口以及本周采购食材种类的交叉计算，您的冰箱饮食DNA编码为：
                  </p>

                  {/* Meter percentages */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-[#3D405B]">
                        <span>🍞 碳水爱意值</span>
                        <span className="font-mono">70% (慢碳极客)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4A373]" style={{ width: "70%" }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-[#3D405B]">
                        <span>🥬 膳食纤维平衡点</span>
                        <span className="font-mono">82% (高倍自制抗炎)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600" style={{ width: "82%" }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-[#3D405B]">
                        <span>🥩 蛋白质抗击抗体</span>
                        <span className="font-mono">65% (健壮核心保障)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#E07A5F]" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-2xl space-y-1 border border-slate-100">
                    <p className="text-[10px] font-black text-[#3D405B]">💡 饮食物理学家温情处方：</p>
                    <p className="text-[10px] text-[#3D405B] leading-relaxed font-sans">
                      根据您的膳食特征，建议晚餐多摄入高纤维绿叶菜。您的肠胃指数目前非常健康。请安心享用本周食谱规划！
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-50 flex gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      showToast("已成功转发！妈妈表示非常欣慰并点赞 🌸", "success");
                      setActiveOverlay('none');
                    }}
                    className="w-full py-2.5 bg-[#E07A5F] text-white text-xs font-bold rounded-xl text-center cursor-pointer shadow hover:bg-[#E07A5F]/95"
                  >
                    ✉️ 发送给妈妈看 (汇报健康)
                  </button>
                </div>
              </div>
            )}

            {/* Content for 📊 饮食月报 (Spotify Wrapped Style!) */}
            {activeOverlay === 'report' && <WrappedReport onClose={() => setActiveOverlay('none')} />}

          </div>
        </div>
      )}

      {/* Dedicated Recipe steps Detailed full Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          isLoading={isRecipeLoading}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Sticky Bottom Navigation - Styled with Warm Latte aesthetic */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F5F1EB] px-4 py-3 shadow-lg z-35">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          
          <button
            onClick={() => setCurrentTab('home')}
            className={`py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'home' 
                ? "bg-[#D4A373]/10 text-[#D4A373] scale-102" 
                : "text-[#9A9B9C] hover:text-[#3D405B]"
            }`}
            id="tab-home-btn"
          >
            <Refrigerator className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-bold tracking-tight animate-none">我的冰箱</span>
          </button>

          <button
            onClick={() => setCurrentTab('plan')}
            className={`py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'plan' 
                ? "bg-[#D4A373]/10 text-[#D4A373] scale-102" 
                : "text-[#9A9B9C] hover:text-[#3D405B]"
            }`}
            id="tab-plan-btn"
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-bold tracking-tight">膳食规划</span>
          </button>

          <button
            onClick={() => setCurrentTab('creative')}
            className={`py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'creative' 
                ? "bg-[#D4A373]/10 text-[#D4A373] scale-102" 
                : "text-[#9A9B9C] hover:text-[#3D405B]"
            }`}
            id="tab-creative-btn"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-bold tracking-tight">今日灵感</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              currentTab === 'profile' 
                ? "bg-[#D4A373]/10 text-[#D4A373] scale-102" 
                : "text-[#9A9B9C] hover:text-[#3D405B]"
            }`}
            id="tab-profile-btn"
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-bold tracking-tight text-center truncate">我的</span>
          </button>

        </div>
      </nav>

    </div>
  );
}

function WrappedReport({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  
  const slides = [
    {
      bg: "bg-[#3D405B]",
      textColor: "text-white",
      emoji: "🍱",
      title: "冰箱月度保卫战 · 战报报告",
      desc: "5月份，你在本站进行冰箱保卫长达 30 天，完美的采购、记录和烹制让我们共同完成了绿色低碳的生活闭环！",
      metric: "省下 0次 剩菜浪费",
      subMetric: "本月无一例过期丢弃"
    },
    {
      bg: "bg-[#D4A373]",
      textColor: "text-white",
      emoji: "🥑",
      title: "你的专属高频黄金组合",
      desc: "你在这个月共调遣了 48次 鸡蛋、番茄和生菜这三大王牌，它们是你厨房中当之无愧的护卫元勋！",
      metric: "鸡蛋 + 西红柿 × 15 次",
      subMetric: "独居青年的万能营养伴侣"
    },
    {
      bg: "bg-[#7EC8A3]",
      textColor: "text-[#3D405B]",
      emoji: "💰",
      title: "省下的外卖与零花预算",
      desc: "相比于每天下馆子和暴吃重口味外卖，本月的自热做饭帮你成功积累了健康值，并省下一笔快乐备用金！",
      metric: "省下 ￥1,280 元",
      subMetric: "足够购买 2 场心爱Live演出票 🎸"
    }
  ];

  const currentSlide = slides[slide];

  return (
    <div className="flex-1 flex flex-col min-h-[380px] select-none text-left">
      <div className={`p-6 flex-1 flex flex-col justify-between transition-colors duration-500 pb-8 ${currentSlide.bg} ${currentSlide.textColor}`}>
        <div className="space-y-2 pt-4">
          <span className="text-3xl block animate-bounce-slow">{currentSlide.emoji}</span>
          <h3 className="text-base font-black tracking-tight">{currentSlide.title}</h3>
          <p className="text-xs leading-relaxed opacity-95">{currentSlide.desc}</p>
        </div>

        <div className="space-y-1 pb-4">
          <p className="text-2xl font-black">{currentSlide.metric}</p>
          <p className="text-[10px] uppercase font-mono tracking-wider opacity-75">{currentSlide.subMetric}</p>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex gap-1.5 leading-none">
          {slides.map((_, i) => (
            <span 
              key={i} 
              className={`w-2 h-2 rounded-full ${i === slide ? "bg-[#3D405B] w-4" : "bg-slate-200"} transition-all`}
            ></span>
          ))}
        </div>

        <div className="flex gap-2">
          {slide > 0 && (
            <button 
              onClick={() => setSlide(slide - 1)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
            >
              上一步
            </button>
          )}
          {slide < slides.length - 1 ? (
            <button 
              onClick={() => setSlide(slide + 1)}
              className="px-4 py-1.5 bg-[#3D405B] text-white hover:bg-opacity-90 font-bold rounded-lg text-xs"
            >
              下一步 🥑
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-[#E07A5F] text-white hover:bg-[#E07A5F]/95 font-bold rounded-lg text-xs"
            >
              开启下月保卫战！
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
