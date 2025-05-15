import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { costTracker } from '@/lib/cost-tracker';
import { ChatMessage } from '@/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CostInfo {
  timestamp: number;
  cost: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  operation: string;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    const model = 'gpt-4-turbo-preview';

    console.log('Chat API: Processing request with messages:', messages.length);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful compliance assistant that specializes in PII (Personally Identifiable Information) detection and data privacy. 
          Your role is to help users identify and handle sensitive information in their documents.
          When discussing PII findings, be clear and professional, but avoid displaying the actual PII values in your responses.
          Instead, refer to them by type (e.g., "email address", "phone number") and provide guidance on how to handle them appropriately.`,
        },
        ...messages,
      ],
      stream: true,
    });

    let completionText = '';
    let costInfo: CostInfo | null = null;
    let streamController: TransformStreamDefaultController | null = null;

    const stream = OpenAIStream(response as any, {
      onToken: (token) => {
        completionText += token;
      },
      onCompletion: async (completion: string) => {
        try {
          const inputTokens = messages.reduce((acc: number, msg: ChatMessage) => {
            const content = msg.content || '';
            return acc + Math.ceil(content.length / 4);
          }, 0);

          const outputTokens = Math.ceil(completion.length / 4);
          
          console.log('Chat API: Tracking costs:', {
            model,
            inputTokens,
            outputTokens,
            operation: 'chat'
          });
          
          const cost = costTracker.trackCost(model, inputTokens, outputTokens, 'chat');
          
          console.log('Chat API: Current costs:', {
            totalCost: costTracker.getTotalCost(),
            recentCosts: costTracker.getRecentCosts(5)
          });

          costInfo = {
            timestamp: Date.now(),
            cost,
            model,
            inputTokens,
            outputTokens,
            operation: 'chat'
          };

          if (streamController) {
            const costChunk = new TextEncoder().encode(
              `data: ${JSON.stringify({ type: 'cost', data: costInfo })}\n\n`
            );
            streamController.enqueue(costChunk);
          }
        } catch (error) {
          console.error('Error tracking costs:', error);
        }
      },
    });

    const customStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      start(controller) {
        streamController = controller;
      }
    });

    return new StreamingTextResponse(stream.pipeThrough(customStream));
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 