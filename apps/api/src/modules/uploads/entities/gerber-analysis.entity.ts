export interface GerberAnalysisResult {
  widthMm?: number;
  heightMm?: number;
  detectedLayers?: number;
  holesCount: number;
  hasSlots: boolean;
  boardAreaCm2?: number;
  complexity: 'low' | 'medium' | 'high' | 'unknown';
  parserConfidence: number;
  units?: 'mm' | 'inch';
  outlineSource?: string;
  copperLayerFiles: string[];
  drillFiles: string[];
  warnings: string[];
  rawSummary: Record<string, unknown>;
}
