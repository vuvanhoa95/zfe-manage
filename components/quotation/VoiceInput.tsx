'use client';

import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Loader2, Play, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceInputProps {
  onApply: (data: any) => void;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onApply, className }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Only check browser support after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until client-side mount
  if (!isClient) {
    return (
      <div className={clsx('flex flex-col gap-3 p-4 bg-white rounded-xl border border-zf-accent/20 shadow-sm', className)}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
            <MicOff size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Nhập liệu bằng giọng nói</h3>
            <p className="text-[10px] text-gray-500">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  // After mount, check if browser supports speech recognition
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className={clsx('flex flex-col gap-3 p-4 bg-white rounded-xl border border-zf-accent/20 shadow-sm', className)}>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
            <MicOff size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Nhập liệu bằng giọng nói</h3>
            <p className="text-[10px] text-red-500">Trình duyệt không hỗ trợ nhận dạng giọng nói</p>
          </div>
        </div>
      </div>
    );
  }

  const startListening = () => {
    resetTranscript();
    setError(null);
    setParsedData(null);
    SpeechRecognition.startListening({ continuous: true, language: 'vi-VN' });
  };

  const stopListening = async () => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) {
      handleParseVoice();
    }
  };

  const handleParseVoice = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const result = await response.json();
      if (result.success) {
        setParsedData(result.data);
      } else {
        setError(result.error || 'Không thể bóc tách dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyData = () => {
    if (parsedData) {
      onApply(parsedData);
      setParsedData(null);
      resetTranscript();
    }
  };

  return (
    <div className={clsx('flex flex-col gap-3 p-4 bg-white rounded-xl border border-zf-accent/20 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
            listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-zf-accent/10 text-zf-accent'
          )}>
            {listening ? <Mic size={20} /> : <MicOff size={20} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Nhập liệu bằng giọng nói</h3>
            <p className="text-[10px] text-gray-500">
              {listening ? 'Đang lắng nghe...' : 'Nhấn để bắt đầu nói'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!listening && !isProcessing && !parsedData && (
            <button
              onClick={startListening}
              className="p-2 bg-zf-accent text-white rounded-lg hover:bg-zf-accent/90 transition-colors"
              title="Bắt đầu nói"
            >
              <Play size={16} fill="currentColor" />
            </button>
          )}
          {listening && (
            <button
              onClick={stopListening}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Dừng và xử lý"
            >
              <Check size={16} />
            </button>
          )}
        </div>
      </div>

      {(transcript || isProcessing || parsedData || error) && (
        <div className="mt-2 text-xs">
          {transcript && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 italic text-gray-600 mb-2">
              "{transcript}"
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-zf-accent py-2 font-medium">
              <Loader2 className="animate-spin" size={14} />
              AI đang bóc tách thông tin...
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-50 text-red-600 rounded border border-red-100 flex items-center gap-2">
              <X size={14} />
              {error}
            </div>
          )}

          {parsedData && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-bold mb-2 flex items-center gap-1">
                <Check size={14} /> AI đã sẵn sàng điền dữ liệu:
              </p>
              <ul className="space-y-1 text-green-700 list-disc list-inside">
                {parsedData.projectName && <li>Dự án: <b>{parsedData.projectName}</b></li>}
                {parsedData.location && <li>Vị trí: <b>{parsedData.location}</b></li>}
                {parsedData.items?.length > 0 && <li>Hạng mục: <b>{parsedData.items.length} mục</b></li>}
              </ul>
              <button
                onClick={applyData}
                className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-sm"
              >
                Áp dụng ngay
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
