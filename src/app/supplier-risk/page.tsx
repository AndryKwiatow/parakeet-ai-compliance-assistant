'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Building2 } from 'lucide-react';
import { useChat } from 'ai/react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Bot, User, Sparkles, Shield, AlertTriangle } from 'lucide-react';

const suggestedQuestions = [
  "What are the top 3 suppliers with the highest risk scores?",
  "Show me all suppliers in the healthcare industry",
  "Which suppliers have financial compliance risks?",
  "What's the average risk score for suppliers in the technology industry?",
  "List suppliers with risk scores above 7",
  "Show me suppliers in California with cybersecurity risks"
];

interface WelcomeMessageProps {
  onSuggestionClick: (question: string) => void;
}

function WelcomeMessage({ onSuggestionClick }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
      <div className="bg-primary/5 p-6 rounded-full">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Welcome to Supplier Risk Search</h2>
        <p className="text-muted-foreground max-w-md">
          I can help you analyze and monitor supplier risks. Click on any of the suggested questions below or type your own query to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
        {suggestedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start text-left h-auto min-h-[3.5rem] py-2 px-3 hover:bg-primary/5 group w-full overflow-hidden"
            onClick={() => onSuggestionClick(question)}
          >
            <div className="flex items-start gap-3 w-full min-w-0">
              <div className="bg-primary/5 p-2 rounded-full group-hover:bg-primary/10 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-left break-words whitespace-normal overflow-hidden text-ellipsis line-clamp-2">
                {question}
              </span>
            </div>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md w-full mt-4">
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm">10+ Industries</span>
        </div>
        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm">8 Risk Categories</span>
        </div>
      </div>
    </div>
  );
}

export default function SupplierRiskPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/supplier-risk/chat',
    onFinish: (message) => {
      console.log('Chat stream finished, processing message:', message);
      if (message.content.includes('<cost-info>')) {
        const [content, costInfoStr] = message.content.split('<cost-info>');
        try {
          const costInfo = JSON.parse(costInfoStr);
          console.log('Extracted cost info:', costInfo);
          const event = new CustomEvent('costUpdate', {
            detail: costInfo
          });
          window.dispatchEvent(event);
          message.content = content.trim();
        } catch (e) {
          console.error('Error parsing cost info:', e);
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  useEffect(() => {
    const handleCostUpdate = (event: CustomEvent) => {
      console.log('Cost update received:', event.detail);
    };

    window.addEventListener('costUpdate', handleCostUpdate as EventListener);
    return () => {
      window.removeEventListener('costUpdate', handleCostUpdate as EventListener);
    };
  }, []);

  const handleSuggestionClick = async (question: string) => {
    try {
      await append({
        role: 'user',
        content: question,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const displayMessages = messages.map(message => ({
    ...message,
    content: message.content.split('<cost-info>')[0].trim()
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Supplier Risk Search</h1>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {displayMessages.length === 0 ? (
            <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="p-4 space-y-4">
              {displayMessages.map((message, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 ${
                    message.role === 'assistant' 
                      ? 'bg-muted/50 ml-auto flex-row-reverse' 
                      : ''
                  } p-4 rounded-lg max-w-[80%] ${message.role === 'assistant' ? 'ml-auto' : 'mr-auto'}`}
                >
                  <Avatar className="w-8 h-8">
                    {message.role === 'assistant' ? (
                      <Bot className="w-6 h-6" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </Avatar>
                  <div className={`flex-1 space-y-2 ${message.role === 'assistant' ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium">
                      {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about supplier risks..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
} 