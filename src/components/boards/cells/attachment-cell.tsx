"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Paperclip, Upload, FileText, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("BoardComponents.cells.attachment");
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
            "flex items-center gap-1 text-sm text-left w-full h-full group/cell",
            compact ? "min-h-[24px]" : "min-h-[28px]",
            className
          )}
        >
          {value.length > 0 ? (
            <div className="flex items-center gap-2 w-full">
              {/* Show first image thumbnail if available */}
              {isImage(value[0].type) ? (
                <div className="relative h-6 w-8 rounded overflow-hidden border border-border/50 bg-muted/50 flex-shrink-0">
                  <Image
                    src={value[0].url}
                    alt="Thumbnail"
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-6 w-8 rounded bg-muted/50 flex-shrink-0">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col min-w-0">
                <span className="text-xs truncate max-w-[120px]">{value[0].name}</span>
                {value.length > 1 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{value.length - 1} {t("otherFiles")}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground/40 text-xs px-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
              {t("add")}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="space-y-2">
          {/* File list */}
          {value.length > 0 && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {value.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start gap-2.5 p-2 rounded-md hover:bg-accent/50 group border border-transparent hover:border-border/50 transition-colors"
                >
                  {/* Thumbnail or Icon */}
                  {isImage(file.type) ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block flex-shrink-0"
                    >
                      <div className="relative h-10 w-10 rounded overflow-hidden border border-border/50 bg-muted">
                        <Image
                          src={file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    </a>
                  ) : (
                    <div className="h-10 w-10 rounded flex items-center justify-center bg-muted flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline truncate"
                    >
                      {file.name}
                    </a>
                    <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                  >
                    <X className="h-4 w-4" />
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
                <span>{t("uploading")}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{t("uploadFile")}</span>
              </>
            )}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
