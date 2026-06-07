import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required in settings/secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Generate Weekly Meal Plan
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { ingredients, settings } = req.body;
    const ai = getGeminiClient();

    const formattedIngredients = ingredients.map((ing: any) => {
      const daysText = ing.expiryDate ? `, 过期日期: ${ing.expiryDate}` : "";
      return `- ${ing.name} (分类: ${ing.category}${daysText}, 状态: ${ing.status}, 剩余数量: ${ing.amount || "适量"})`;
    }).join("\n");

    const avoidText = settings.avoidIngredients && settings.avoidIngredients.length > 0
      ? settings.avoidIngredients.join("、")
      : "无";

    const stapleText = JSON.stringify(settings.stapleCalendar);

    const systemInstruction = `你是一位专业私人营养师和创意大厨，擅长为年轻独居青年定制健康、科学、省时和零浪费的每周三餐膳食计划。
你的排餐逻辑必须遵循以下几大核心原则：
1. **临期食材优先 (Anti-Waste)**: 录入状态为 'expiring'（即倒计时只有1-2天）的食材必须被安排在周一、周二或周三的早期餐食中，优先消耗，避免浪费！
2. **膳食营养均衡 (Nutritional Balance)**: 每顿午餐和晚餐必须包含 **高蛋白质 (肉类、海鲜、豆制品或蛋奶之一)** + **膳食纤维 (蔬菜类之一)** 的科学搭配。早餐可以偏重营养快手。
3. **主食日历限制 (Staple Rotation)**: 必须严格遵循用户的主食日历。每天的主食选择应该与主食日历中当天的配置锁定并明确标注说明。
4. **忌口及避让偏好 (Avoidance & Preference)**: 绝对不能使用用户标记的忌口原材料（比如不能有：${avoidText} 等食材甚至调味料）。
5. **菜系风格 (Cuisine style)**: 结合用户的菜系偏好：${settings.cuisinePreference}。如果用户选择的是‘中餐’，周历里全天三餐就全用中式家常菜或营养快手早点；如果是‘西餐’用西式做法；‘混合’可以交叉。
6. **双层食材匹配展示 (Sourcing Details)**: 每一餐菜品不仅有菜品名字，还要列出该菜谱所需的食材（ingredients）。同时明确匹配：哪些是用户冰箱已录入有的食材（availableIngredients），哪些是需要额外补充/购买的调料或辅料（missingIngredients），这样用户能够一目了然！

【极速延迟优化限制（关键）：为大幅缩短大厨构思响应时间，请保证生成的所有字符极其精简，绝对不能产生任何废话和啰嗦描述。各个餐次的 ingredients, availableIngredients, missingIngredients 数组中的元素数量严格限制在最多 1 至 3 个核心重要项目（不要列多余调味，不要罗列成堆）。dishName 命名控制在 4-8 个字内，type 限制在 4-6 个字内。这样能保证最快的生成速度，3秒内疾速响应。】

请产出从“周一”到“周日”连续 7 天、覆盖“早餐、午餐、晚餐”的严密三餐搭配。主食属性需贯穿在套餐内容中。`;

    const userPrompt = `这里是我的冰箱食材数据：
${formattedIngredients}

这里是我的膳食日历和忌口偏好配置：
- 菜系偏好: ${settings.cuisinePreference}
- 绝对避让/忌口食材: ${avoidText}
- 每日主食日历安排: ${stapleText}

请按照系统指南，为我排出一份从周一到周日的高品质膳食规划日历，直接输出极简快速的JSON结构数据，不要产生任何罗里吧嗦的长字段。`;

    const mealPlanItemSchema = {
      type: Type.OBJECT,
      properties: {
        dishName: { type: Type.STRING, description: "中文菜品名称，4-8个字，极其温馨有食欲" },
        type: { type: Type.STRING, description: "4-6个字，如：高蛋白、清淡高纤" },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "本菜所需要的核心食材列表，限制最多1-3个" },
        availableIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "在我的冰箱录入中匹配并可用的食材，限制最多1-3个" },
        missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "缺乏需要额外采购或家里常备的极简调料，限制最多1-3个" },
        timeMinutes: { type: Type.INTEGER, description: "烹饪时间" },
      },
      required: ["dishName", "type", "ingredients", "availableIngredients", "missingIngredients", "timeMinutes"],
    };

    const dailyMealPlanSchema = {
      type: Type.OBJECT,
      properties: {
        dayName: { type: Type.STRING, description: "使用：'周一', '周二', '周三', '周四', '周五', '周六', '周日'" },
        staple: { type: Type.STRING, description: "当日搭配主食" },
        breakfast: mealPlanItemSchema,
        lunch: mealPlanItemSchema,
        dinner: mealPlanItemSchema,
      },
      required: ["dayName", "staple", "breakfast", "lunch", "dinner"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: dailyMealPlanSchema,
          description: "周一到周日经典极速精简餐单明细"
        }
      }
    });

    const parsedData = JSON.parse(response.text || "[]");
    res.json({ success: true, plan: parsedData });
  } catch (error: any) {
    console.error("Meal Generation Error:", error);
    res.status(500).json({ success: false, error: error?.message || "服务器AI搭配规划失败" });
  }
});

// 2. API: Generate Detailed Recipe Steps
app.post("/api/recipe-details", async (req, res) => {
  try {
    const { dishName, availableIngredients } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `你是一位高星级中西餐大厨。你需要为用户提供的特定菜品编写极具操作性的做法步骤说明书。
请注意：
1. 食材明细里要列出用量，并明确注明是不是已有库存（inStock）。
2. 提供清晰的烹饪时序说明。
3. 给出一个简单的一句话小贴士（intro）。
4. 对蛋白质、纤维素、碳水化合物和总卡路里做一个科学合理的估算。`;

    const userPrompt = `我想做这道菜: ${dishName}。
参考我的冰箱已有部分食材: ${JSON.stringify(availableIngredients || [])}。
请返回这份详细的菜谱制作流程，输出符合指定 schema 的精致 JSON 对象。`;

    const recipeDetailsSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "菜品名称" },
        intro: { type: Type.STRING, description: "一句话点评，比如特色、味道或膳食营养亮点" },
        timeMinutes: { type: Type.INTEGER, description: "预计烹饪时间（分钟）" },
        difficulty: { type: Type.STRING, description: "简单 | 中等 | 困难" },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "原料食材全称" },
              amount: { type: Type.STRING, description: "分量用量描述，例如：150g、2汤匙、适量" },
              inStock: { type: Type.BOOLEAN, description: "用户目前是否在冰箱拥有这件食材(对比已有部分食材而定)" },
            },
            required: ["name", "amount", "inStock"]
          }
        },
        steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "每一个操作步骤的详细指引，按烹饪顺序逻辑列出" },
        nutrients: {
          type: Type.OBJECT,
          properties: {
            proteins: { type: Type.STRING, description: "蛋白质状态分析，如：高蛋白 25g" },
            fibers: { type: Type.STRING, description: "膳食纤维状态分析，如：膳食纤维丰富 4g" },
            carbs: { type: Type.STRING, description: "碳水化合物评级" },
            calories: { type: Type.STRING, description: "卡路里，例如：380 kcal" },
          },
          required: ["proteins", "fibers", "carbs", "calories"]
        }
      },
      required: ["name", "intro", "timeMinutes", "difficulty", "ingredients", "steps", "nutrients"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: recipeDetailsSchema
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, recipe: parsedData });
  } catch (error: any) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({ success: false, error: error?.message || "菜谱步骤详细查询失败" });
  }
});

// 3. API: Shake to recommend a Recipe (摇一摇)
app.post("/api/shake-recipe", async (req, res) => {
  try {
    const { ingredients, tag, dietarySettings } = req.body;
    const ai = getGeminiClient();

    const formattedIngredients = ingredients.map((ing: any) => ing.name).join("、");
    const avoidText = dietarySettings?.avoidIngredients ? dietarySettings.avoidIngredients.join("、") : "无";

    const systemInstruction = `你是一位创意料理大厨，拥有全网最棒的创意菜谱库。现在我们要进行一个“摇一摇”的趣味创意推荐！
你要根据用户抽中的特定心情标签：[${tag}] 并且结合用户冰箱已有食材 [${formattedIngredients}] 专门设计1道惊艳好玩的菜。

分类标签要求：
- '快手菜': 制作难度低、总时长不能超过15分钟的现代轻食极速美味。
- '重口味': 味道醇厚、酸辣、麻辣、蒜香、或者饱满醇厚的下饭硬菜。
- '清淡': 养胃轻负、少油少盐、还原食材本身鲜美的素雅、原汁蒸煮烹饪。
- '异国风情': 结合日本料理/韩式烧烤/意大利面/东南亚咖喱/墨西哥塔可等跨文化风味。
- '清空冰箱': 特别为清空库存而制，必须要重点用到冰箱里快要过期的主力食材。

同时还要避忌：${avoidText}。
请按照这个规则随机并富有创意地想出一个完美贴合该标签和库存的菜色，以精致的 JSON 格式输出，匹配规范的 recipeDetailsSchema。`;

    const userPrompt = `我已经摇晃了手机！我当前的筛选标签是: [${tag}]。
冰箱食材清单如下: ${formattedIngredients}。
请返回1道符合我当前摇到的最佳创意料理。包含步骤、营养素分析及已有库存判定。`;

    // Same schema as recipe details
    const recipeSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        intro: { type: Type.STRING, description: "摇出的心声/一句话故事，和选择的心情/标签相呼应" },
        timeMinutes: { type: Type.INTEGER },
        difficulty: { type: Type.STRING },
        ingredients: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              amount: { type: Type.STRING },
              inStock: { type: Type.BOOLEAN, description: "该食材是不是刚好存在于我的冰箱里" },
            },
            required: ["name", "amount", "inStock"]
          }
        },
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        nutrients: {
          type: Type.OBJECT,
          properties: {
            proteins: { type: Type.STRING },
            fibers: { type: Type.STRING },
            carbs: { type: Type.STRING },
            calories: { type: Type.STRING },
          },
          required: ["proteins", "fibers", "carbs", "calories"]
        }
      },
      required: ["name", "intro", "timeMinutes", "difficulty", "ingredients", "steps", "nutrients"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: recipeSchema
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, recipe: parsedData });
  } catch (error: any) {
    console.error("Shake Error:", error);
    res.status(500).json({ success: false, error: error?.message || "摇一摇创意匹配失败" });
  }
});


// Serve static assets or mount Vite Express middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on public port ${PORT} (0.0.0.0)`);
  });
}

startServer();
