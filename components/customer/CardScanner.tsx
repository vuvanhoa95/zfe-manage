'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, Loader2, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';

interface CardScannerProps {
  onScanComplete: (data: any) => void;
  onClose: () => void;
}

const CardScanner: React.FC<CardScannerProps> = ({ onScanComplete, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
  };

  const handleScan = async () => {
    if (!imgSrc) return;

    setIsScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/scan-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imgSrc }),
      });

      const result = await response.json();
      if (result.success) {
        onScanComplete(result.data);
      } else {
        setError(result.error || 'Không thể đọc được danh thiếp. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ AI');
    } finally {
      setIsScanning(false);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment" // Use back camera on mobile
  };

  return (
    <div className="flex flex-col bg-gray-950 rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-auto">
      <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <CreditCard size={18} className="text-zf-accent" />
          <span className="font-bold text-sm">Quét danh thiếp AI</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="relative aspect-[3/2] bg-black flex items-center justify-center overflow-hidden">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />
            {/* Guide Overlay */}
            <div className="absolute inset-0 border-2 border-zf-accent/30 pointer-events-none flex items-center justify-center">
                <div className="w-[85%] h-[75%] border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
          </>
        ) : (
          <img src={imgSrc} alt="Business Card" className="w-full h-full object-contain" />
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-3 z-10">
            <Loader2 className="animate-spin text-zf-accent" size={32} />
            <p className="text-sm font-medium animate-pulse">AI đang phân tích danh thiếp...</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-900 flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-red-900/30 text-red-400 text-xs rounded-lg border border-red-800/50 flex items-center gap-2">
            <X size={14} />
            {error}
          </div>
        )}

        {!imgSrc ? (
          <button
            onClick={capture}
            className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-transform active:scale-95 shadow-lg shadow-white/5"
          >
            <Camera size={20} />
            Chụp ảnh
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={retake}
              disabled={isScanning}
              className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} />
              Chụp lại
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex-1 py-3 bg-zf-accent text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zf-accent/90 transition-transform active:scale-95 shadow-lg shadow-zf-accent/20 disabled:opacity-50"
            >
              <Check size={18} />
              Quét AI
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-500 text-center">
          Vui lòng căn chỉnh danh thiếp nằm gọn trong khung hình để có kết quả tốt nhất.
        </p>
      </div>
    </div>
  );
};

export default CardScanner;
