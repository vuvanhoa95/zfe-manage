'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, Loader2, CreditCard, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface CardScannerProps {
  onScanComplete: (data: any) => void;
  onClose: () => void;
}

type ImageSource = 'camera' | 'upload' | 'paste';

const CardScanner: React.FC<CardScannerProps> = ({ onScanComplete, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ImageSource>('camera');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      setSource('camera');
      setError(null);
    } else {
      setError('Không thể chụp ảnh từ camera. Vui lòng thử lại hoặc dùng ảnh có sẵn.');
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, HEIC...)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setImgSrc(result);
        setSource('upload');
        setError(null);
      } else {
        setError('Không thể đọc file ảnh. Vui lòng thử lại.');
      }
    };
    reader.onerror = () => {
      setError('Đã xảy ra lỗi khi đọc file ảnh.');
    };

    reader.readAsDataURL(file);
  }, []);

  const openFilePicker = useCallback(() => {
    setError(null);
    fileInputRef.current?.click();
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    try {
      const items = event.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (!imageItem) {
        return;
      }

      const file = imageItem.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImgSrc(result);
          setSource('paste');
          setError(null);
        } else {
          setError('Không thể đọc ảnh từ clipboard. Vui lòng thử lại.');
        }
      };
      reader.onerror = () => {
        setError('Đã xảy ra lỗi khi đọc ảnh từ clipboard.');
      };

      reader.readAsDataURL(file);
    } catch {
      setError('Không thể xử lý ảnh dán từ clipboard.');
    }
  }, []);

  useEffect(() => {
    // Cho phép dán ảnh (Ctrl+V) khi cửa sổ quét đang mở
    const handleWindowPaste = (event: ClipboardEvent) => {
      handlePaste(event);
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [handlePaste]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
    setSource('camera');
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
    facingMode: 'environment', // Dùng camera sau trên mobile nếu có
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
              <div className="w-[85%] h-[75%] border-2 border-dashed border-white/50 rounded-lg" />
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={capture}
              className="flex-1 py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-transform active:scale-95 shadow-lg shadow-white/5"
            >
              <Camera size={20} />
              Chụp ảnh
            </button>
            <button
              type="button"
              onClick={openFilePicker}
              className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-transform active:scale-95 shadow-lg shadow-zf-accent/10"
            >
              <ImageIcon size={20} />
              Tải/Dán ảnh
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <button
                onClick={retake}
                disabled={isScanning}
                className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} />
                Chọn ảnh khác
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
            <p className="text-[10px] text-gray-400 text-center">
              Nguồn ảnh: {source === 'camera' ? 'Camera' : source === 'upload' ? 'Ảnh tải lên' : 'Ảnh dán từ clipboard'}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="text-[10px] text-gray-500 text-center">
          Bạn có thể chụp ảnh trực tiếp, tải file ảnh từ máy hoặc dán ảnh (Ctrl+V) khi cửa sổ này đang mở để quét danh thiếp.
        </p>
      </div>
    </div>
  );
};

export default CardScanner;
