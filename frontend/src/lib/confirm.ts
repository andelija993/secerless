interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
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

    const [heading, text] = [dialog.querySelector('h3')!, dialog.querySelector('p')!];
    const cancel = dialog.querySelector<HTMLButtonElement>('[data-cancel]')!;
    const ok = dialog.querySelector<HTMLButtonElement>('[data-ok]')!;
    // textContent keeps user text safe from HTML injection
    heading.textContent = title;
    text.textContent = message;
    cancel.textContent = cancelText;
    ok.textContent = confirmText;

    let result = false;
    ok.onclick = () => {
      result = true;
      dialog.close();
    };
    cancel.onclick = () => dialog.close();
    // Fires for OK, Cancel, Esc and backdrop click
    dialog.onclose = () => {
      dialog.remove();
      resolve(result);
    };

    document.body.appendChild(dialog);
    dialog.showModal();
    cancel.focus();
  });
}

