"use client";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { inputClass } from "@/components/estate/form-field-class";
import { youtubeId } from "@/lib/home-shorts";

// Campo "Short de YouTube" de la propiedad, con la miniatura vertical de
// vista previa (no el reproductor: alcanza para confirmar el link).
export function PropertyShortField({ defaultValue, onDirty }: { defaultValue: string; onDirty: () => void }) {
  const [url, setUrl] = useState(defaultValue);
  const trimmed = url.trim();
  const id = trimmed ? youtubeId(trimmed) : null;

  return (
    <div className="space-y-3">
      <input
        type="url"
        name="shortUrl"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          onDirty();
        }}
        placeholder="https://youtube.com/shorts/…"
        aria-invalid={Boolean(trimmed) && !id}
        className={cn(inputClass, trimmed && !id && "border-destructive")}
      />
      {trimmed && !id && <p className="text-xs text-destructive">No es un link de YouTube.</p>}
      {id && (
        <div className="relative aspect-[9/16] w-40 overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
      )}
    </div>
  );
}
