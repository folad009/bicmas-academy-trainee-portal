const PUBLIC_BLOB_BASE =
  "https://wu30puoeh0vgnkky.public.blob.vercel-storage.com";

export const fixBlobUrl = (url: string): string => {
  const parsed = new URL(url);

  if (parsed.hostname === "blob.vercel-storage.com") {
    return `${PUBLIC_BLOB_BASE}${parsed.pathname}`;
  }

  return url;
};
