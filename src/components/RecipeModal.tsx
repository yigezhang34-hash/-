import { X, Clock, Flame, Check, ChefHat, Sparkles, AlertCircle } from "lucide-react";
import { RecipeDetails } from "../types";

interface RecipeModalProps {
  recipe: RecipeDetails;
  onClose: () => void;
  isLoading: boolean;
}

export default function RecipeModal({ recipe, onClose, isLoading }: RecipeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D405B]/60 backdrop-blur-sm animate-fade-in" id="recipe-modal-backdrop">
      <div 
        className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl border-0 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        id="recipe-detail-container"
      >
        {/* Warm Cozy Header Panel */}
        <div className="bg-gradient-to-r from-[#D4A373] to-[#C18F5F] p-6 text-white shrink-0 flex justify-between items-start select-none">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-white/20 rounded-lg text-white">
                <ChefHat className="w-4 h-4" />
              </span>
              <span className="text-[10px] uppercase tracking-wider font-mono text-orange-50 font-bold">温暖家常 · 食谱做法</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">{recipe.name || "美味菜肴"}</h2>
            <p className="text-[11px] text-[#F5F1EB] italic font-sans leading-relaxed">{recipe.intro || "享受制作咖啡馆质感美食的慢时光。"}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all shrink-0 cursor-pointer"
            aria-label="关闭详情"
            id="close-recipe-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 px-8 space-y-4 bg-white">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-[#F5F1EB] border-t-[#D4A373] rounded-full animate-spin"></div>
              <Sparkles className="absolute w-5 h-5 text-[#D4A373] animate-pulse" />
            </div>
            <p className="text-xs font-bold text-[#9A9B9C] font-mono animate-pulse-slow">
              正在研磨大厨独家智能步骤中，请稍候...
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F5F1EB]/20">
            
            {/* Soft Info Indicator Grid */}
            <div className="grid grid-cols-3 gap-2.5 bg-[#F5F1EB]/50 p-3.5 rounded-[18px]">
              <div className="flex flex-col items-center justify-center p-2 text-center bg-white rounded-xl shadow-sm border border-[#F5F1EB]">
                <Clock className="w-4 h-4 text-[#D4A373] mb-1" />
                <span className="text-[9px] text-[#9A9B9C] font-mono uppercase tracking-wider">估计时间</span>
                <span className="text-xs font-bold text-[#3D405B]">{recipe.timeMinutes || 15} 分钟</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center bg-white rounded-xl shadow-sm border border-[#F5F1EB]">
                <Flame className="w-4 h-4 text-[#E07A5F] mb-1" />
                <span className="text-[9px] text-[#9A9B9C] font-mono uppercase tracking-wider font-sans">制作难度</span>
                <span className="text-xs font-bold text-[#3D405B]">{recipe.difficulty || "简单"}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 text-center bg-white rounded-xl shadow-sm border border-[#F5F1EB]">
                <Sparkles className="w-4 h-4 text-[#A8D5BA] mb-1" />
                <span className="text-[9px] text-[#9A9B9C] font-mono uppercase tracking-wider font-sans">热量粗估</span>
                <span className="text-xs font-bold text-[#3D405B]">{recipe.nutrients?.calories || "310 kcal"}</span>
              </div>
            </div>

            {/* Sourcing details list checking */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#3D405B] flex items-center gap-1.5 pl-1">
                <span>🛒 调料与辅料精确核验</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 bg-white p-4 rounded-[18px] border border-[#F5F1EB]">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ing, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        ing.inStock 
                          ? "bg-[#A8D5BA]/15 text-[#3D405B] border border-[#A8D5BA]/35" 
                          : "bg-orange-50/50 text-slate-700 border border-[#E07A5F]/15"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        {ing.inStock ? (
                          <span className="w-4 h-4 flex items-center justify-center bg-[#A8D5BA] text-white rounded-full font-bold">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 flex items-center justify-center bg-[#E07A5F]/20 text-[#E07A5F] rounded-full font-bold text-[9px] font-sans">
                            ●
                          </span>
                        )}
                        <span>{ing.name}</span>
                      </span>
                      <span className="font-mono text-[#9A9B9C] text-[10px] font-semibold bg-white/85 px-2 py-0.5 rounded-lg border border-slate-55">
                        {ing.amount} {ing.inStock ? "已在冰箱" : "家中自备"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9A9B9C] py-2 text-center select-none font-medium">冰箱库存自动判定无辅料需求</p>
                )}
              </div>
            </div>

            {/* steps using numbered brown circles */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#3D405B] pl-1">👩‍🍳 大厨私制做法步骤 (Recipe Steps)</h3>
              <div className="space-y-2.5">
                {recipe.steps && recipe.steps.length > 0 ? (
                  recipe.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      {/* Numbered brown circles */}
                      <span className="w-5 h-5 flex items-center justify-center bg-[#D4A373] text-white rounded-full font-mono text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#3D405B] leading-relaxed font-sans font-medium bg-white p-3 rounded-xl border border-slate-50 flex-1">
                        {step}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9A9B9C] italic py-2 text-center">暂无步骤说明，可以直接烹调。</p>
                )}
              </div>
            </div>

            {/* Cozy Scientific Nutrients analysis */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#3D405B] pl-1">🌾 膳食均衡评测</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
                  <p className="text-[#9A9B9C] font-semibold font-sans">高效蛋白质 (Protein)</p>
                  <p className="font-bold text-sky-900 mt-0.5 text-xs">{recipe.nutrients?.proteins || "合理补充"}</p>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[#9A9B9C] font-semibold font-sans">膳食纤维 (Fiber)</p>
                  <p className="font-bold text-emerald-900 mt-0.5 text-xs">{recipe.nutrients?.fibers || "清淡高纤维"}</p>
                </div>
                <div className="p-2.5 bg-[#D4A373]/10 rounded-xl border border-[#D4A373]/20">
                  <p className="text-[#9A9B9C] font-semibold font-sans">健康碳水 (Carbs)</p>
                  <p className="font-bold text-[#D4A373] mt-0.5 text-xs">{recipe.nutrients?.carbs || "低GI慢碳"}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Footer actions */}
        <div className="bg-[#F5F1EB]/80 p-4 shrink-0 border-t border-[#F5F1EB] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#D4A373]/90 text-white rounded-xl font-bold font-sans text-xs transition-colors cursor-pointer"
            id="close-recipe-modal-footer"
          >
            我学会了，开启今日烹饪
          </button>
        </div>
      </div>
    </div>
  );
}
