import React, { useEffect, useRef, useState } from 'react';
import { Camera, Download, Loader2, ShoppingCart, Upload } from 'lucide-react';
import { useCartState } from '../store/AppContext';
import ARTryOn from './ARTryOn';
import SkinAnalysisPanel from './SkinAnalysisPanel';

const API_URL = () =>
  import.meta.env.VITE_API_URL ||
  (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) ? 'http://localhost:5000' : '');

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const VRTryOn: React.FC = () => {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null);
  const [designPrompt, setDesignPrompt] = useState('');
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnNote, setTryOnNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { cartItems } = useCartState();
  const selectedCartItem = cartItems.find((item) => item.id === selectedCartItemId);
  const arColor = selectedCartItem?.tshirtColor || localStorage.getItem('tshirtColor') || '#111827';

  useEffect(() => {
    if (cartItems.length === 0) return;
    const latest = cartItems[cartItems.length - 1];
    const design =
      latest.frontDesign?.snapshotUrl ||
      latest.frontDesign?.imageUrl ||
      latest.backDesign?.snapshotUrl ||
      latest.backDesign?.imageUrl;
    const prompt = latest.frontDesign?.design || latest.backDesign?.design || 'Custom design';
    if (design) {
      setSelectedDesign(design);
      setDesignPrompt(prompt);
      setSelectedCartItemId(latest.id);
    }
  }, [cartItems]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUserPhoto(String(reader.result || ''));
      setTryOnResult(null);
      setTryOnNote(null);
      setError(null);
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
      setUserPhoto(dataUrl);
      setTryOnResult(null);
      setTryOnNote(null);
      setError(null);
    } catch {
      setError('Unable to access camera. Please upload a photo instead.');
    }
  };

  const generateVirtualTryOn = async () => {
    if (!userPhoto || !selectedDesign) {
      setError('Please upload your try-on photo and select a cart design first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base = API_URL();
      if (!base) throw new Error('Backend API URL is not configured');
      const response = await fetch(`${base}/api/perfect/clothes-tryon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: userPhoto,
          garmentImage: selectedDesign,
          apparelName: selectedCartItem?.apparelName || designPrompt || 'Custom apparel',
          garmentCategory: 'upper_body',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }
      setTryOnResult(result.resultImage || result.imageUrl || result.resultUrl);
      setTryOnNote(
        result.usedDemoFallback
          ? 'Demo mode is active. Set PERFECT_DEMO_MODE=false with valid credentials for live Perfect Corp output.'
          : 'Powered by Perfect Corp AI Clothes Try-On.',
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to generate virtual try-on.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Virtual Try-On</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload a full-body or torso photo and see yourself wearing your cart design with Perfect Corp.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
                {userPhoto ? (
                  <div className="space-y-3">
                    <img src={userPhoto} alt="Try-on person preview" className="mx-auto h-36 w-28 rounded-xl border border-gray-300 object-cover shadow-sm" />
                    <p className="text-sm text-gray-600">Try-on photo uploaded</p>
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
                          setUserPhoto(null);
                          setTryOnResult(null);
                          setTryOnNote(null);
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
                      <p className="text-lg font-medium text-gray-700">Upload Try-On Photo</p>
                      <p className="text-sm text-gray-500">Use TestPerson.png or a clear torso/full-body image.</p>
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

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ShoppingCart className="h-4 w-4" /> Select Design from Cart
                </h3>
                {cartItems.length > 0 ? (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {cartItems.map((item) => {
                      const design =
                        item.frontDesign?.snapshotUrl ||
                        item.frontDesign?.imageUrl ||
                        item.backDesign?.snapshotUrl ||
                        item.backDesign?.imageUrl;
                      const prompt = item.frontDesign?.design || item.backDesign?.design || 'Custom design';
                      const isSelected = selectedCartItemId === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`w-full rounded-lg border p-3 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                          onClick={() => {
                            if (!design) return;
                            setSelectedDesign(design);
                            setDesignPrompt(prompt);
                            setSelectedCartItemId(item.id);
                            setTryOnResult(null);
                            setTryOnNote(null);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {design && <img src={design} alt="Cart design" className="h-12 w-12 rounded border bg-white object-contain" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-700">{prompt}</p>
                              <p className="text-xs text-gray-500">{item.apparelName || 'Custom apparel'}</p>
                            </div>
                            {isSelected && <span className="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-100" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <ShoppingCart className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-500">No designs in cart yet</p>
                    <p className="mt-1 text-xs text-gray-400">Create and add a design to cart first.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={generateVirtualTryOn}
                disabled={!userPhoto || !selectedDesign || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-medium text-white transition-all hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Generating try-on...
                  </>
                ) : (
                  'Generate Virtual Try-On'
                )}
              </button>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50" style={{ aspectRatio: '3/4', minHeight: 400 }}>
                {tryOnResult ? (
                  <div className="relative h-full">
                    <img src={tryOnResult} alt="Virtual Try-On Result" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = tryOnResult;
                        link.download = `tryon-${Date.now()}.png`;
                        link.click();
                      }}
                      className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 shadow-lg transition-colors hover:bg-white"
                      title="Download"
                    >
                      <Download className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Camera className="mx-auto mb-3 h-16 w-16 opacity-40" />
                      <p className="font-medium">Try-On Result</p>
                      <p className="mt-1 text-sm">Upload photo and select a cart design to begin.</p>
                    </div>
                  </div>
                )}
              </div>

              {tryOnNote && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">{tryOnNote}</p>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 text-sm font-medium text-blue-800">Tips for best try-on results</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>- Use a clear torso/full-body photo with good lighting.</li>
                  <li>- Face the camera directly.</li>
                  <li>- Use a cart snapshot so Perfect Corp receives a real garment reference.</li>
                </ul>
              </div>
            </div>
          </div>

          <SkinAnalysisPanel />

          <div className="px-6 pb-8">
            <ARTryOn design={selectedDesign || undefined} tshirtColor={arColor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VRTryOn;
