import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, PenTool, Upload, Image as ImageIcon, Sparkles, Sliders, Trash2, Eye } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title?: string;
  initialSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'ลายเซ็นดิจิทัล (Digital Signature)',
  initialSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#0f172a'); // Slate 900
  const [lineWidth, setLineWidth] = useState<number>(2.5);

  // Upload state
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(initialSignature || null);
  const [isProcessingTransparent, setIsProcessingTransparent] = useState(true);
  const [threshold, setThreshold] = useState<number>(225); // 0-255 threshold for white background
  const [contrastBoost, setContrastBoost] = useState<boolean>(true);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = inkColor;
        setHasDrawn(false);
      }
    }
  }, [isOpen, activeTab, inkColor, lineWidth]);

  // Process uploaded image for transparency & ink sharpness
  useEffect(() => {
    if (!uploadedImageSrc) {
      setProcessedDataUrl(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scale nicely
      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);

      if (isProcessingTransparent) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Calculate brightness (grayscale value)
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          if (brightness >= threshold) {
            // White / light background becomes transparent
            data[i + 3] = 0;
          } else {
            // Dark ink enhancement
            if (contrastBoost) {
              // Enhance darkness of stroke
              const factor = Math.max(0, (threshold - brightness) / threshold);
              data[i] = Math.max(0, Math.min(255, r * (1 - factor * 0.5)));
              data[i + 1] = Math.max(0, Math.min(255, g * (1 - factor * 0.5)));
              data[i + 2] = Math.max(0, Math.min(255, b * (1 - factor * 0.5)));
              // Alpha scaling for smoother anti-aliasing edges
              data[i + 3] = Math.min(255, Math.round(a * (1 - brightness / 255) * 1.5));
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      setProcessedDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = uploadedImageSrc;
  }, [uploadedImageSrc, isProcessingTransparent, threshold, contrastBoost]);

  if (!isOpen) return null;

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload handlers
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      onClose();
    } else {
      if (!processedDataUrl && !uploadedImageSrc) return;
      onSave(processedDataUrl || uploadedImageSrc || '');
      onClose();
    }
  };

  const canSave = activeTab === 'draw' ? hasDrawn : !!(processedDataUrl || uploadedImageSrc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-500">เลือกวาดลายเซ็นหรืออัปโหลดรูปภาพ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5 mx-5 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>วาดลายเซ็น (Draw)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>อัปโหลดรูปลายเซ็น (Upload Image)</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-5">
          {activeTab === 'draw' ? (
            <div>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 flex items-center justify-center touch-none">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[180px] bg-transparent"
                />
                {!hasDrawn && (
                  <div className="absolute pointer-events-none text-slate-400 text-xs flex flex-col items-center">
                    <PenTool className="w-6 h-6 mb-1 opacity-40" />
                    <span>ลากเส้นเพื่อเซ็นชื่อที่นี่ (รองรับเมาส์และหน้าจอสัมผัส)</span>
                  </div>
                )}
              </div>

              {/* Drawing Toolbar */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[11px]">สีหมึก:</span>
                    <button
                      type="button"
                      onClick={() => setInkColor('#0f172a')}
                      className={`w-5 h-5 rounded-full bg-slate-900 ${inkColor === '#0f172a' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                      title="ดำสนิท"
                    />
                    <button
                      type="button"
                      onClick={() => setInkColor('#1e3a8a')}
                      className={`w-5 h-5 rounded-full bg-blue-900 ${inkColor === '#1e3a8a' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                      title="น้ำเงินเข้ม (สีกรม)"
                    />
                    <button
                      type="button"
                      onClick={() => setInkColor('#2563eb')}
                      className={`w-5 h-5 rounded-full bg-blue-600 ${inkColor === '#2563eb' ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                      title="น้ำเงินสด"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <span className="text-slate-500 text-[11px]">ขนาดเส้น:</span>
                    <button
                      type="button"
                      onClick={() => setLineWidth(1.8)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${lineWidth === 1.8 ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600'}`}
                    >
                      บาง
                    </button>
                    <button
                      type="button"
                      onClick={() => setLineWidth(2.5)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${lineWidth === 2.5 ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600'}`}
                    >
                      ปกติ
                    </button>
                    <button
                      type="button"
                      onClick={() => setLineWidth(3.5)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${lineWidth === 3.5 ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600'}`}
                    >
                      หนา
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างลายเซ็น</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Upload Tab */}
              {!uploadedImageSrc ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all ${
                    isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs mb-1">ลากไฟล์รูปภาพลายเซ็นมาวางที่นี่</h4>
                  <p className="text-[11px] text-slate-500 mb-3">รองรับ PNG, JPG, JPEG, SVG, WebP (มีระบบลบพื้นหลังขาวให้อัตโนมัติ)</p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพจากอุปกรณ์</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Preview Container with Checkered Transparency Background */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>ตัวอย่างลายเซ็นบนเอกสาร (ลายเซ็นโปร่งใส):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageSrc(null);
                          setProcessedDataUrl(null);
                        }}
                        className="text-rose-500 hover:text-rose-700 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>เปลี่ยนรูป</span>
                      </button>
                    </div>

                    <div
                      className="h-36 rounded-lg border border-slate-300/80 flex items-center justify-center p-3 relative overflow-hidden"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                          linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                          linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                          linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                        `,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <img
                        src={processedDataUrl || uploadedImageSrc}
                        alt="Signature Preview"
                        className="max-h-full max-w-full object-contain drop-shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Smart Filters & Background Removal Control */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-indigo-950 text-xs">
                        <input
                          type="checkbox"
                          checked={isProcessingTransparent}
                          onChange={(e) => setIsProcessingTransparent(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          ลบพื้นหลังสีขาวอัตโนมัติ (Transparent Background)
                        </span>
                      </label>
                    </div>

                    {isProcessingTransparent && (
                      <div className="pt-2 border-t border-indigo-200/60 space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                            <span>ความเข้มข้นของการตัดพื้นหลัง (Threshold):</span>
                            <span className="font-mono font-medium">{threshold}</span>
                          </div>
                          <input
                            type="range"
                            min="150"
                            max="250"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={contrastBoost}
                            onChange={(e) => setContrastBoost(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span>เพิ่มความคมชัดของเส้นหมึกลายเซ็น (Enhance Ink Contrast)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>ใช้ลายเซ็นนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
