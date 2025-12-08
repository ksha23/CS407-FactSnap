import { apiClient } from "@/services/axios-client";
import { MediaAssetRes } from "@/models/media";

const mimeTypeMap: Record<string, string> = {
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
};

export async function uploadMedia(uri: string) {
    const uriParts = uri.split(".");
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    const mimeType = mimeTypeMap[fileType] || "image/jpeg";


    const formData = new FormData();
    formData.append("file", {
        uri: uri,
        name: `image.${fileType}`,
        type: mimeType,
    } as any);

    return (await apiClient.post<MediaAssetRes>("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })).data.asset
}