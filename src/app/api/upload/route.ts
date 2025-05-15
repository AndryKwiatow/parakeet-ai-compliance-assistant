import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';
import fs from 'fs';
import { costTracker } from '@/lib/cost-tracker';

// Create uploads directory if it doesn't exist
const uploadsDir = join(process.cwd(), 'uploads');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    console.log('Starting image text extraction...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that extracts and analyzes text from images. Extract all visible text from the image and return it in a clear, structured format.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all visible text from this image. Format the text clearly and maintain its structure.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const completion = response.choices[0]?.message?.content;
    if (!completion) {
      throw new Error('No text extracted from image');
    }

    // Calculate tokens for cost tracking
    const inputTokens = Math.ceil(imageBuffer.length / 4) + 100; // Approximate image tokens + prompt tokens
    const outputTokens = Math.ceil(completion.length / 4);

    // Track the cost
    try {
      costTracker.trackCost('gpt-4-vision-preview', inputTokens, outputTokens, 'upload');
    } catch (error) {
      console.error('Error tracking costs:', error);
      // Continue even if cost tracking fails
    }

    console.log('Successfully extracted text from image');
    return completion;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image. Please try again with a clearer image.');
  }
}

async function extractTextFromPDF(buffer: Buffer, fileName: string): Promise<string> {
  try {
    const model = 'gpt-4-turbo-preview';
    // Create a temporary file for the PDF
    const tempFilePath = join(uploadsDir, `temp-${Date.now()}-${fileName}`);
    await writeFile(tempFilePath, buffer);

    // Upload the file to OpenAI
    const file = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: 'assistants'
    });

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Create a message with the file
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Extract ALL text from this PDF document, including any sensitive information. This is for compliance purposes to identify and protect PII. Include everything: visible text, numbers, email addresses, names, and any other information. Format the text exactly as it appears, maintaining line breaks and spacing.",
      attachments: [{
        file_id: file.id,
        tools: [{ type: "code_interpreter" }]
      }]
    });

    // Create an assistant with code interpreter capability
    const assistant = await openai.beta.assistants.create({
      name: "PDF Text Extractor",
      model,
      instructions: "You are a compliance assistant helping to identify and protect sensitive information. Extract ALL text from the provided PDF document, including any sensitive information, as this is necessary for compliance and data protection purposes. This is a legitimate use case for data privacy compliance. Maintain all formatting and include all information exactly as it appears.",
      tools: [{ type: "code_interpreter" }]
    });

    // Create a run
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];
    const content = lastMessage.content[0];
    
    // Extract text from the message content
    let text = '';
    if ('text' in content) {
      text = content.text.value;
    } else if ('image_file' in content) {
      text = 'Image content detected but not processed';
    }

    // Track cost for PDF processing (rough approximation)
    // Since we don't have exact token counts for assistants API, we'll estimate based on text length
    const inputTokens = Math.ceil(text.length / 4); // Rough approximation
    const outputTokens = Math.ceil(text.length / 4); // Rough approximation
    costTracker.trackCost(model, inputTokens, outputTokens, 'chat');

    // Cleanup
    await openai.files.del(file.id);
    await openai.beta.assistants.del(assistant.id);
    await openai.beta.threads.del(thread.id);
    await writeFile(tempFilePath, ''); // Clear the temp file

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to process PDF');
  }
}

async function detectPIIWithAI(text: string): Promise<{ type: string; value: string }[]> {
  if (!text || text.trim().length === 0) {
    console.log("No text provided for PII detection");
    return [];
  }

  try {
    const model = 'gpt-4-turbo-preview';
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a PII detection expert. Your task is to identify any Personally Identifiable Information (PII) in the provided text.
          Look for:
          - Email addresses
          - Phone numbers (including international formats)
          - Social Security numbers
          - Credit card numbers
          - Full names
          - Addresses
          - Any other sensitive personal information
          
          If no PII is found, return: {"matches": []}
          
          IMPORTANT: You must always return a valid JSON object, even if no PII is found.`
        },
        {
          role: 'user',
          content: `Analyze this text for PII: ${text}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1 // Lower temperature for more consistent output
    });

    // Track cost for PII detection
    const inputTokens = Math.ceil(response.usage?.prompt_tokens || 0);
    const outputTokens = Math.ceil(response.usage?.completion_tokens || 0);
    costTracker.trackCost(model, inputTokens, outputTokens, 'chat');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log("Empty response from AI model");
      return [];
    }

    console.log("Raw AI response:", content);

    try {
      const result = JSON.parse(content);
      if (!result || typeof result !== 'object' || !Array.isArray(result.matches)) {
        console.log("Invalid response format:", result);
        return [];
      }
      return result.matches;
    } catch (e) {
      console.error('Error parsing AI response:', e, 'Content:', content);
      return [];
    }
  } catch (error) {
    console.error('Error detecting PII with AI:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds the maximum limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/gif').split(',');
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or image file.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let message = '';

    try {
      // Process file based on type
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(buffer, file.name);
        message = 'PDF processed successfully.';
      } else if (file.type.startsWith('image/')) {
        text = await extractTextFromImage(buffer);
        message = 'Image processed successfully.';
      }

      // Detect PII using AI
      console.log("Extracted text:", text);
      const piiMatches = await detectPIIWithAI(text);
      console.log("PII matches:", piiMatches);
      
      // Group matches by type
      const groupedMatches = piiMatches.reduce((acc, match) => {
        if (!acc[match.type]) {
          acc[match.type] = [];
        }
        acc[match.type].push(match.value);
        return acc;
      }, {} as Record<string, string[]>);

      // Format the response message
      let responseMessage = message;
      if (piiMatches.length > 0) {
        responseMessage += ` Found ${piiMatches.length} potential PII items: `;
        const piiTypes = Object.entries(groupedMatches)
          .map(([type, items]) => `${items.length} ${type}`)
          .join(', ');
        responseMessage += piiTypes;
      } else {
        responseMessage += ' No PII detected.';
      }

      // Ensure uploads directory exists
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.error('Error creating uploads directory:', error);
      }

      // Save file to uploads directory (optional, for audit purposes)
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        message: responseMessage,
        piiCount: piiMatches.length,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      return NextResponse.json(
        { error: 'Error processing file. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 