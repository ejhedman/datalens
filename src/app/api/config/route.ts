import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { parse } from 'yaml';

export async function GET() {
  try {
    const filePath = process.env.NODE_ENV === 'production'
      ? '/app/config/tables.yaml'
      : './src/config/tables.yaml';
    
    const fileContents = await readFile(filePath, 'utf-8');
    const config = parse(fileContents);
    return NextResponse.json({ tables: config });
  } catch (error) {
    console.error('Error loading tables config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
} 