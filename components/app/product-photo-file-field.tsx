"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/product-image";
import { cn } from "@/lib/utils";

const helperText = "JPG, PNG, WebP, or GIF · max 2 MB";

export function ProductPhotoFileField({
  id,
  label,
  labelClassName,
  existingImageSrc,
  open,
  description,
  onValidationChange,
}: {
  id: string;
  label: string;
  labelClassName: string;
  existingImageSrc?: string | null;
  open: boolean;
  description?: string;
  /** `false` when file is over the size limit */
  onValidationChange?: (ok: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  useEffect(() => {
    onValidationChange?.(error === null);
  }, [error]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (!file) return;

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setError("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  const showExisting = Boolean(existingImageSrc) && !previewUrl;

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div>
        <Label htmlFor={id} className={cn("cursor-pointer", labelClassName)}>
          {label}
        </Label>
        <p className="mt-0.5 text-[11px] leading-snug text-[#858585]">{helperText}</p>
        {description ? <p className="mt-1 text-[11px] leading-snug text-[#858585]">{description}</p> : null}
      </div>

      {previewUrl ? (
        <div className="flex items-start gap-3 rounded-xl bg-[#f9f4ef] p-2.5 ring-1 ring-[#ebebeb]">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-[#ebebeb]">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob URL for local preview */}
            <img src={previewUrl} alt="" className="size-full object-cover" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-xs font-medium text-[#333]">New photo</p>
            <p className="text-[11px] text-[#858585]">This is what will be saved when you submit.</p>
          </div>
        </div>
      ) : showExisting ? (
        <div className="flex items-start gap-3 rounded-xl bg-[#f9f4ef] p-2.5 ring-1 ring-[#ebebeb]">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-[#ebebeb]">
            <Image
              src={existingImageSrc!}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
          <p className="pt-1 text-xs leading-snug text-[#858585]">Current photo. Choose a new file below to replace it.</p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onFileChange}
        className="cursor-pointer text-xs text-[#333] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#ff6b1e] file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-white file:shadow-none hover:file:bg-[#ea580c]"
      />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
