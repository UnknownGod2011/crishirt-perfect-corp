import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Info,
  Loader2,
  Palette,
  Sparkles,
  Upload,
} from 'lucide-react';

interface SkinConcern {
  key: string;
  label: string;
  score: number | null;
}

interface ConsumerInsights {
  headline?: string;
  skinComment?: string;
  colorReason?: string;
  skincareSuggestion?: string;
  demoSummary?: string;
}

interface AppearanceAnalysis {
  skinToneHex: string | null;
  undertone: 'warm' | 'cool' | 'neutral';
  depth: 'light' | 'medium' | 'deep';
  recommendedColors: Array<{ hex: string; name: string }>;
  designTips: string[];
  consumerInsights?: ConsumerInsights;
  faceAttributes?: {
    hairColorHex?: string | null;
    eyeColorHex?: string | null;
  };
  skinInsights?: {
    concerns: SkinConcern[];
    analysisAvailable?: boolean;
    productRecommendations: Array<{ title: string; reason: string }>;
    note?: string;
  };
}

const API_URL = () =>
  import.meta.env.VITE_API_URL ||
  (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ? 'http://localhost:5000' : '');

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const concernCopy: Record<string, { headline: string; product: string; tip: string }> = {
  acne: {
    headline: 'Possible blemish-prone areas noticed',
    product: 'gentle non-comedogenic cleanser',
    tip: 'Consider a gentle, non-comedogenic skincare routine before try-on photos.',
  },
  pimples: {
    headline: 'Possible blemish-prone areas noticed',
    product: 'gentle non-comedogenic cleanser',
    tip: 'Consider a gentle, non-comedogenic skincare routine before try-on photos.',
  },
  oiliness: {
    headline: 'Possible shine or oiliness noticed',
    product: 'lightweight oil-control moisturizer',
    tip: 'A lightweight moisturizer can help keep the try-on photo looking clean.',
  },
  redness: {
    headline: 'Possible redness noticed',
    product: 'calming cosmetic primer',
    tip: 'A calming cosmetic product can help even the appearance before photos.',
  },
  pores: {
    headline: 'Visible pore texture noticed',
    product: 'gentle BHA exfoliant',
    tip: 'A gentle exfoliant can support a smoother photo-ready look.',
  },
  texture: {
    headline: 'Uneven texture noticed',
    product: 'hydrating serum',
    tip: 'Hydration and gentle exfoliation can improve the photo-ready finish.',
  },
  moisture: {
    headline: 'Skin may benefit from hydration',
    product: 'hyaluronic acid moisturizer',
    tip: 'A hydrating moisturizer can help skin look fresh before styling photos.',
  },
  spots: {
    headline: 'Some visible spots noticed',
    product: 'vitamin C serum',
    tip: 'A brightening cosmetic routine can be a natural retail suggestion.',
  },
  dark_circle: {
    headline: 'Some under-eye darkness noticed',
    product: 'caffeine eye serum',
    tip: 'A light eye product can help with a photo-ready look.',
  },
};

const friendlyPercent = (score: number | null) => {
  if (score === null) return null;
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(normalized)}%`;
};

const SkinAnalysisPanel: React.FC = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AppearanceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzePhoto = async (photoDataUrl: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const base = API_URL();
      if (!base) throw new Error('Backend API URL is not configured');
      const response = await fetch(`${base}/api/perfect/analyze-appearance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage: photoDataUrl }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Skin analysis failed');
      }
      setAnalysis(result.analysis);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Skin analysis failed. Please try a clearer close-up photo.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setPhoto(dataUrl);
      void analyzePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stream.getTracks().forEach((track) => track.stop());
      setPhoto(dataUrl);
      void analyzePhoto(dataUrl);
    } catch {
      setError('Unable to access camera. Please upload a close-up photo instead.');
    }
  };

  const concerns = analysis?.skinInsights?.concerns ?? [];
  const skinAvailable = analysis?.skinInsights?.analysisAvailable === true;
  const summary = analysis?.consumerInsights;

  return (
    <section className="border-t border-gray-100 bg-white px-6 py-8">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-800">Personalized Skin & Color Analysis</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Upload a clear close-up face photo to see which apparel colors suit your skin tone and get cosmetic retail suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
          {photo ? (
            <div className="space-y-3">
              <img src={photo} alt="Close-up face preview" className="mx-auto h-36 w-36 rounded-xl border border-gray-300 object-cover shadow-sm" />
              <p className="text-sm text-gray-600">Close-up photo uploaded</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  Replace Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setAnalysis(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">Upload Close-Up Face Photo</p>
                <p className="text-sm text-gray-500">Use the close-up person sample or a clear front-facing selfie.</p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700"
                >
                  <Camera className="h-4 w-4" /> Take Photo
                </button>
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Perfect Corp skin and face analysis...
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          {!analysis && !loading && (
            <div className="flex h-full min-h-72 items-center justify-center text-center text-gray-400">
              <div>
                <Palette className="mx-auto mb-3 h-12 w-12 opacity-40" />
                <p className="font-medium">Analysis Result</p>
                <p className="mt-1 text-sm">Your color palette and skin feedback will appear here.</p>
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Style summary</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-800">
                  {summary?.headline || `${analysis.depth} ${analysis.undertone} appearance profile`}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {summary?.colorReason || analysis.designTips[0] || 'Use strong contrast so the print stays readable.'}
                </p>
              </div>

              {analysis.skinToneHex && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-white shadow ring-1 ring-gray-200" style={{ backgroundColor: analysis.skinToneHex }} />
                  <div>
                    <p className="text-xs text-gray-500">Detected color signal</p>
                    <p className="text-sm font-medium capitalize text-gray-800">{analysis.depth} / {analysis.undertone}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <Palette className="h-3.5 w-3.5" /> Upperwear colors to try
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommendedColors.map((color) => (
                    <span key={color.hex} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                      <span className="h-3.5 w-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {skinAvailable && concerns.length === 0 && (
                  <div className="flex gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Your skin looks clear in this photo.</p>
                      <p className="mt-0.5 text-xs text-gray-600">{summary?.skinComment || 'Keep it photo-ready with gentle cleanser and SPF.'}</p>
                    </div>
                  </div>
                )}

                {concerns.map((concern) => {
                  const copy = concernCopy[concern.key] || concernCopy[concern.key.replace(/-/g, '_')];
                  if (!copy) return null;
                  const score = friendlyPercent(concern.score);
                  return (
                    <div key={concern.key} className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {copy.headline}{score ? ` (${score})` : ''}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">{summary?.skinComment || copy.tip}</p>
                        <p className="mt-1 text-xs font-medium text-purple-700">Retail suggestion: {summary?.skincareSuggestion || copy.product}</p>
                      </div>
                    </div>
                  );
                })}

                {!skinAvailable && (
                  <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Skin-specific results need a clearer close-up.</p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {analysis.skinInsights?.note || 'Color recommendations are still available from Perfect Corp appearance signals.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {analysis.designTips.slice(0, 3).map((tip) => (
                  <p key={tip} className="flex gap-1.5 text-xs text-gray-600">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                    {tip}
                  </p>
                ))}
              </div>

              <p className="text-[11px] italic text-gray-400">
                Cosmetic shopping suggestions only; not medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SkinAnalysisPanel;
