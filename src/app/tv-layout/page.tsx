"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PhotoMapper } from "@/components/PhotoMapper";
import { SectionHeader, TVBadge } from "@/components/ui";

export default function TVLayoutPage() {
  const { activeBar } = useStore();
  const [activePhotoId, setActivePhotoId] = useState(
    activeBar.layoutPhotos[0]?.id ?? "",
  );
  const photos = activeBar.layoutPhotos;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        kicker={`${activeBar.name} · Photo mapping`}
        title="TV Layout & Photo Mapping"
      />

      <p className="max-w-3xl text-sm text-chalk-dim">
        Upload a photo of your TV wall, then drop a numbered marker on each screen
        so bartenders can see exactly which TV is which. Markers stay locked to the
        photo as a percentage, so they survive any screen size. Numbering is fully
        custom — TVs do not need to be sequential.
      </p>

      {/* TV order strip */}
      <div className="panel p-4">
        <div className="field-label mb-3">Configured TV order · left → right</div>
        <div className="flex flex-wrap items-center gap-3">
          {activeBar.tvOrder.map((n, i) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <TVBadge number={n} size="md" />
                <span className="max-w-[90px] truncate text-center text-[10px] text-chalk-faint">
                  {activeBar.tvs.find((t) => t.number === n)?.description}
                </span>
              </div>
              {i < activeBar.tvOrder.length - 1 && (
                <span className="text-chalk-faint">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-ink-700 pt-3 text-xs text-chalk-faint">
          {activeBar.setupNotes}
        </p>
      </div>

      {/* Photo tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePhotoId(p.id)}
            className={`btn px-3.5 py-2 ${
              p.id === activePhotoId ? "btn-primary" : "btn-ghost"
            }`}
          >
            {p.name}
            <span className="ml-1 rounded bg-ink-950/40 px-1.5 text-[10px] tnum">
              {p.markers.length}
            </span>
          </button>
        ))}
        <AddPhotoButton onAdd={setActivePhotoId} />
      </div>

      {activePhotoId && <PhotoMapper photoId={activePhotoId} />}
    </div>
  );
}

function AddPhotoButton({ onAdd }: { onAdd: (id: string) => void }) {
  const { activeBar, updateBar } = useStore();
  return (
    <button
      className="btn btn-ghost px-3.5 py-2"
      onClick={() => {
        const id = `photo-${Math.random().toString(36).slice(2, 8)}`;
        const newPhoto = {
          id,
          name: `View ${activeBar.layoutPhotos.length + 1}`,
          imageUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='480'><rect width='1200' height='480' fill='#0d0f12'/><text x='600' y='240' fill='#3a414c' font-family='monospace' font-size='28' text-anchor='middle'>Upload a bar photo</text></svg>`,
            ),
          markers: [],
        };
        updateBar({ layoutPhotos: [...activeBar.layoutPhotos, newPhoto] });
        onAdd(id);
      }}
    >
      + Add layout photo
    </button>
  );
}
