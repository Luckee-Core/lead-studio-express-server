/**
 * Business Coach Fact Categories
 * Single source of truth for all category definitions
 * 
 * Used in:
 * - Category extraction (when sending messages)
 * - Fact extraction (when categorizing facts)
 * - TypeScript types
 * - Database schema
 */

export const FACT_CATEGORIES = {
  finance: {
    name: 'finance',
    description: 'Revenue, pricing, profit margins, costs, monetization, funding, investors, financial metrics, burn rate, runway',
  },
  operations: {
    name: 'operations',
    description: 'Processes, workflows, business operations, efficiency, systems, infrastructure, operational metrics',
  },
  sales: {
    name: 'sales',
    description: 'Sales strategy, sales process, sales targets, sales team, pipeline, conversion rates, sales channels',
  },
  marketing: {
    name: 'marketing',
    description: 'Marketing strategy, campaigns, brand, positioning, marketing channels, customer acquisition, growth tactics',
  },
  product: {
    name: 'product',
    description: 'Product features, roadmap, launches, product strategy, product development, user experience, technical capabilities',
  },
  strategy: {
    name: 'strategy',
    description: 'Business strategy, competitive analysis, market position, differentiation, strategic planning, vision, positioning',
  },
  people: {
    name: 'people',
    description: 'Team size, roles, hiring, organizational structure, team members, HR, culture, talent, compensation',
  },
  legal: {
    name: 'legal',
    description: 'Partnerships, contracts, legal matters, compliance, intellectual property, terms, agreements',
  },
  goals: {
    name: 'goals',
    description: 'Objectives, targets, deadlines, priorities, milestones, KPIs, success metrics, outcomes',
  },
  identity: {
    name: 'identity',
    description: 'Personal info, role, title, background, expertise, founder story, personal context',
  },
  company: {
    name: 'company',
    description: 'Company name, mission, vision, industry, stage, business model, company basics',
  },
  competition: {
    name: 'competition',
    description: 'Competitors, competitive landscape, market dynamics, competitive threats, alternatives',
  },
  metrics: {
    name: 'metrics',
    description: 'KPIs, performance indicators, analytics, data, measurements, tracking',
  },
} as const;

export type FactCategoryName = keyof typeof FACT_CATEGORIES;

export const FACT_CATEGORY_NAMES = Object.keys(FACT_CATEGORIES) as FactCategoryName[];

/**
 * Get formatted category list for prompts
 * 
 * Returns a formatted string listing all categories with their descriptions
 * for use in LLM prompts.
 * 
 * @returns Formatted string with numbered category list
 * 
 * @example
 * const categoryList = getCategoryListForPrompt();
 * // Returns: "1. **finance** - Revenue, pricing, profit margins...\n2. **operations** - ..."
 */
export const getCategoryListForPrompt = (): string => {
  return Object.entries(FACT_CATEGORIES)
    .map(([key, { description }], index) => 
      `${index + 1}. **${key}** - ${description}`
    )
    .join('\n');
};

/**
 * Validate that category names are valid
 * 
 * @param categories - Array of category names to validate
 * @returns Array of valid category names only
 */
export const validateCategories = (categories: string[]): FactCategoryName[] => {
  return categories.filter((cat): cat is FactCategoryName => 
    FACT_CATEGORY_NAMES.includes(cat as FactCategoryName)
  );
};
