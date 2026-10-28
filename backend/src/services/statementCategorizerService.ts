import pool from "../config/database.js";
import { RawParsedTransaction } from "./statementParserService.js";

export interface StagedTransaction extends RawParsedTransaction {
  id: string; // Temporary unique key for UI state
  suggestedCategoryId: number;
  suggestedCategoryName: string;
  confidence: "learned" | "rule" | "default";
  isDuplicate: boolean;
  duplicateReason?: string;
  selected: boolean;
}

export interface StatementCategorizationSummary {
  totalCount: number;
  newCount: number;
  duplicatesCount: number;
  totalExpenseAmount: number;
  totalIncomeAmount: number;
}

interface CategoryRow {
  id: number;
  family_id: number;
  name: string;
  type: "expense" | "income";
}

interface MerchantMappingRow {
  merchant_pattern: string;
  category_id: number;
}

// Built-in keyword catalog mapping normalized merchant tokens to standard category concepts
const KEYWORD_RULES: { keywords: string[]; concept: string; type: "expense" | "income" }[] = [
  {
    concept: "Food & Dining",
    type: "expense",
    keywords: [
      "swiggy", "zomato", "starbucks", "mcdonald", "kfc", "burger king", "domino", "pizza hut",
      "subway", "haldiram", "cafe", "coffee", "restaurant", "barbeque", "chaayos", "chai point",
      "costa", "dunkin", "bakery", "baker", "eatclub", "freshmenu", "sweet", "bistro", "dhaba",
      "biryani", "pizzas", "diner", "food", "kitchen", "dining"
    ],
  },
  {
    concept: "Groceries",
    type: "expense",
    keywords: [
      "blinkit", "zepto", "instamart", "bigbasket", "nature's basket", "dmart", "d-mart", "spencer",
      "reliance fresh", "supermarket", "grocery", "groceries", "milk", "country delight", "meat",
      "licious", "freshtohome", "vegetable", "fruits", "provision", "kirana", "mart"
    ],
  },
  {
    concept: "Transportation",
    type: "expense",
    keywords: [
      "uber", "ola", "rapido", "metro", "irctc", "railway", "railways", "makemytrip", "cleartrip",
      "shell", "hpcl", "bpcl", "iocl", "petrol", "diesel", "fuel", "gas station", "fastag", "toll",
      "indigo", "air india", "vistara", "spicejet", "parking", "cab", "taxi", "flight", "auto"
    ],
  },
  {
    concept: "Shopping",
    type: "expense",
    keywords: [
      "amazon", "flipkart", "myntra", "ajio", "nykaa", "zara", "h&m", "meesho", "tata cliq",
      "decathlon", "croma", "reliance digital", "ikea", "uniqlo", "lenskart", "titan", "electronics",
      "clothing", "apparel", "shoes", "fashion", "mall", "lifestyle", "westside", "trends", "retail"
    ],
  },
  {
    concept: "Utilities",
    type: "expense",
    keywords: [
      "electricity", "bescom", "tata power", "water", "gas", "igl", "mahanagar", "airtel", "jio",
      "vi", "vodafone", "broadband", "act fibernet", "bsnl", "recharge", "dth", "tata play", "utility",
      "electric", "power", "cylinder", "postpaid", "prepaid"
    ],
  },
  {
    concept: "Subscriptions",
    type: "expense",
    keywords: [
      "netflix", "spotify", "disney", "hotstar", "prime", "youtube", "apple.com", "google play",
      "bookmyshow", "pvr", "inox", "cinema", "playstation", "xbox", "steam", "audible", "subscription",
      "membership", "gym", "cult.fit", "cultfit"
    ],
  },
  {
    concept: "Healthcare",
    type: "expense",
    keywords: [
      "apollo", "1mg", "pharmeasy", "netmeds", "medplus", "practo", "hospital", "clinic", "pharmacy",
      "diagnostic", "dr lal", "pathlab", "dentist", "medicare", "medical", "doctor", "health", "dental"
    ],
  },
  {
    concept: "Housing",
    type: "expense",
    keywords: [
      "rent", "maintenance", "society", "apartment", "nobroker", "housing", "landlord", "flat"
    ],
  },
  {
    concept: "Salary",
    type: "income",
    keywords: [
      "salary", "payroll", "stipend", "wages", "employer", "compensation"
    ],
  },
  {
    concept: "Investment / Interest",
    type: "income",
    keywords: [
      "dividend", "interest", "zerodha", "groww", "mutual fund", "bonds", "yield", "capital gain"
    ],
  },
  {
    concept: "Cashback / Refund",
    type: "income",
    keywords: [
      "cashback", "refund", "reversal", "reimbursement", "reward"
    ],
  },
];

/**
 * Match a raw transaction against family history, brand rules, and active categories
 */
export async function categorizeAndDeduplicateTransactions(
  familyId: number,
  rawTransactions: RawParsedTransaction[],
): Promise<{ transactions: StagedTransaction[]; summary: StatementCategorizationSummary }> {
  // 1. Fetch active categories for the family
  const categoriesRes = await pool.query<CategoryRow>(
    `SELECT id, family_id, name, type FROM categories WHERE family_id = $1 ORDER BY name ASC`,
    [familyId],
  );
  const categories = categoriesRes.rows;

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const defaultExpenseCat = expenseCategories[0] || categories[0];
  const defaultIncomeCat = incomeCategories[0] || categories[0];

  // 2. Fetch learned family merchant mappings
  const mappingsRes = await pool.query<MerchantMappingRow>(
    `SELECT merchant_pattern, category_id FROM merchant_category_mappings WHERE family_id = $1`,
    [familyId],
  );
  const learnedMappings = mappingsRes.rows;

  // 3. Check for duplicates in database within the date range
  const dates = Array.from(new Set(rawTransactions.map((t) => t.date)));
  let existingTxns: { id: number; transaction_date: string; amount: string; type: string; title: string }[] = [];

  if (dates.length > 0) {
    const existingRes = await pool.query(
      `SELECT id, to_char(transaction_date, 'YYYY-MM-DD') as transaction_date, amount::text, type, title
       FROM transactions
       WHERE family_id = $1 AND is_deleted = false AND transaction_date = ANY($2::date[])`,
      [familyId, dates],
    );
    existingTxns = existingRes.rows;
  }

  const matchedExistingIndices = new Set<number>();
  const staged: StagedTransaction[] = [];
  let duplicatesCount = 0;
  let totalExpenseAmount = 0;
  let totalIncomeAmount = 0;

  for (let i = 0; i < rawTransactions.length; i++) {
    const raw = rawTransactions[i];
    const uniqueKey = `staged_${raw.date}_${raw.amount}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    // 1-to-1 Duplicate Check against database
    const matchedIdx = existingTxns.findIndex(
      (e, idx) =>
        !matchedExistingIndices.has(idx) &&
        e.transaction_date === raw.date &&
        Math.abs(parseFloat(e.amount) - raw.amount) < 0.01 &&
        e.type.toLowerCase() === raw.type.toLowerCase(),
    );

    const isDup = matchedIdx !== -1;
    if (isDup) {
      matchedExistingIndices.add(matchedIdx);
      duplicatesCount++;
    }

    if (raw.type === "expense") {
      totalExpenseAmount += raw.amount;
    } else {
      totalIncomeAmount += raw.amount;
    }

    // Determine category
    const { categoryId, categoryName, confidence } = findBestCategory(
      raw.cleanTitle,
      raw.rawDescription,
      raw.type,
      categories,
      learnedMappings,
      raw.type === "expense" ? defaultExpenseCat : defaultIncomeCat,
      raw.rawCategory,
    );

    staged.push({
      ...raw,
      id: uniqueKey,
      suggestedCategoryId: categoryId,
      suggestedCategoryName: categoryName,
      confidence,
      isDuplicate: isDup,
      duplicateReason: isDup ? "Already logged in family transactions with identical date & amount" : undefined,
      selected: !isDup, // Default select non-duplicates
    });
  }

  return {
    transactions: staged,
    summary: {
      totalCount: rawTransactions.length,
      newCount: rawTransactions.length - duplicatesCount,
      duplicatesCount,
      totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
      totalIncomeAmount: Math.round(totalIncomeAmount * 100) / 100,
    },
  };
}

/**
 * 3-Tier classification logic
 */
function findBestCategory(
  cleanTitle: string,
  rawDescription: string,
  type: "income" | "expense",
  categories: CategoryRow[],
  learnedMappings: MerchantMappingRow[],
  fallbackCategory?: CategoryRow,
  rawCategory?: string,
): { categoryId: number; categoryName: string; confidence: "learned" | "rule" | "default" } {
  // If the file explicitly included a category (e.g. from an export or accounting software)
  if (rawCategory && rawCategory.trim()) {
    const normRaw = rawCategory.toLowerCase().trim();
    // 1. Exact match with same type
    const directExact = categories.find(
      (c) => c.type === type && c.name.toLowerCase() === normRaw,
    );
    if (directExact) {
      return {
        categoryId: directExact.id,
        categoryName: directExact.name,
        confidence: "learned",
      };
    }
    // 2. Partial match with same type
    const directPartial = categories.find(
      (c) =>
        c.type === type &&
        (c.name.toLowerCase().includes(normRaw) || normRaw.includes(c.name.toLowerCase())),
    );
    if (directPartial) {
      return {
        categoryId: directPartial.id,
        categoryName: directPartial.name,
        confidence: "learned",
      };
    }
  }

  const haystack = `${cleanTitle} ${rawDescription}`.toLowerCase();

  // Tier 1: Check Learned Family Mappings
  for (const mapping of learnedMappings) {
    const pat = mapping.merchant_pattern.toLowerCase().trim();
    if (pat && haystack.includes(pat)) {
      const targetCat = categories.find((c) => c.id === mapping.category_id);
      if (targetCat) {
        return {
          categoryId: targetCat.id,
          categoryName: targetCat.name,
          confidence: "learned",
        };
      }
    }
  }

  // Tier 2: Check Built-in Keywords
  const relevantRules = KEYWORD_RULES.filter((r) => r.type === type);
  for (const rule of relevantRules) {
    const match = rule.keywords.some((kw) => haystack.includes(kw));
    if (match) {
      // Find category in family that best matches rule concept
      const targetCat = findMatchingCategory(rule.concept, categories, type);
      if (targetCat) {
        return {
          categoryId: targetCat.id,
          categoryName: targetCat.name,
          confidence: "rule",
        };
      }
    }
  }

  // Tier 3: Direct name match with any existing category
  for (const cat of categories) {
    if (cat.type === type && haystack.includes(cat.name.toLowerCase())) {
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        confidence: "rule",
      };
    }
  }

  // Fallback
  if (fallbackCategory) {
    return {
      categoryId: fallbackCategory.id,
      categoryName: fallbackCategory.name,
      confidence: "default",
    };
  }

  return {
    categoryId: 1,
    categoryName: "General",
    confidence: "default",
  };
}

function findMatchingCategory(
  concept: string,
  categories: CategoryRow[],
  type: "income" | "expense",
): CategoryRow | undefined {
  const normConcept = concept.toLowerCase();

  // 1. Exact or startsWith match
  const exact = categories.find(
    (c) => c.type === type && c.name.toLowerCase() === normConcept,
  );
  if (exact) return exact;

  // 2. Partial containment match
  const partial = categories.find(
    (c) =>
      c.type === type &&
      (c.name.toLowerCase().includes(normConcept) || normConcept.includes(c.name.toLowerCase())),
  );
  if (partial) return partial;

  // 3. Concept keyword overlap
  if (normConcept.includes("food") || normConcept.includes("dining")) {
    const foodCat = categories.find(
      (c) => c.type === type && /food|dining|restaurant|eat/i.test(c.name),
    );
    if (foodCat) return foodCat;
  }

  if (normConcept.includes("groceries")) {
    const grocCat = categories.find(
      (c) => c.type === type && /grocer|supermarket|mart|supplies/i.test(c.name),
    );
    if (grocCat) return grocCat;
  }

  if (normConcept.includes("transport")) {
    const transCat = categories.find(
      (c) => c.type === type && /transport|travel|fuel|auto|transit/i.test(c.name),
    );
    if (transCat) return transCat;
  }

  if (normConcept.includes("shopping")) {
    const shopCat = categories.find(
      (c) => c.type === type && /shop|clothing|personal|retail/i.test(c.name),
    );
    if (shopCat) return shopCat;
  }

  if (normConcept.includes("utilit")) {
    const utilCat = categories.find(
      (c) => c.type === type && /utilit|bill|electricity|water|recharge/i.test(c.name),
    );
    if (utilCat) return utilCat;
  }

  return undefined;
}

/**
 * Remember merchant mappings for the family
 */
export async function saveLearnedMerchantMappings(
  familyId: number,
  mappings: { merchantPattern: string; categoryId: number }[],
) {
  if (!mappings || mappings.length === 0) return;

  for (const m of mappings) {
    const cleanPattern = m.merchantPattern.trim().toLowerCase().slice(0, 100);
    if (!cleanPattern || cleanPattern.length < 3) continue;

    await pool.query(
      `INSERT INTO merchant_category_mappings (family_id, merchant_pattern, category_id, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (family_id, merchant_pattern)
       DO UPDATE SET category_id = EXCLUDED.category_id, updated_at = NOW()`,
      [familyId, cleanPattern, m.categoryId],
    );
  }
}
