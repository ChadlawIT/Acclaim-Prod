export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
export const MAX_FILE_SIZE_MB = 25;

export const ACCEPTED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.heic', '.heif',
  '.xls', '.xlsx', '.csv',
  '.zip', '.rar',
  '.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.3gp', '.3gpp',
  '.eml', '.msg'
];

export const ACCEPTED_FILE_TYPES_STRING = ACCEPTED_FILE_EXTENSIONS.join(',');

export const ACCEPTED_FILE_TYPES_DISPLAY = 'PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, HEIC, XLS, XLSX, CSV, ZIP, RAR, MP4, MOV, AVI, WEBM, MKV, M4V, 3GP, EML, MSG';

export interface FileValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    const extension = fileName.split('.').pop() || 'unknown';
    return {
      isValid: false,
      error: `File type ".${extension}" is not allowed. Supported formats: ${ACCEPTED_FILE_TYPES_DISPLAY}`
    };
  }

  return { isValid: true, error: null };
}

export function validateFiles(files: File[]): FileValidationResult {
  for (const file of files) {
    const result = validateFile(file);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, error: null };
}

/**
 * If only one file is provided, returns it as-is.
 * If multiple files are provided, zips them into a single "attachments.zip" File.
 * Returns null if the array is empty.
 */
export async function zipFilesForAttachment(files: File[]): Promise<File | null> {
  if (files.length === 0) return null;
  if (files.length === 1) return files[0];

  const fflateMod = await import('fflate');
  const fflate = (fflateMod as any).default ?? fflateMod;

  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    const buf = await file.arrayBuffer();
    // De-duplicate names
    let name = file.name;
    let n = 1;
    while (name in entries) {
      const parts = file.name.split('.');
      const ext = parts.pop();
      name = `${parts.join('.')} (${n}).${ext}`;
      n++;
    }
    entries[name] = new Uint8Array(buf);
  }

  const zipped = fflate.zipSync(entries);
  const blob = new Blob([zipped], { type: 'application/zip' });
  return new File([blob], 'attachments.zip', { type: 'application/zip' });
}
