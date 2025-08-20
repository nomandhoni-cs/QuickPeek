import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Upload, X } from "lucide-react";
import {
    wallpaperItem,
    wallpaperImagesItem,
    setWallpaperFromUrl,
    setWallpaperFromFile,
    type WallpaperInfo,
    type ProgressInfo,
} from "@/lib/wallpapers";

export default function BackgroundManager() {
    const [images, setImages] = useState<WallpaperInfo[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProgressInfo | null>(null);
    const [current, setCurrent] = useState<string | null>(null);
    const [justSetId, setJustSetId] = useState<string | null>(null);

    // Upload
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [processingUpload, setProcessingUpload] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        (async () => {
            const [list, saved] = await Promise.all([
                wallpaperImagesItem.getValue(),
                wallpaperItem.getValue(),
            ]);
            setImages(list);
            setCurrent(saved);
            // Prefetch thumbs
            list.forEach((i) => {
                const img = new Image();
                img.loading = "eager";
                img.decoding = "async";
                img.src = i.url;
            });
        })();

        const unwatch = wallpaperItem.watch((v) => setCurrent(v));
        return () => unwatch();
    }, []);

    const onPick = async (img: WallpaperInfo) => {
        if (downloadingId || processingUpload) return;
        setDownloadingId(img.id);
        setProgress({
            progress: 0,
            loaded: 0,
            total: null,
            bps: 0,
            elapsedMs: 0,
        });
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        try {
            await setWallpaperFromUrl(
                img.url,
                (info) => setProgress({ ...info }),
                ac.signal,
            );
            setJustSetId(img.id);
            setTimeout(() => setJustSetId((v) => (v === img.id ? null : v)), 800);
        } catch (e) {
            if ((e as any).name !== "AbortError") console.error(e);
        } finally {
            setDownloadingId(null);
            setProgress(null);
            abortRef.current = null;
        }
    };

    const onCancelDownload = () => {
        abortRef.current?.abort();
    };

    const onClickUpload = () => fileInputRef.current?.click();

    const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files?.[0];
        e.currentTarget.value = ""; // allow re-select same file
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            return;
        }

        if (downloadingId) return;
        setProcessingUpload(true);
        try {
            await setWallpaperFromFile(file);
            setJustSetId("upload");
            setTimeout(() => setJustSetId((v) => (v === "upload" ? null : v)), 800);
        } catch (err) {
            console.error(err);
            alert("Failed to process image.");
        } finally {
            setProcessingUpload(false);
        }
    };

    const onRemove = async () => {
        await wallpaperItem.setValue(null);
    };

    const pct = progress?.progress != null ? Math.round(progress.progress * 100) : null;

    // Shared styles
    const tileBase =
        "group relative overflow-hidden rounded-xl border shadow-sm transition " +
        "bg-white/10 border-white/15 backdrop-blur-md hover:bg-white/15 hover:border-white/25 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 " +
        "motion-reduce:transition-none cursor-pointer";
    const tileBody = "relative w-full aspect-[16/10]"; // fixed ratio
    const hoverOverlay =
        "pointer-events-none absolute inset-0 hidden group-hover:flex items-center justify-center " +
        "bg-black/35 text-white text-xs font-medium";
    const labelBar =
        "absolute bottom-0 left-0 right-0 text-[10px] leading-4 text-white/95 bg-black/35 px-1";

    const handleKeyActivate =
        (fn: () => void) =>
            (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fn();
                }
            };

    return (
        <div className="grid gap-3">
            <Label className="font-medium">Wallpapers</Label>

            {/* 3-column grid */}
            <div className="grid grid-cols-3 gap-3">
                {/* Upload tile */}
                <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={handleKeyActivate(onClickUpload)}
                    onClick={onClickUpload}
                    aria-busy={processingUpload}
                    aria-disabled={processingUpload || !!downloadingId}
                    className={`${tileBase} border-dashed ${processingUpload || downloadingId ? "opacity-60 cursor-not-allowed" : ""}`}
                    title="Upload custom image"
                >
                    <div className={tileBody}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFileChange}
                        />

                        <div className="absolute inset-0 grid place-items-center text-[11px] text-white/80">
                            <div className="flex flex-col items-center">
                                <Upload className="w-4 h-4 mb-1 opacity-90" />
                                Upload
                            </div>
                        </div>

                        {/* Processing overlay */}
                        {processingUpload && (
                            <div
                                className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="absolute left-2 right-2 bottom-2">
                                    <div className="flex items-center justify-between text-[11px] text-white/90 mb-1">
                                        <span>Processing…</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded bg-white/25 overflow-hidden">
                                        <div className="h-full rounded bg-white/90 animate-pulse w-2/5" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success check */}
                        {justSetId === "upload" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="rounded-full bg-emerald-500 p-1">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    Set!
                                </div>
                            </div>
                        )}

                        <span className={labelBar}>Custom upload</span>
                    </div>
                </div>

                {/* Preset tiles */}
                {images.map((img) => {
                    const isDownloading = downloadingId === img.id;

                    return (
                        <div
                            key={img.id}
                            role="button"
                            tabIndex={0}
                            onKeyDown={handleKeyActivate(() => onPick(img))}
                            onClick={() => onPick(img)}
                            aria-busy={isDownloading}
                            aria-disabled={isDownloading || processingUpload}
                            className={`${tileBase} ${isDownloading || processingUpload ? "opacity-60 cursor-not-allowed" : ""}`}
                            title={img.name}
                        >
                            <div className={tileBody}>
                                <img
                                    src={img.url}
                                    alt={img.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    fetchPriority="low"
                                />

                                {/* Hover overlay */}
                                {!isDownloading && <div className={hoverOverlay}>Add as wallpaper</div>}

                                {/* Success check */}
                                {justSetId === img.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="rounded-full bg-emerald-500 p-1">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            Set!
                                        </div>
                                    </div>
                                )}

                                {/* Download overlay */}
                                {isDownloading && (
                                    <div
                                        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Cancel control — now valid, no nested button issue */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onCancelDownload();
                                            }}
                                            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center rounded-md border border-white/20 bg-black/40 p-1 text-white/90 hover:bg-black/60"
                                            aria-label="Cancel"
                                            title="Cancel"
                                            type="button"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {/* label + thin progress bar */}
                                        <div className="absolute left-2 right-2 bottom-2">
                                            <div className="flex items-center justify-between text-[11px] text-white/90 mb-1">
                                                <span>Downloading…</span>
                                                {pct != null && <span className="text-white/70">{pct}%</span>}
                                            </div>
                                            <div className="h-1.5 w-full rounded bg-white/25 overflow-hidden">
                                                <div
                                                    className={`h-full rounded bg-white/90 transition-all duration-150 ${pct == null ? "animate-pulse w-2/5" : ""}`}
                                                    style={{ width: pct == null ? undefined : `${pct}%` }}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-valuenow={pct ?? undefined}
                                                    role="progressbar"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <span className={labelBar}>{img.name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onRemove}>
                    Remove background
                </Button>
            </div>
        </div>
    );
}