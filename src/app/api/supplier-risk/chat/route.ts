import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { costTracker } from '@/lib/cost-tracker';
import { ChatMessage } from '@/types/chat';
import { suppliers } from '@/data/suppliers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
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

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;

        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
              outputTokens += Math.ceil(content.length / 4);
            }
            if (chunk.usage?.prompt_tokens) {
              inputTokens = chunk.usage.prompt_tokens;
            }
          }

          try {
            costTracker.trackCost(model, inputTokens, outputTokens, 'supplier-risk');
            window.dispatchEvent(new Event('costUpdate'));
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error tracking costs:', errorMessage);
          }

          controller.close();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Error in stream processing:', errorMessage);
          controller.error(errorMessage);
        }
      },
    });

    return new NextResponse(customReadable);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in supplier risk chat route:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 