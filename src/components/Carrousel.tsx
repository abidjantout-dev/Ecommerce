"use client";
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/types";

const DELAI = 3500;

export default function Carrousel({ images }: { images: ProductImage[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pause = useRef(false);

  // Défilement automatique, suspendu dès que le visiteur touche les photos.
  useEffect(() => {
    if (images.length < 2) return;
    const lent = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lent) return;

    const id = setInterval(() => {
      const el = rail.current;
      if (!el || pause.current || document.hidden) return;
      const suivant = (Math.round(el.scrollLeft / (el.clientWidth + 10)) + 1) % images.length;
      el.scrollTo({ left: suivant * (el.clientWidth + 10), behavior: "smooth" });
    }, DELAI);

    return () => clearInterval(id);
  }, [images.length]);

  function suspendre() { pause.current = true; }
  function reprendre(delai = 0) {
    setTimeout(() => { pause.current = false; }, delai);
  }

  if (images.length === 0) {
    return <div className="aspect-square rounded-2xl border border-bord bg-asphalte" />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div
        ref={rail}
        tabIndex={0}
        aria-label="Photos du produit, faites défiler"
        className="rail grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col gap-2.5 overflow-x-auto rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-phare"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / (el.clientWidth + 10)));
        }}
        onPointerDown={suspendre}
        onMouseEnter={suspendre}
        onFocus={suspendre}
        onMouseLeave={() => reprendre()}
        onBlur={() => reprendre()}
        onTouchEnd={() => reprendre(4000)}
      >
        {images.map((img, i) => (
          <figure
            key={i}
            className="relative m-0 snap-center overflow-hidden rounded-2xl border border-bord bg-asphalte"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? "Photo du produit"}
              className="block aspect-square w-full max-w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {img.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(5,7,11,.88)] to-transparent px-3.5 pb-3 pt-7 font-display text-sm font-bold text-white">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {images.map((_, i) => (
            <i
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === index ? "w-[18px] bg-phare" : "w-1.5 bg-bord")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
