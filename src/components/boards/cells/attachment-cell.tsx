"use client";

import { useState, useRef } from "react";
import { Paperclip, Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface AttachmentFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export function AttachmentCell({
  value,
  onChange,
  compact = false,
  className,
}: {
  value: AttachmentFile[];
  onChange: (v: AttachmentFile[]) => void;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles: AttachmentFile[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const fileInfo = await res.json();
          uploadedFiles.push(fileInfo);
        }
      }

      onChange([...value, ...uploadedFiles]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileId: string) => {
    onChange(value.filter((f) => f.id !== fileId));
  };

  const isImage = (type: string) => type.startsWith("image/");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-sm text-left w-full",
            compact ? "py-0.5 min-h-[24px]" : "py-0.5 min-h-[28px]",
            className
          )}
        >
          {value.length > 0 ? (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-xs">{value.length}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/40"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="space-y-2">
          {/* File list */}
          {value.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {value.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-1.5 rounded bg-accent/50 group"
                >
                  {isImage(file.type) ? (
                    <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-xs hover:underline"
                  >
                    <div className="truncate">{file.name}</div>
                    <div className="text-muted-foreground">{formatSize(file.size)}</div>
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 w-full py-2 border border-dashed rounded text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Tải lên tệp</span>
              </>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
