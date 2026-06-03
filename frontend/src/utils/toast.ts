export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'success') {
  window.dispatchEvent(
    new CustomEvent('fems:toast', {
      detail: { message, type },
    }),
  );
}
