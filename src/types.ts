export interface MediaAsset {
  data: string; // base64
  mimeType: string;
  previewUrl: string;
}

export interface VideoGenConfig {
  prompt: string;
  image: MediaAsset | null;
  lastFrame: MediaAsset | null;
  referenceImages: MediaAsset[];
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: '16:9' | '9:16';
  modelType: 'normal' | 'fast';
}

export interface GenerationStatus {
  step: 'idle' | 'starting' | 'polling' | 'downloading' | 'completed' | 'error';
  operationName?: string;
  error?: string;
  progress?: number;
  videoUrl?: string;
}
