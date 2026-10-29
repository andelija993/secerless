// confirmDialog — a styled replacement for window.confirm() using a native
// <dialog> with daisyUI's `modal` classes. Works from React or plain scripts.
//
//   if (!(await confirmDialog('Delete this recipe?'))) return;

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button for destructive actions (default true) */
  danger?: boolean;
}

export function confirmDialog(message: string, opts: ConfirmOptions = {}): Promise<boolean> {
  const { title = 'Are you sure?', confirmText = 'Delete', cancelText = 'Cancel', danger = true } = opts;

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal modal-bottom sm:modal-middle';
    dialog.innerHTML = `
      <div class="modal-box">
        <h3 class="text-lg font-bold"></h3>
        <p class="py-4 opacity-80"></p>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" data-cancel></button>
          <button type="button" class="btn ${danger ? 'btn-error' : 'btn-primary'}" data-ok></button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>`;

    // textContent (not innerHTML) so titles with quotes/HTML are shown safely
    dialog.querySelector('h3')!.textContent = title;
    dialog.querySelector('p')!.textContent = message;
    dialog.querySelector('[data-cancel]')!.textContent = cancelText;
    dialog.querySelector('[data-ok]')!.textContent = confirmText;

    let result = false;
    dialog.querySelector('[data-ok]')!.addEventListener('click', () => {
      result = true;
      dialog.close();
    });
    dialog.querySelector('[data-cancel]')!.addEventListener('click', () => dialog.close());
    // Fires for OK, Cancel, Esc and backdrop click
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.appendChild(dialog);
    dialog.showModal();
    (dialog.querySelector('[data-cancel]') as HTMLButtonElement).focus(); // safe default
  });
}

