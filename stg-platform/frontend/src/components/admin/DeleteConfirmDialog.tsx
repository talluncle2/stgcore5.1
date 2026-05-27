import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Excluir conteudo",
  description = "Esta acao remove o item da gestao local. Confirme antes de continuar.",
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[#ef4444]/35 bg-[#050608] text-white shadow-2xl shadow-[#ef4444]/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black uppercase tracking-[0.06em] text-white">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#94a3b8]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-[#475569] bg-[#111827] text-[#cbd5e1] hover:bg-[#1e293b]">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
