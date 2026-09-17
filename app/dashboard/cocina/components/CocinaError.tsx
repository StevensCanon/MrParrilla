import { AlertCircle } from "lucide-react";

type CocinaErrorProps = {
  mensaje: string;
};

export default function CocinaError({
  mensaje,
}: CocinaErrorProps) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

      <div>
        <p className="text-sm font-semibold">
          Ocurrió un error
        </p>

        <p className="mt-0.5 text-sm">
          {mensaje}
        </p>
      </div>
    </div>
  );
}