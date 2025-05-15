import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { costTracker } from '@/lib/cost-tracker';
import { ChatMessage } from '@/types/chat';
import { suppliers } from '@/data/suppliers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    const model = 'gpt-4-turbo-preview';

    console.log('Supplier Risk API: Processing request with messages:', messages.length);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a supplier risk analysis assistant. You have access to a database of suppliers with their risk scores, industries, and risk categories.
          When responding to queries:
          1. Be clear and professional
          2. Format supplier information in a structured way
          3. Include risk scores and categories when relevant
          4. Calculate averages or statistics when requested
          5. Provide insights about risk patterns
          
          Available suppliers data: ${JSON.stringify(suppliers)}`,
        },
        ...messages,
      ],
      stream: true,
    });

    let finalCompletion = '';

    const stream = OpenAIStream(response as any, {
      onToken: (token) => {
        finalCompletion += token;
      },
      onCompletion: async (completion: string) => {
        console.log('Supplier Risk API: Completion received:', completion);
        try {
          const inputTokens = messages.reduce((acc: number, msg: ChatMessage) => {
            const content = msg.content || '';
            return acc + Math.ceil(content.length / 4);
          }, 0);

          const outputTokens = Math.ceil(completion.length / 4);
          
          console.log('Supplier Risk API: Tracking costs:', {
            model,
            inputTokens,
            outputTokens,
            operation: 'supplier-risk'
          });
          
          const cost = costTracker.trackCost(model, inputTokens, outputTokens, 'supplier-risk');

          const costInfo = {
            timestamp: Date.now(),
            cost,
            model,
            inputTokens,
            outputTokens,
            operation: 'supplier-risk'
          };

          finalCompletion = `${completion}\n\n<cost-info>${JSON.stringify(costInfo)}</cost-info>`;
          console.log('Supplier Risk API: Final message with cost info:', finalCompletion);
        } catch (error) {
          console.error('Error tracking costs:', error);
          finalCompletion = completion;
        }
      },
    });

    const customStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush(controller) {
        if (finalCompletion) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', data: finalCompletion })}\n\n`));
        }
      }
    });

    return new StreamingTextResponse(stream.pipeThrough(customStream));
  } catch (error) {
    console.error('Error in supplier risk chat route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 