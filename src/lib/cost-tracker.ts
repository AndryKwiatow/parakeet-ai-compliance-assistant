// Cost per 1K tokens (as of March 2024)
const MODEL_COSTS = {
  // GPT-4 Turbo
  'gpt-4-turbo-preview': {
    input: 0.01,   // $0.01 per 1K input tokens
    output: 0.03,  // $0.03 per 1K output tokens
  },
  // GPT-4
  'gpt-4': {
    input: 0.03,   // $0.03 per 1K input tokens
    output: 0.06,  // $0.06 per 1K output tokens
  },
  // GPT-3.5 Turbo
  'gpt-3.5-turbo': {
    input: 0.0005,  // $0.0005 per 1K input tokens
    output: 0.0015, // $0.0015 per 1K output tokens
  },
  // GPT-4 Vision
  'gpt-4-vision-preview': {
    input: 0.01,   // $0.01 per 1K input tokens (including image tokens)
    output: 0.03,  // $0.03 per 1K output tokens
  },
  'gpt-4.1-mini': {
    input: 0.00015,   // $0.00015 per 1K input tokens
    output: 0.0006,  // $0.0006 per 1K output tokens
  },
  // GPT-4o Mini
  'gpt-4o-mini': {
    input: 0.00015,   // $0.00015 per 1K input tokens
    output: 0.0006,  // $0.0006 per 1K output tokens
  },
  // GPT-4o 2024-11-20
  'gpt-4o-2024-11-20': {
    input: 0.00015,   // $0.00015 per 1K input tokens
    output: 0.0006,  // $0.0006 per 1K output tokens
  },
  // GPT-4 Turbo with Vision
  'gpt-4-turbo-vision-preview': {
    input: 0.01,   // $0.01 per 1K input tokens
    output: 0.03,  // $0.03 per 1K output tokens
  },
  // GPT-4 32K
  'gpt-4-32k': {
    input: 0.06,   // $0.06 per 1K input tokens
    output: 0.12,  // $0.12 per 1K output tokens
  },
  // GPT-3.5 Turbo 16K
  'gpt-3.5-turbo-16k': {
    input: 0.001,  // $0.001 per 1K input tokens
    output: 0.002, // $0.002 per 1K output tokens
  },
  // GPT-3.5 Turbo 4K
  'gpt-3.5-turbo-4k': {
    input: 0.0005,  // $0.0005 per 1K input tokens
    output: 0.0015, // $0.0015 per 1K output tokens
  },
  // GPT-3.5 Turbo Instruct
  'gpt-3.5-turbo-instruct': {
    input: 0.0015,  // $0.0015 per 1K input tokens
    output: 0.002,  // $0.002 per 1K output tokens
  },
  // DALL-E 3
  'dall-e-3': {
    input: 0.04,   // $0.04 per image (1024x1024)
    output: 0,     // No output tokens
  },
  // DALL-E 2
  'dall-e-2': {
    input: 0.02,   // $0.02 per image (1024x1024)
    output: 0,     // No output tokens
  },
  // Whisper
  'whisper-1': {
    input: 0.006,  // $0.006 per minute
    output: 0,     // No output tokens
  },
  // Embeddings
  'text-embedding-3-small': {
    input: 0.00002, // $0.00002 per 1K tokens
    output: 0,      // No output tokens
  },
  'text-embedding-3-large': {
    input: 0.00013, // $0.00013 per 1K tokens
    output: 0,      // No output tokens
  },
  'text-embedding-ada-002': {
    input: 0.0001,  // $0.0001 per 1K tokens
    output: 0,      // No output tokens
  }
} as const;

export type ModelType = 'gpt-4-turbo-preview' | 'gpt-4-vision-preview';

export type OperationType = 'chat' | 'supplier-risk' | 'upload';

interface ModelCosts {
  input: number;
  output: number;
}

interface CostEntry {
  model: ModelType;
  operation: OperationType;
  cost: number;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
}

class CostTracker {
  private static instance: CostTracker;
  private costs: CostEntry[] = [];
  private totalCost: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedCosts = localStorage.getItem('ai-costs');
      if (savedCosts) {
        const { costs, totalCost } = JSON.parse(savedCosts);
        this.costs = costs;
        this.totalCost = totalCost;
      }
    }
  }

  public static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  public trackCost(model: ModelType, inputTokens: number, outputTokens: number, operation: OperationType): number {
    const modelCosts = MODEL_COSTS[model];
    if (!modelCosts) {
      throw new Error(`Unknown model: ${model}`);
    }

    const cost = (inputTokens * modelCosts.input / 1000) + (outputTokens * modelCosts.output / 1000);
    const entry: CostEntry = {
      model,
      operation,
      cost,
      timestamp: Date.now(),
      inputTokens,
      outputTokens,
    };

    this.costs.push(entry);
    this.totalCost += cost;

    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-costs', JSON.stringify({
        costs: this.costs,
        totalCost: this.totalCost,
      }));
    }

    return cost;
  }

  public resetCosts(): void {
    this.costs = [];
    this.totalCost = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ai-costs');
    }
  }

  public getRecentCosts(limit: number): CostEntry[] {
    return this.costs.slice(-limit);
  }

  public getTotalCost(): number {
    return this.totalCost;
  }

  public getCostsByModel(): Record<ModelType, number> {
    return this.costs.reduce((acc, entry) => {
      acc[entry.model] = (acc[entry.model] || 0) + entry.cost;
      return acc;
    }, {} as Record<ModelType, number>);
  }

  public getCostsByOperation(): Record<CostEntry['operation'], number> {
    return this.costs.reduce((acc, entry) => {
      acc[entry.operation] = (acc[entry.operation] || 0) + entry.cost;
      return acc;
    }, {} as Record<CostEntry['operation'], number>);
  }
}

export const costTracker = CostTracker.getInstance(); 