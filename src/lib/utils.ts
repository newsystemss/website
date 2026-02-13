import fs from 'node:fs';
import path from 'node:path';

/**
 * Read a content file from the vault root (editable via Obsidian)
 */
export function readContentFile(filename: string): string {
  const filePath = path.join(process.cwd(), filename);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading content file: ${filename}`, error);
    return '';
  }
}
