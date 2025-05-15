import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const testFilesDir = join(process.cwd(), 'test-files');
    const filePath = join(testFilesDir, params.filename);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading test file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 