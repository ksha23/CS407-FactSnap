export type MediaAsset = {
    key: string;
    url: string;
    urlExpiresAt: string;
    fileName: string;
    mimeType: string;
    size: string;
    provider: string;
    uploader: string;
}

// DTOs
export type MediaAssetRes = {
    asset: MediaAsset;
}