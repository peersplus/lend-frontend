import { Toaster, toast as baseToast, useSonner } from "sonner";
import type { ExternalToast } from "sonner";

function getToastMessageKey(message: unknown): string | null {
  if (typeof message === "string" || typeof message === "number") {
    const text = String(message).trim();
    return text.length ? text : null;
  }
  return null;
}

function buildToastId(kind: string, message: unknown): string | null {
  const key = getToastMessageKey(message);
  if (!key) return null;

  const normalized = key
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9:_-]/g, "")
    .slice(0, 100);

  return `${kind}:${normalized}`;
}

function withDedupeId(kind: string, message: unknown, data?: ExternalToast): ExternalToast | undefined {
  if (data?.id !== undefined && data?.id !== null) return data;
  const id = buildToastId(kind, message);
  if (!id) return data;
  return { ...(data || {}), id };
}

type ToastInput = Parameters<typeof baseToast>[0];

export const toast = Object.assign(
  (message: ToastInput, data?: ExternalToast) => baseToast(message, withDedupeId("default", message, data)),
  {
    success: (message: ToastInput, data?: ExternalToast) =>
      baseToast.success(message, withDedupeId("success", message, data)),
    info: (message: ToastInput, data?: ExternalToast) =>
      baseToast.info(message, withDedupeId("info", message, data)),
    warning: (message: ToastInput, data?: ExternalToast) =>
      baseToast.warning(message, withDedupeId("warning", message, data)),
    error: (message: ToastInput, data?: ExternalToast) =>
      baseToast.error(message, withDedupeId("error", message, data)),
    message: (message: ToastInput, data?: ExternalToast) =>
      baseToast.message(message, withDedupeId("message", message, data)),
    loading: (message: ToastInput, data?: ExternalToast) =>
      baseToast.loading(message, withDedupeId("loading", message, data)),
    custom: baseToast.custom,
    promise: baseToast.promise,
    dismiss: baseToast.dismiss,
    getHistory: baseToast.getHistory,
    getToasts: baseToast.getToasts,
  },
);

export { Toaster, useSonner };
export type { Action, ExternalToast, ToastClassnames, ToastT, ToastToDismiss, ToasterProps } from "sonner";
