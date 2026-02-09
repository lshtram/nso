import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'pipeline_status.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if file exists using access to avoid race conditions with readFile
    await fs.access(STATUS_FILE);
    const content = await fs.readFile(STATUS_FILE, 'utf8');
    const data = JSON.parse(content);
    
    return new NextResponse(JSON.stringify({
      ...data,
      _poll_ts: Date.now() // Prevents identical result caching
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    return NextResponse.json({ 
      message: "Synchronizing intelligence streams...", 
      isComplete: false 
    });
  }
}
