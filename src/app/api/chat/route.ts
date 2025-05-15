import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { costTracker } from '@/lib/cost-tracker';
import { ChatMessage } from '@/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    const model = 'gpt-4-turbo-preview';

    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
    });

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        let inputTokens = 0;
        let outputTokens = 0;

        try {
          for await (const chunk of stream) {
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
            costTracker.trackCost(model, inputTokens, outputTokens, 'chat');
            window.dispatchEvent(new Event('costUpdate'));
          } catch (error) {
            console.error('Error tracking costs:', error);
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
    console.error('Error in chat route:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 