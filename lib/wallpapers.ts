import { storage } from "wxt/storage";

export type WallpaperInfo = {
    id: string;
    name: string;
    url: string;
};

export const DEFAULT_WALLPAPERS: WallpaperInfo[] = [
    {
        id: "green-fractal",
        name: "Green Fractal Glass",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdkvIdRJz9GBpxQcEPYqDRtmjn2aslduwNTgC8",
    },
    {
        id: "green-landscape",
        name: "Green Landscape",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdFQ7yZUV5rfquJxwTM9nhSsNlKbP12yDZOWUd",
    },
    {
        id: "orange-fractal-wall",
        name: "Orange Fractal Wall",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdmZMxEUIGuo7faHJYtjPxRrsSq0VbWB8zM4yl",
    },
    {
        id: "darkshell",
        name: "Darkshell",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdHNehD9s1StQrPMZGIfvFBR85sjnJqaViD9Wg",
    },
    {
        id: "liquid-glass-circle",
        name: "Liquid Glass Circle",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDd31hSF1aCChVkLWdYfS9br7PBtcwnQxZpDAj8",
    },
    {
        id: "tangerine",
        name: "Tangerine",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdLBksIxRNqGpChfTslFLyAoEai9twkUOcB1W6",
    },
    {
        id: "darkmist",
        name: "Darkmist",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdN2RRtGPM7wKnvWGVmy3zl0x94o8NjODZSHbY",
    },
    {
        id: "purple-moon",
        name: "Purple Moon",
        url: "https://p2myfh92qq.ufs.sh/f/93hqarYp4cDdAYvUs6PkNsu2tghpYOvrPweEdIUQCoaGHlzZ",
    },
];

export const wallpaperItem = storage.defineItem<string | null>("local:wallpaper", {
    fallback: null,
    version: 1,
});

export const wallpaperImagesItem = storage.defineItem<WallpaperInfo[]>(
    "local:wallpaperImages",
    {
        init: () => DEFAULT_WALLPAPERS, // seed on first run
        version: 1,
    },
);

export const wallpaperInitializedItem = storage.defineItem<boolean>(
    "local:wallpaperInitialized",
    {
        fallback: false,
        version: 1,
    },
);

export type ProgressInfo = {
    progress: number | null; // 0..1 or null if unknown total
    loaded: number; // bytes
    total: number | null; // bytes or null
    bps: number; // smoothed bytes/sec
    elapsedMs: number;
};

export async function fetchImageWithProgress(
    url: string,
    opts?: {
        onProgress?: (info: ProgressInfo) => void;
        signal?: AbortSignal;
        cache?: RequestCache;
    },
): Promise<Blob> {
    const res = await fetch(url, {
        cache: opts?.cache ?? "force-cache",
        signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);

    const lengthHeader = res.headers.get("content-length");
    const total = lengthHeader ? parseInt(lengthHeader, 10) : NaN;

    // No streaming support
    if (!res.body) {
        const blob = await res.blob();
        opts?.onProgress?.({
            progress: 1,
            loaded: blob.size,
            total: isNaN(total) ? null : total,
            bps: blob.size,
            elapsedMs: 0,
        });
        return blob;
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    const tStart = performance.now();
    let lastT = tStart;
    let lastBytes = 0;
    let avgBps = 0; // smoothed

    const report = () => {
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        const dBytes = received - lastBytes;
        const instBps = (dBytes * 1000) / dt;
        avgBps = avgBps === 0 ? instBps : avgBps * 0.8 + instBps * 0.2;
        lastT = now;
        lastBytes = received;

        opts?.onProgress?.({
            progress: isNaN(total) ? null : Math.min(1, received / total),
            loaded: received,
            total: isNaN(total) ? null : total,
            bps: avgBps,
            elapsedMs: now - tStart,
        });
    };

    // initial progress callback
    report();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            received += value.length;
            report();
        }
    }

    const blob = new Blob(chunks);
    // final report
    opts?.onProgress?.({
        progress: 1,
        loaded: received,
        total: isNaN(total) ? null : total,
        bps: avgBps,
        elapsedMs: performance.now() - tStart,
    });
    return blob;
}

// Decode + downscale + encode to WebP for fast loads and smaller storage
export async function compressToDataURL(
    blob: Blob,
    opts?: { quality?: number },
): Promise<string> {
    const q = opts?.quality ?? 0.92;
    const bitmap = await createImageBitmap(blob);
    try {
        const dpr = globalThis.devicePixelRatio || 1;
        const vw = Math.max(document.documentElement.clientWidth || 0, 1280);
        const vh = Math.max(document.documentElement.clientHeight || 0, 720);

        // Keep enough pixels for crisp full-screen on hi-dpi but cap size
        const MAX_W = Math.round(Math.max(1920, vw * dpr));
        const MAX_H = Math.round(Math.max(1080, vh * dpr));

        const scale = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
        const targetW = Math.max(1, Math.round(bitmap.width * scale));
        const targetH = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D context unavailable");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);

        // Prefer WebP; fallback to a bit more compression if still large
        let dataUrl = canvas.toDataURL("image/webp", q);
        if (dataUrl.length > 10_000_000) {
            dataUrl = canvas.toDataURL("image/webp", Math.max(0.7, q - 0.2));
        }
        return dataUrl;
    } finally {
        bitmap.close();
    }
}

export async function setWallpaperFromUrl(
    url: string,
    onProgress?: (info: ProgressInfo) => void,
    signal?: AbortSignal,
): Promise<string> {
    const blob = await fetchImageWithProgress(url, { onProgress, signal });
    const dataUrl = await compressToDataURL(blob);
    await wallpaperItem.setValue(dataUrl);
    await wallpaperInitializedItem.setValue(true);
    return dataUrl;
}

export async function ensureInitialWallpaper(): Promise<void> {
    const [current, initialized] = await Promise.all([
        wallpaperItem.getValue(),
        wallpaperInitializedItem.getValue(),
    ]);
    if (current || initialized) return;

    const list = await wallpaperImagesItem.getValue(); // seeded via init
    // Random pick with simple retry on failure
    const order = [...list].sort(() => Math.random() - 0.5);

    for (const img of order) {
        try {
            await setWallpaperFromUrl(img.url);
            return;
        } catch (e) {
            console.warn("Initial wallpaper failed, trying next...", e);
        }
    }
    // If all fail, mark initialized so we don't loop every load
    await wallpaperInitializedItem.setValue(true);
}
export async function setWallpaperFromBlob(blob: Blob): Promise<string> {
    const dataUrl = await compressToDataURL(blob);
    await wallpaperItem.setValue(dataUrl);
    await wallpaperInitializedItem.setValue(true);
    return dataUrl;
}

export async function setWallpaperFromFile(file: File): Promise<string> {
    // Optionally validate MIME
    if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file.");
    }
    return setWallpaperFromBlob(file);
}