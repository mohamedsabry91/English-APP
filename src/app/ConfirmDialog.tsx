import { useEffect, useRef } from 'react';

interface Props {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div className="dialog" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="dialog-msg" data-testid="confirm-dialog">
        <p id="dialog-msg">{message}</p>
        <div className="row">
          <button type="button" ref={cancelRef} onClick={onCancel} data-testid="confirm-no">{cancelLabel}</button>
          <button type="button" className={danger ? 'danger-solid' : 'primary'} onClick={onConfirm} data-testid="confirm-yes">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
