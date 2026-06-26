import { useRef, useState } from "react";
import { Mic, Play, Pause, Trash2, Upload } from "lucide-react";

interface AudioUploaderProps {
  audioUrl: string | null;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  uploadLabel?: string;
}

export function AudioUploader({ audioUrl, onUpload, onRemove, uploadLabel = "上传语音" }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("audio/")) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        onUpload(reader.result as string);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {audioUrl ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm font-medium transition-all ${
              isPlaying
                ? "bg-brand-500 text-white"
                : "bg-success-50 hover:bg-success-50/80 text-neutral-700"
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "停止" : "播放"}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-button text-sm font-medium transition-all"
          >
            <Upload size={14} />
            更换
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 bg-error-50 hover:bg-error-100 text-error-500 rounded-button transition-all"
          >
            <Trash2 size={14} />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-button text-sm font-medium transition-all disabled:opacity-50"
        >
          <Mic size={14} />
          {isProcessing ? "处理中..." : uploadLabel}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
