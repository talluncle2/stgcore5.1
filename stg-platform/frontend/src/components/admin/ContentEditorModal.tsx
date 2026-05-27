import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ContentEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void | Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
}

export function ContentEditorModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  isSaving = false,
  saveLabel = "Salvar",
}: ContentEditorModalProps) {
  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-[#a855f7]/45 bg-[#050608] p-0 text-white shadow-2xl shadow-[#a855f7]/15">
        <DialogHeader className="border-b border-[#a855f7]/20 bg-[#0b0d13] px-5 py-4 text-left">
          <DialogTitle className="text-xl font-black uppercase tracking-[0.06em] text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-[#94a3b8]">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="px-5 py-5">{children}</div>

        <DialogFooter className="gap-2 border-t border-[#a855f7]/20 bg-[#0b0d13] px-5 py-4 sm:gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="tactical-edge border border-[#475569] bg-[#111827] px-4 py-2 text-sm font-black uppercase tracking-[0.06em] text-[#cbd5e1] transition-colors hover:border-[#94a3b8] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving}
            className="stg-button-primary inline-flex items-center justify-center px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : saveLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
