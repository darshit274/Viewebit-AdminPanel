/**
 * Single source of truth for upload-related config in the admin panel.
 * All values come from `.env` (Vite `VITE_*` vars) so production can change
 * them without a code edit.
 */

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Max PDF upload size in megabytes — used by client-side validation + UI labels. */
export const PDF_UPLOAD_MAX_SIZE_MB: number = parsePositiveInt(
  import.meta.env.VITE_PDF_UPLOAD_MAX_SIZE_MB as string | undefined,
  50,
);

/** Same value in bytes for quick comparison against `file.size`. */
export const PDF_UPLOAD_MAX_SIZE_BYTES: number = PDF_UPLOAD_MAX_SIZE_MB * 1024 * 1024;

/** Axios timeout (ms) for PDF upload requests — much longer than the default. */
export const PDF_UPLOAD_TIMEOUT_MS: number = parsePositiveInt(
  import.meta.env.VITE_UPLOAD_TIMEOUT_MS as string | undefined,
  10 * 60 * 1000, // 10 minutes
);
