export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  message: string;
  type?: ToastType;
  duration?: number;
}

const EVENT_NAME = 'secerless:toast';

export function showToast(message: string, type: ToastType = 'success', duration = 2800) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(EVENT_NAME, {
      detail: { message, type, duration },
    })
  );
}

