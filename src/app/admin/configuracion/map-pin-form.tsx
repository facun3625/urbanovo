"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_MAP_PIN_BG_COLOR,
  DEFAULT_MAP_PIN_BORDER_COLOR,
  GLOBE_PATH,
  HOUSE_PATH,
  PIN_HEAD_CENTER,
  PIN_HEIGHT,
  PIN_IMAGE_SIZE,
  PIN_WIDTH,
} from "@/components/estate/map-pin-svg";
import type { MapPinSettings } from "@/lib/settings";
import { updateMapPin } from "./actions";

const HEX = /^#[0-9a-fA-F]{6}$/;
const PREVIEW_SCALE = 3;

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border p-0.5"
          aria-label={label}
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} className="w-28 font-mono uppercase" />
      </div>
    </div>
  );
}

// Vista previa del pin tal como lo arma /api/map-pin, en grande.
function PinPreview({ borderColor, bgColor, imageUrl }: { borderColor: string; bgColor: string; imageUrl: string | null }) {
  const imageBox = PIN_IMAGE_SIZE * PREVIEW_SCALE;
  const imageOffset = PIN_HEAD_CENTER * PREVIEW_SCALE - imageBox / 2;
  return (
    <div className="relative" style={{ width: PIN_WIDTH * PREVIEW_SCALE, height: PIN_HEIGHT * PREVIEW_SCALE }}>
      <svg viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`} className="absolute inset-0 size-full drop-shadow-md">
        <path d={GLOBE_PATH} fill={HEX.test(bgColor) ? bgColor : "#fff"} stroke={HEX.test(borderColor) ? borderColor : "#000"} strokeWidth={2.5} />
        {!imageUrl && <path d={HOUSE_PATH} fill={HEX.test(borderColor) ? borderColor : "#000"} />}
      </svg>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute object-contain"
          style={{ left: imageOffset, top: imageOffset, width: imageBox, height: imageBox }}
        />
      )}
    </div>
  );
}

export function MapPinForm({ pin, faviconUrl }: { pin: MapPinSettings; faviconUrl: string | null }) {
  const [borderColor, setBorderColor] = useState(pin.borderColor);
  const [bgColor, setBgColor] = useState(pin.bgColor);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  // Vista previa de la imagen elegida (se libera la anterior al cambiarla).
  function chooseFile(selected: File | null) {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(selected);
    setFilePreview(selected ? URL.createObjectURL(selected) : null);
  }

  const customImage = file ? filePreview : removeImage ? null : pin.imageUrl;
  const shownImage = customImage ?? faviconUrl;

  function save() {
    if (!HEX.test(borderColor) || !HEX.test(bgColor)) {
      toast.error("Usá colores en formato #RRGGBB");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("borderColor", borderColor);
      formData.set("bgColor", bgColor);
      if (file) formData.set("image", file);
      if (removeImage) formData.set("removeImage", "true");
      const result = await updateMapPin(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Pin guardado");
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <div>
        <h2 className="text-sm font-medium">Pin del mapa</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          El globito que marca cada propiedad, en los dos mapas. Si no subís una imagen, se usa el favicon del sitio.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-muted px-8 py-6">
          <PinPreview borderColor={borderColor} bgColor={bgColor} imageUrl={shownImage} />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <ColorField id="pin-border" label="Borde" value={borderColor} onChange={setBorderColor} />
            <ColorField id="pin-bg" label="Fondo" value={bgColor} onChange={setBgColor} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Imagen</Label>
            <p className="text-xs text-muted-foreground">
              {customImage ? "Imagen propia del pin." : faviconUrl ? "Usando el favicon del sitio." : "Sin imagen: se muestra la casita."}{" "}
              Conviene una imagen cuadrada, PNG con fondo transparente.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                chooseFile(selected);
                if (selected) setRemoveImage(false);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
                Subir imagen
              </Button>
              {customImage && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    chooseFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                    setRemoveImage(Boolean(pin.imageUrl));
                  }}
                >
                  Volver al favicon
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBorderColor(DEFAULT_MAP_PIN_BORDER_COLOR);
                  setBgColor(DEFAULT_MAP_PIN_BG_COLOR);
                }}
              >
                Colores originales
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando..." : "Guardar pin"}
        </Button>
      </div>
    </div>
  );
}
