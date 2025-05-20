import { readFile } from 'fs/promises';
import { parse } from 'yaml';

export async function loadTables() {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BASE_URL 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/config`);
    if (!response.ok) {
      throw new Error('Failed to load configuration');
    }
    const config = await response.json();
    return config.tables;
  } catch (error) {
    console.error('Error loading tables config:', error);
    throw error;
  }
} 