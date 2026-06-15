import { ESCALERA_CAPAS_PUBLIC, SISTEMICAR_CATEGORY, CATEGORY_FOOTER } from "@/lib/sistemicarCategory";

type Variant = "compact" | "full";

export function CategoriaSistemicarBanner({ variant = "full" }: { variant?: Variant }) {
  if (variant === "compact") {
    return (
      <div
        className="p-3 rounded-xl border text-center"
        style={{ borderColor: "rgba(168,85,247,0.28)", backgroundColor: "rgba(168,85,247,0.06)" }}
        data-testid="categoria-sistemicar-compact"
      >
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#A855F7" }}>
          {SISTEMICAR_CATEGORY.name}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{SISTEMICAR_CATEGORY.oneLiner}</p>
      </div>
    );
  }

  return (
    <div
      className="mb-6 p-4 rounded-xl border space-y-3"
      style={{ borderColor: "rgba(168,85,247,0.28)", backgroundColor: "rgba(168,85,247,0.05)" }}
      data-testid="categoria-sistemicar-banner"
    >
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#A855F7" }}>
          {SISTEMICAR_CATEGORY.name}
        </p>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">{SISTEMICAR_CATEGORY.oneLiner}</p>
        <p className="text-[10px] text-slate-500 mt-2 italic">{SISTEMICAR_CATEGORY.notA}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {ESCALERA_CAPAS_PUBLIC.map(c => (
          <div
            key={c.capa}
            className="p-2.5 rounded-lg border text-center"
            style={{ borderColor: `${c.color}30`, backgroundColor: `${c.color}08` }}
          >
            <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: c.color }}>
              Capa {c.capa} · {c.titulo}
            </p>
            <p className="text-[9px] text-slate-400 mt-1 leading-snug">{c.pregunta}</p>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-slate-500 text-center leading-relaxed">{CATEGORY_FOOTER}</p>
    </div>
  );
}
