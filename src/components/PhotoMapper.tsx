"use client";

import { useRef, useState } from "react";
import type { LayoutPhoto, TVMarker } from "@/lib/types";
import { useStore } from "@/lib/store";

/** Read-only marker overlay — used on Staff View, Print, Command Center. */
export function LayoutViewer({
  photo,
  compact = false,
}: {
  photo: LayoutPhoto;
  compact?: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-ink-600 bg-ink-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.imageUrl}
        alt={photo.name}
        className="block h-auto w-full select-none"
        draggable={false}
      />
      {photo.markers.map((m) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <div
            className={`flex items-center justify-center rounded-full border-2 font-mono font-bold tnum shadow-marker ${
              m.ignored
                ? "border-ink-500 bg-ink-800/90 text-chalk-faint"
                : "border-amber-accent bg-ink-950/85 text-amber-glow"
            }`}
            style={{
              width: compact ? m.size * 0.7 : m.size,
              height: compact ? m.size * 0.7 : m.size,
              fontSize: (compact ? m.size * 0.7 : m.size) * 0.42,
            }}
            title={m.note}
          >
            {m.tvNumber}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Editable photo mapper — drag, resize, note, ignore, add/remove markers. */
export function PhotoMapper({ photoId }: { photoId: string }) {
  const { activeBar, updatePhoto, addMarker, updateMarker, removeMarker } =
    useStore();
  const photo = activeBar.layoutPhotos.find((p) => p.id === photoId);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const dragState = useRef<{
    id: string;
    mode: "move" | "resize";
  } | null>(null);

  if (!photo) return null;

  const selectedMarker = photo.markers.find((m) => m.id === selected) ?? null;

  // Which TV numbers from the bar still need a marker on this photo.
  const placedNumbers = new Set(photo.markers.map((m) => m.tvNumber));
  const unplaced = activeBar.tvOrder.filter((n) => !placedNumbers.has(n));

  function pointFromEvent(e: React.PointerEvent | PointerEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }

  function onPointerDownMarker(
    e: React.PointerEvent,
    marker: TVMarker,
    mode: "move" | "resize",
  ) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(marker.id);
    dragState.current = { id: marker.id, mode };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag) return;
    const marker = photo!.markers.find((m) => m.id === drag.id);
    if (!marker) return;
    if (drag.mode === "move") {
      updateMarker(photo!.id, drag.id, pointFromEvent(e));
    } else {
      const rect = containerRef.current!.getBoundingClientRect();
      const cx = rect.left + (marker.x / 100) * rect.width;
      const cy = rect.top + (marker.y / 100) * rect.height;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy) * 2;
      updateMarker(photo!.id, drag.id, {
        size: Math.max(28, Math.min(120, dist)),
      });
    }
  }

  function onPointerUp() {
    dragState.current = null;
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updatePhoto(photo!.id, { imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      {/* Canvas */}
      <div>
        <div
          ref={containerRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => setSelected(null)}
          className="relative w-full touch-none select-none overflow-hidden rounded-lg border border-ink-600 bg-ink-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl}
            alt={photo.name}
            className="pointer-events-none block h-auto w-full"
            draggable={false}
          />
          {photo.markers.map((m) => {
            const isSel = m.id === selected;
            return (
              <div
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(m.id);
                }}
              >
                <div
                  onPointerDown={(e) => onPointerDownMarker(e, m, "move")}
                  className={`flex cursor-grab items-center justify-center rounded-full border-2 font-mono font-bold tnum shadow-marker active:cursor-grabbing ${
                    m.ignored
                      ? "border-ink-400 bg-ink-800/90 text-chalk-faint"
                      : "border-amber-accent bg-ink-950/85 text-amber-glow"
                  } ${isSel ? "ring-2 ring-signal ring-offset-2 ring-offset-ink-950" : ""}`}
                  style={{
                    width: m.size,
                    height: m.size,
                    fontSize: m.size * 0.42,
                  }}
                  title={m.note}
                >
                  {m.tvNumber}
                </div>
                {isSel && (
                  <div
                    onPointerDown={(e) => onPointerDownMarker(e, m, "resize")}
                    className="absolute -bottom-1 -right-1 h-4 w-4 cursor-nwse-resize rounded-full border border-ink-950 bg-signal"
                    title="Drag to resize"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆ Upload bar photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
          <span className="text-xs text-chalk-faint">
            Tap a marker to select · drag to move · drag the green handle to resize
          </span>
        </div>
      </div>

      {/* Inspector */}
      <div className="flex flex-col gap-4">
        <div className="panel p-4">
          <div className="field-label mb-2">Photo name</div>
          <input
            className="input"
            value={photo.name}
            onChange={(e) => updatePhoto(photo.id, { name: e.target.value })}
          />
        </div>

        <div className="panel p-4">
          <div className="field-label mb-2">Place a TV marker</div>
          {unplaced.length === 0 ? (
            <p className="text-sm text-chalk-faint">
              Every configured TV is placed on this photo.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unplaced.map((n) => (
                <button
                  key={n}
                  className="btn btn-primary px-3 py-1.5"
                  onClick={() =>
                    addMarker(photo.id, {
                      tvNumber: n,
                      x: 50,
                      y: 30,
                      size: 46,
                      note: activeBar.tvs.find((t) => t.number === n)?.description,
                      ignored: false,
                    })
                  }
                >
                  + TV {n}
                </button>
              ))}
            </div>
          )}
          <button
            className="btn btn-ghost mt-3 w-full"
            onClick={() => {
              const next =
                Math.max(0, ...activeBar.tvOrder, ...photo.markers.map((m) => m.tvNumber)) + 1;
              addMarker(photo.id, {
                tvNumber: next,
                x: 50,
                y: 50,
                size: 46,
                ignored: true,
                note: "Extra / utility screen",
              });
            }}
          >
            + Add extra marker (e.g. Keno)
          </button>
        </div>

        {selectedMarker ? (
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-chalk">
                TV {selectedMarker.tvNumber}
              </span>
              <button
                className="btn btn-danger px-2.5 py-1"
                onClick={() => {
                  removeMarker(photo.id, selectedMarker.id);
                  setSelected(null);
                }}
              >
                Remove
              </button>
            </div>
            <label className="field-label">Location note</label>
            <textarea
              className="input mt-1 mb-3 h-20 resize-none"
              value={selectedMarker.note ?? ""}
              placeholder="e.g. Far left / left bar TV"
              onChange={(e) =>
                updateMarker(photo.id, selectedMarker.id, { note: e.target.value })
              }
            />
            <label className="mb-2 flex items-center justify-between">
              <span className="field-label">Ignored (e.g. Keno TV)</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-signal"
                checked={selectedMarker.ignored}
                onChange={(e) =>
                  updateMarker(photo.id, selectedMarker.id, {
                    ignored: e.target.checked,
                  })
                }
              />
            </label>
            <label className="field-label">Marker size</label>
            <input
              type="range"
              min={28}
              max={120}
              value={selectedMarker.size}
              onChange={(e) =>
                updateMarker(photo.id, selectedMarker.id, {
                  size: Number(e.target.value),
                })
              }
              className="w-full accent-amber-accent"
            />
          </div>
        ) : (
          <div className="panel p-4 text-sm text-chalk-faint">
            Select a marker to edit its location note, size, or ignored status.
          </div>
        )}
      </div>
    </div>
  );
}
