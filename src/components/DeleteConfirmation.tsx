import type { RefObject } from 'react';
type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  onConfirm: () => void;
};
export default function DeleteConfirmation({ dialogRef, onClose, onConfirm }: Props) {
  return (
    <dialog
      ref={dialogRef}
      className="confirmation"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onClose={onClose}
    >
      <h2 id="confirm-title">Delete all tasks?</h2>
      <p id="confirm-description">Are you sure you want to delete all tasks?</p>
      <form method="dialog" className="confirmation-actions">
        <button className="cancel-button" autoFocus value="cancel">
          Cancel
        </button>
        <button className="confirm-delete" value="delete" onClick={onConfirm}>
          Delete all
        </button>
      </form>
    </dialog>
  );
}
