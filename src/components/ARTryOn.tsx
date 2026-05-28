import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Download } from 'lucide-react';

interface ARTryOnProps {
  design?: string;
  tshirtColor: string;
}

// Approximate chest region as fraction of frame
const CHEST = { xFrac: 0.22, yFrac: 0.38, wFrac: 0.56, hFrac: 0.38 };

const ARTryOn: React.FC<ARTryOnProps> = ({ design, tshirtColor }) => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const designImg = useRef<HTMLImageElement | null>(null);

  const [isActive, setIsActive]   = useState(false);
  const [stream,   setStream]     = useState<MediaStream | null>(null);
  const [error,    setError]      = useState<string | null>(null);
  const [snapshot, setSnapshot]   = useState<string | null>(null);

  // Pre-load design image whenever it changes
  useEffect(() => {
    if (!design) { designImg.current = null; return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { designImg.current = img; };
    img.src = design;
  }, [design]);

  // Draw loop
  const draw = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(draw); return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    // Mirror the video (selfie feel)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Chest overlay
    const cx = canvas.width  * CHEST.xFrac;
    const cy = canvas.height * CHEST.yFrac;
    const cw = canvas.width  * CHEST.wFrac;
    const ch = canvas.height * CHEST.hFrac;

    // Garment colour tint
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle   = tshirtColor;
    // Rounded rect approximation
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 12);
    ctx.fill();
    ctx.restore();

    // Design graphic centred in chest
    if (designImg.current) {
      const pad    = cw * 0.15;
      const dSize  = Math.min(cw - pad * 2, ch - pad * 2);
      const dx     = cx + (cw - dSize) / 2;
      const dy     = cy + (ch - dSize) / 2;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(designImg.current, dx, dy, dSize, dSize);
      ctx.restore();
    }

    // Live badge
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 90, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 12px sans-serif';
    ctx.fillText('● AR LIVE', 18, 27);
    ctx.restore();

    rafRef.current = requestAnimationFrame(draw);
  }, [tshirtColor]);

  const startCamera = async () => {
    try {
      setError(null);
      setSnapshot(null);
      const ms = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = ms; await videoRef.current.play(); }
      setStream(ms);
      setIsActive(true);
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsActive(false);
  };

  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSnapshot(canvas.toDataURL('image/png'));
  };

  const downloadSnapshot = () => {
    if (!snapshot) return;
    const a = document.createElement('a');
    a.href = snapshot;
    a.download = `ar-tryon-${Date.now()}.png`;
    a.click();
  };

  // Start/stop draw loop with camera
  useEffect(() => {
    if (isActive) { rafRef.current = requestAnimationFrame(draw); }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, draw]);

  // Cleanup on unmount
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Live AR Try-On</h3>
          <p className="text-sm text-gray-500">See your design on you in real time via your camera</p>
        </div>
        {isActive && (
          <button onClick={takeSnapshot}
            className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /> Snapshot
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {!design ? (
          <div className="text-center py-10 text-gray-400">
            <Camera className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No design selected</p>
            <p className="text-sm mt-1">Generate a design and add it to cart first</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 justify-center">
              {!isActive ? (
                <button onClick={startCamera}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <Camera className="w-4 h-4" /> Start AR Try-On
                </button>
              ) : (
                <>
                  <button onClick={stopCamera}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                    <CameraOff className="w-4 h-4" /> Stop
                  </button>
                  <button onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Restart
                  </button>
                </>
              )}
            </div>

            {/* Camera / canvas */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" autoPlay muted playsInline />
              <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Camera not active</p>
                  </div>
                </div>
              )}
            </div>

            {isActive && (
              <p className="text-xs text-center text-gray-500">
                Position your chest in the centre of the frame for best results
              </p>
            )}

            {/* Snapshot preview */}
            {snapshot && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Snapshot</p>
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={snapshot} alt="AR snapshot" className="w-full" />
                  <button onClick={downloadSnapshot}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow hover:bg-white transition-colors">
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ARTryOn;
