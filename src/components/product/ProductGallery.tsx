"use client";

import { useState } from "react";

interface ImageItem {
  id: string;
  image_url: string;
  alt_text?: string;
  sort_order?: number;
}

export function ProductGallery({
  images,
  productName,
  mainImage,
}: {
  images: ImageItem[];
  productName: string;
  mainImage?: string;
}) {
  const [selected, setSelected] = useState(mainImage || images[0]?.image_url);

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/30">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected}
            alt={productName}
            className="h-full w-full object-cover transition-opacity"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(img.image_url)}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                selected === img.image_url
                  ? "border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.alt_text || productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
