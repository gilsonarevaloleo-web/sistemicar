import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Users, DollarSign, Download, MessageCircle, CheckCircle, Magnet } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { SELLER_COMMISSION_RATE } from "@shared/sellerCommissions";
import { buildSellerPagosUrl } from "@/lib/sellerRef";

const GOLD = "#D4AF37";
const WHATSAPP = "51918260514";

const PRODUCTOS = [
  { id: "planificacion_base", name: "PlanificaciÛn Base", price: 19.99, period: "/mes", stack: "Pelda?o 1", comision: 6.0, color: GOLD },
  { id: "operativo", name: "Operativo", price: 39.99, period: "/mes", stack: "Pelda?o 2 ? Conquista", comision: 12.0, color: "#00C851" },
  { id: "soberania_dia", name: "SoberanÌa del dÌa", price: 29.99, period: "/mes", stack: "Pelda?o 3 ? Orden mental", comision: 9.0, color: "#38BDF8" },
];

const STACKS = [
  {
    title: "Conquista medible",
    pelda?o: "Pelda?o 2 ? primer upsell",
    modules: "Base + Operativo",
    total: 59.98,
    comisionEjemplo: 18.0,
    desc: "Unidades, ritmo, rÈcord. Familiariza con cerrar y medir.",
  },
  {
    title: "Orden mental",
    pelda?o: "Pelda?o 3 ? avanzado",
    modules: "Base + SoberanÌa del dÌa",
    total: 49.98,
    comisionEjemplo: 15.0,
    desc: "Im·n, desglosador situaciÛn, proyectos y pasos de fe.",
  },
  {
    title: "Sistema completo",
    pelda?o: "Pelda?os 2 + 3",
    modules: "Base + Operativo + SoberanÌa",
    total: 89.96,
    comisionEjemplo: 27.0,
    desc: "Mide producciÛn y ordena pensamientos.",
  },
];

const EMBUDO_PREGUNTAS = [
  { pelda?o: 1, pregunta: "?Tu dÌa cierra con estructura?", respuesta: "PlanificaciÛn Base." },
  { pelda?o: 2, pregunta: "?Necesitas unidades, ritmo y rÈcord reales?", respuesta: "A?ade Operativo ? primer upsell." },
  { pelda?o: 3, pregunta: "?Ideas sueltas, imprevistos y proyectos grandes?", respuesta: "A?ade SoberanÌa ? Im·n + situaciÛn + pasos de fe." },
];

const PREGUNTAS = [
  "?Tu dÌa cierra con estructura, o necesitas medir unidades, o ordenar ideas sueltas? Eso define el pelda?o.",
  "?Has perdido dÌas creyendo que produjiste? ? Demo desglosador tiempo + termo vs ayer (Operativo).",
  "?Comparas con Notion? AquÌ pagas por ritmo, cierre y decisiones medidas ? no listas.",
  "Operativo antes que SoberanÌa: primero conquista medible, despuÈs orden mental avanzado.",
];

const IMAN_FLUJO = [
  "Mente ? Im·n (captura + nido/proyecto)",
  "Desglosador situacional (foco ~60% con cronÛmetro)",
  "[no alcanza el bloque] ? Im·n otra vez (ruta S)",
  "Cumplido ? paso ejecutado en proyecto",
];

const IMAN_OBJECIONES: { q: string; a: string }[] = [
  {
    q: "?Por quÈ escribo dos veces: aquÌ y donde resuelvo?",
    a: "Con Im·n + proyecto, la primera escritura es aterrizaje con destino; la segunda es ejecuciÛn medida en tiempo.",
  },
  {
    q: "Prefiero anotar directo donde trabajo",
    a: "Directo = foco bajo si no acotas tiempo. Desglosador + cronÛmetro sube el foco ~60%.",
  },
  {
    q: "Es otra bandeja de notas",
    a: "Es im·n de ordenamiento: nido (proyecto o inbox), ruta S/E/M, y vuelve al desglosador sin perderse.",
  },
];

const IMAN_FRASES = [
  "No es escribir dos veces al vacÌo: es capturar con nido y cerrar con paso en tu proyecto.",
  "El Im·n ordena; el desglosador enfoca; el proyecto te da fe para so?ar m·s grande.",
  "Pr·cticamente el primer sistema que ordena pensamientos hacia acciÛn medida.",
];

export default function VendedoresPlanificacion() {
  const [, navigate] = useLocation();
  const [demoCode, setDemoCode] = useState("TU-CODIGO");

  const copyLink = (code: string) => {
    const url = buildSellerPagosUrl(code);
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-24">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/documentos")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm"
          data-testid="button-back-vendedores"
        >
          <ArrowLeft size={16} />
          Documentos
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <Users size={12} />
            Kit vendedores
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: "Playfair Display, serif", color: GOLD }}>
            PlanificaciÛn SISTEMICAR
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Embudo por pelda?os: Base ? conquista medible ? orden mental. Solo PlanificaciÛn (Espejo es otro producto).
          </p>
        </div>

        {/* Embudo pelda?os */}
        <section className="p-4 rounded-xl border mb-6 border-white/10 bg-card/30">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">?En quÈ pelda?o est· el cliente?</h2>
          <div className="space-y-3">
            {EMBUDO_PREGUNTAS.map((item) => (
              <div key={item.pelda?o} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>
                  {item.pelda?o}
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-300">{item.pregunta}</p>
                  <p className="text-[10px] text-slate-500">{item.respuesta}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-600 mt-3 italic">
            Operativo (pelda?o 2) antes que SoberanÌa (pelda?o 3): primero medir, despuÈs ordenar pensamientos.
          </p>
        </section>

        {/* ComisiÛn */}
        <section className="p-4 rounded-xl border mb-6" style={{ borderColor: `${GOLD}30`, backgroundColor: `${GOLD}08` }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} style={{ color: GOLD }} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">ComisiÛn</h2>
          </div>
          <p className="text-sm text-white font-bold">{Math.round(SELLER_COMMISSION_RATE * 100)}% cada mes que el cliente pague</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Recurrente en suscripciones. Si el usuario cancela, deja de generarse comisiÛn. MercadoPago con tu link; Yape/PayPal vÌa Gilson.
          </p>
        </section>

        {/* Stacks */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Stacks por evoluciÛn</h2>
          <div className="grid gap-3">
            {STACKS.map((s) => (
              <div key={s.title} className="p-4 rounded-xl border border-white/10 bg-card/40">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-white text-sm">{s.title}</h3>
                  <span className="text-[9px] text-slate-500 uppercase">{s.pelda?o}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">{s.modules}</p>
                <p className="text-lg font-black" style={{ color: GOLD }}>~${s.total.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/mes</span></p>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
                <p className="text-[9px] text-emerald-400/80 mt-2">ComisiÛn ~${s.comisionEjemplo.toFixed(2)}/mes mientras renueve</p>
              </div>
            ))}
          </div>
        </section>

        {/* Im·n de pensamientos */}
        <section className="mb-8 p-4 rounded-xl border border-slate-500/25 bg-slate-900/40">
          <div className="flex items-center gap-2 mb-2">
            <Magnet size={16} className="text-slate-300" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300">Im·n de pensamientos</h2>
          </div>
          <p className="text-sm text-white font-semibold mb-1">
            El primer sistema que ordena pensamientos hacia proyectos, tiempo y pasos de fe.
          </p>
          <p className="text-[11px] text-slate-500 mb-4">
            Pelda?o 3 (SoberanÌa) ? demo 2 min ? mente acelerada e interrupciones
          </p>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Flujo en demo</p>
          <ol className="space-y-1.5 mb-5">
            {IMAN_FLUJO.map((step, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-slate-400">
                <span className="font-mono text-slate-600 flex-shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Objeciones frecuentes</p>
          <div className="space-y-2 mb-5">
            {IMAN_OBJECIONES.map((o) => (
              <div key={o.q} className="p-3 rounded-lg border border-white/5 bg-black/30">
                <p className="text-[11px] font-bold text-slate-300 mb-1">{o.q}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">{o.a}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Frases listas</p>
          <ul className="space-y-1.5 mb-4">
            {IMAN_FRASES.map((f) => (
              <li key={f} className="text-[10px] text-slate-400 italic leading-relaxed pl-3 border-l-2 border-slate-600">
                "{f}"
              </li>
            ))}
          </ul>

          <p className="text-[9px] text-amber-500/80">
            No digas que el Im·n reemplaza al desglosador ni que "planifica solo". El usuario cierra bloques y cumple subs.
          </p>
        </section>

        {/* Productos */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Cat·logo PlanificaciÛn</h2>
          <div className="space-y-2">
            {PRODUCTOS.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.stack}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black" style={{ color: p.color }}>${p.price}<span className="text-[10px] text-slate-500">{p.period === "/mes" ? "/mes" : ""}</span></p>
                  <p className="text-[9px] text-emerald-400">
                    Comisiùn ${p.comision.toFixed(2)}
                    {p.period === "/mes" ? "/mes" : " (˙nico)"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guion */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Guion r·pido</h2>
          <ul className="space-y-2">
            {PREGUNTAS.map((q, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-slate-400">
                <CheckCircle size={14} className="flex-shrink-0 text-emerald-500 mt-0.5" />
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* Link */}
        <section className="p-5 rounded-xl border mb-6" style={{ borderColor: `${GOLD}40` }}>
          <h2 className="text-sm font-bold text-white mb-2">Tu link de venta</h2>
          <p className="text-[11px] text-slate-500 mb-3">Gilson te asigna un cÛdigo. El cliente debe pagar desde este link:</p>
          <div className="flex gap-2 mb-3">
            <input
              value={demoCode}
              onChange={(e) => setDemoCode(e.target.value.toUpperCase())}
              placeholder="TU-CODIGO"
              className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm font-mono"
              data-testid="input-seller-code-demo"
            />
            <button
              type="button"
              onClick={() => copyLink(demoCode)}
              className="px-3 py-2 rounded-lg font-bold text-black text-xs flex items-center gap-1"
              style={{ background: GOLD }}
            >
              <Copy size={14} />
              Copiar
            </button>
          </div>
          <p className="text-[10px] font-mono text-slate-600 break-all">{buildSellerPagosUrl(demoCode || "TU-CODIGO")}</p>
        </section>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/docs/EMBUDO_PLANIFICACION.md"
            download
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5"
          >
            <Download size={16} />
            Embudo PlanificaciÛn (MD)
          </a>
          <a
            href="/docs/KIT_VENDEDORES_PLANIFICACION.md"
            download
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5"
          >
            <Download size={16} />
            Kit vendedores (MD)
          </a>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola Gilson, quiero ser vendedor de PlanificaciÛn SISTEMICAR.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "#25D366" }}
          >
            <MessageCircle size={16} />
            Solicitar cÛdigo
          </a>
        </div>

        <p className="text-[9px] text-slate-600 text-center mt-8 italic">
          Solo PlanificaciÛn en este kit. Espejo es otro producto. No prometas mÛdulos en camino.
        </p>
      </motion.div>
    </div>
  );
}
