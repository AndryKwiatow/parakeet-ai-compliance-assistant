import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_FILES_DIR = path.join(process.cwd(), 'public', 'test-files');

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const allowedFiles = ['health_report.png', 'bank_form.pdf', 'passport.jpg'];
    
    if (!allowedFiles.includes(filename)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filePath = path.join(TEST_FILES_DIR, filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    
    const contentType = {
      'png': 'image/png',
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
    }[filename.split('.').pop() || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving test file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 