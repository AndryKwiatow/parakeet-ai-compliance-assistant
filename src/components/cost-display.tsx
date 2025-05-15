'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, RefreshCw, BarChart2, Clock, FileText, Image, MessageSquare, Shield, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { costTracker, type ModelType } from '@/lib/cost-tracker';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type OperationType = 'chat' | 'image' | 'pdf' | 'supplier-risk';

interface CostEntry {
  model: ModelType;
  operation: OperationType;
  cost: number;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
}

const OPERATION_ICONS: Record<OperationType, React.ReactNode> = {
  chat: <MessageSquare className="h-3 w-3" />,
  // eslint-disable-next-line jsx-a11y/alt-text
  image: <Image className="h-3 w-3" />,
  pdf: <FileText className="h-3 w-3" />,
  'supplier-risk': <Building2 className="h-3 w-3" />,
};

const OPERATION_LABELS: Record<OperationType, string> = {
  chat: 'Compliance Chat',
  image: 'Image Analysis',
  pdf: 'PDF Processing',
  'supplier-risk': 'Supplier Risk Analysis',
};

interface ContextInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const CONTEXT_INFO: Record<string, ContextInfo> = {
  '/': {
    icon: <Shield className="h-4 w-4" />,
    title: 'Compliance Assistant',
    description: 'PII Detection & Document Analysis',
  },
  '/supplier-risk': {
    icon: <Building2 className="h-4 w-4" />,
    title: 'Supplier Risk Analysis',
    description: 'Risk Assessment & Monitoring',
  },
};

export function CostDisplay() {
  const pathname = usePathname();
  const [totalCost, setTotalCost] = useState(0);
  const [costsByModel, setCostsByModel] = useState<Record<ModelType, number>>({} as Record<ModelType, number>);
  const [costsByOperation, setCostsByOperation] = useState<Record<OperationType, number>>({
    chat: 0,
    image: 0,
    pdf: 0,
    'supplier-risk': 0,
  });
  const [recentCosts, setRecentCosts] = useState<CostEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(true );
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const context = CONTEXT_INFO[pathname] || CONTEXT_INFO['/'];

  const updateCosts = useCallback(() => {
    const currentCosts = costTracker.getRecentCosts(50) as CostEntry[];
    const newTotalCost = costTracker.getTotalCost();
    const newCostsByModel = costTracker.getCostsByModel();
    

    setTotalCost(newTotalCost);
    setCostsByModel(newCostsByModel);
    setRecentCosts(currentCosts);
    setLastUpdate(Date.now());
    

    const operationCosts = currentCosts.reduce((acc, entry) => {
      const operation = entry.operation as OperationType;
      acc[operation] = (acc[operation] || 0) + entry.cost;
      return acc;
    }, {} as Record<OperationType, number>);
    setCostsByOperation(operationCosts);
  }, []);


  useEffect(() => {
    updateCosts();
  }, [updateCosts]);


  useEffect(() => {
    const handleCostUpdate = () => {

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      

      updateTimeoutRef.current = setTimeout(() => {
        updateCosts();
      }, 100);
    };

    window.addEventListener('costUpdate', handleCostUpdate);
    

    const handleFocus = () => {
      updateCosts();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('costUpdate', handleCostUpdate);
      window.removeEventListener('focus', handleFocus);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateCosts]);

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTokens = (tokens: number) => {
    return new Intl.NumberFormat('en-US').format(tokens);
  };


  const getContextOperations = () => {
    if (pathname === '/supplier-risk') {
      return ['supplier-risk'];
    }
    return ['chat', 'image', 'pdf'];
  };

  const contextOperations = getContextOperations();

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-0 transition-all duration-300 ease-in-out",
        isHidden ? "translate-x-[calc(100%-2rem)]" : "translate-x-0"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsHidden(!isHidden)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full h-8 w-8 bg-background border rounded-l-md shadow-md hover:bg-muted"
      >
        {isHidden ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      <Card className="w-96 shadow-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {context.icon}
              <div>
                <h3 className="font-semibold text-sm">{context.title}</h3>
                <p className="text-xs text-muted-foreground">{context.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  costTracker.resetCosts();
                  updateCosts();
                }}
                className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{formatCost(totalCost)}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {isExpanded && (
          <ScrollArea className="h-96">
            <div className="p-4 space-y-6">
              {/* Costs by Operation (Context-specific) */}
              <div>
                <h4 className="text-sm font-medium mb-2">Costs by Operation</h4>
                <div className="space-y-2">
                  {Object.entries(costsByOperation)
                    .filter(([operation]) => contextOperations.includes(operation as OperationType))
                    .map(([operation, cost]) => (
                      <div key={operation} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {OPERATION_ICONS[operation as OperationType]}
                          <span className="text-muted-foreground">
                            {OPERATION_LABELS[operation as OperationType]}
                          </span>
                        </div>
                        <span className="font-medium">{formatCost(cost)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Costs by Model */}
              <div>
                <h4 className="text-sm font-medium mb-2">Costs by Model</h4>
                <div className="space-y-2">
                  {Object.entries(costsByModel).map(([model, cost]) => (
                    <div key={model} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{model}</span>
                      <span className="font-medium">{formatCost(cost)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Operations (Context-specific) */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Operations</h4>
                <div className="space-y-3">
                  {recentCosts
                    .filter(entry => contextOperations.includes(entry.operation as OperationType))
                    .map((entry, index) => (
                      <div key={index} className="text-sm border-b pb-2 last:border-0">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {OPERATION_ICONS[entry.operation as OperationType]}
                          <span className="text-muted-foreground">
                            {entry.model} ({OPERATION_LABELS[entry.operation as OperationType]})
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTokens(entry.inputTokens)} in / {formatTokens(entry.outputTokens)} out tokens
                          </span>
                          <span className="font-medium">{formatCost(entry.cost)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
} 