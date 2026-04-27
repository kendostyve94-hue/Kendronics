export interface GerberFile {
  id: string;
  userId: string;
  sanitizedFilename: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  status: 'pending_scan' | 'clean' | 'rejected' | 'quarantined' | 'deleted';
}
