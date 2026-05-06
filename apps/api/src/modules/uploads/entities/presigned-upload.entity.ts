import { GerberAnalysisResult } from './gerber-analysis.entity';

export interface PresignedUpload {
  uploadId: string;
  storageKey: string;
  uploadUrl: string;
  expiresAt: Date;
  status: 'pending_scan' | 'uploaded';
  analysis?: GerberAnalysisResult;
}
