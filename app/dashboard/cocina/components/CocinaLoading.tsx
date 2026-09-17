import { Loader2 } from "lucide-react";

export default function CocinaLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8F6]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D8060]" />

        <p className="text-sm font-medium text-gray-500">
          Cargando cocina...
        </p>
      </div>
    </main>
  );
}