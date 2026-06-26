import { useRef, useState } from "react";
import { Upload, ImagePlus } from "lucide-react";
import { compressImage } from "../../utils/imageCompress";

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
  compact?: boolean;
}

export function ImageUploader({ onImageUpload, compact = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onImageUpload(dataUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-button text-sm font-medium transition-all"
          disabled={isProcessing}
        >
          <ImagePlus size={14} />
          {isProcessing ? "处理中..." : "更换图片"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center gap-3 w-full h-full min-h-[200px]
        border-2 border-dashed rounded-md cursor-pointer transition-all duration-150
        ${isDragging
          ? "border-brand-500 bg-brand-50 scale-[1.02]"
          : "border-neutral-300 hover:border-brand-300 hover:bg-brand-50/50"
        }
        ${isProcessing ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {isProcessing ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-neutral-500 text-sm">正在压缩图片...</span>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <Upload size={22} className="text-brand-500" />
          </div>
          <div className="text-center">
            <p className="text-neutral-700 font-medium text-sm">
              点击或拖拽上传图片
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              支持 JPG、PNG 格式
            </p>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
