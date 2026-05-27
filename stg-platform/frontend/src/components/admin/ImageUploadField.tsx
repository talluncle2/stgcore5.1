import { ChangeEvent, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  helperText?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({ label, value, onChange, helperText }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [manualUrlOpen, setManualUrlOpen] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem valido.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("A imagem deve ter ate 4MB.");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setFileName(file.name);
    onChange(dataUrl);
  }

  function removeImage() {
    setFileName("");
    setError("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#c4b5fd]">{label}</p>
        {helperText && <p className="mt-1 text-xs text-[#64748b]">{helperText}</p>}
      </div>

      <div className="overflow-hidden border border-[#a855f7]/25 bg-[#111827]/75">
        <div className="flex min-h-48 items-center justify-center bg-[#050608]">
          {value ? (
            <img src={value} alt="Preview" className="max-h-72 w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center text-[#64748b]">
              <ImagePlus size={42} className="text-[#a855f7]" />
              <p className="text-sm font-bold">Nenhuma imagem selecionada</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#a855f7]/20 p-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 text-xs text-[#94a3b8]">
            {fileName || (value ? "Imagem atual carregada" : "PNG, JPG, WEBP ou GIF ate 4MB")}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="stg-button-secondary inline-flex items-center gap-2 px-3 py-2 text-xs"
            >
              <Upload size={14} />
              Upload
            </button>
            {value && (
              <button
                type="button"
                onClick={removeImage}
                className="border border-[#ef4444]/35 bg-[#ef4444]/10 px-3 py-2 text-xs font-black uppercase text-[#fecaca]"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setManualUrlOpen((current) => !current)}
        className="w-fit text-xs font-bold uppercase tracking-[0.06em] text-[#94a3b8] underline-offset-4 hover:text-[#c4b5fd] hover:underline"
      >
        {manualUrlOpen ? "Ocultar URL manual" : "Usar URL manual"}
      </button>

      {manualUrlOpen && (
        <input
          className="stg-admin-input"
          placeholder="/assets/banner.png ou https://..."
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {error && <p className="text-xs font-bold text-[#fca5a5]">{error}</p>}
    </div>
  );
}
