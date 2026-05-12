import { motion } from "framer-motion";
import { ArrowLeft, Download, Brain, BarChart3, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";

const GOLD = "#D4AF37";
const PIZARRA = "#0a0a0a";
const EMERALD = "#10B981";
const BLOOD = "#8B0000";
const VIOLET = "#7C3AED";

const MEDIDAS_ACTUALES = [
  { nombre: "Tiempo por unidad (min/u)", desc: "En vehículos Producción e Investigador", psico: "Refleja la velocidad de procesamiento cognitivo aplicada a una tarea específica. Una mejora constante indica que el cerebro está creando autopistas neuronales (mielinización) — la tarea pasa de 'esfuerzo consciente' a 'flujo automático'. Un deterioro puede señalar fatiga cognitiva, distracción interna o conflicto emocional no resuelto que consume recursos atencionales." },
  { nombre: "Mejor tiempo registrado (Bóveda de Récords)", desc: "Récord histórico por tarea", psico: "El récord personal funciona como un 'ancla de competencia' en la psicología del logro. Cuando el usuario sabe que su cerebro fue capaz de X velocidad, se genera una tensión cognitiva saludable (disonancia) entre 'lo que soy capaz' y 'lo que estoy haciendo ahora'. Esta tensión es el motor del crecimiento." },
  { nombre: "Rendimiento consciente", desc: "Si el usuario pone un tiempo mayor que su récord al crear vehículo", psico: "Esta es la medida más reveladora del sistema. Cuando alguien SABE que va a rendir menos y lo declara conscientemente, está externalizando su estado interno. Puede indicar: autoconsciencia madura (sabe sus límites hoy), estado emocional bajo (tristeza, ansiedad, desmotivación), o autoboicot (se pone la excusa antes de empezar). La IA puede diferenciarlos por el patrón temporal." },
  { nombre: "Duración total del vehículo", desc: "Tiempo neto descontando paréntesis de recarga", psico: "La capacidad de sostener atención en una tarea es uno de los mejores predictores de productividad real. En neurociencia, se relaciona con la 'ventana atencional'. Personas con ventanas cortas (<15 min) pueden tener alto nivel de activación del sistema nervioso simpático (estrés crónico). Ventanas largas y sostenidas indican regulación emocional saludable." },
  { nombre: "Estado de energía (óptima/baja)", desc: "Comparación automática vs récord", psico: "Funciona como un termómetro de recursos cognitivos disponibles. La energía 'baja' consistente en ciertos horarios revela el cronotipo real del usuario (si es matutino o vespertino), independientemente de lo que él crea de sí mismo. Los datos no mienten." },
  { nombre: "Diferencia porcentual (energiaDiffPct)", desc: "Cuánto % más lento que su récord", psico: "Cuantifica la 'brecha de rendimiento'. Una brecha del 10-20% es normal (variabilidad humana). Una brecha del 50%+ señala que algo significativo está ocurriendo: problemas de sueño, conflicto personal activo, o fase de agotamiento (burnout incipiente). Es un indicador de alerta temprana." },
  { nombre: "Segmentos cruzados", desc: "Cuántos segmentos atravesó un vehículo activo", psico: "Mide la 'absorción' — cuando alguien cruza segmentos sin cerrar un vehículo, puede significar hiperfoco (positivo: estado de flow) o incapacidad de transición (negativo: rigidez cognitiva). El contexto lo determina: si cruzó por estar inmerso en una tarea productiva, es flow. Si cruzó porque no pudo detenerse, es compulsión." },
  { nombre: "Segmento de origen", desc: "En qué segmento se creó el vehículo", psico: "Permite mapear qué tipo de tareas el usuario elige para cada fase del día. Revela su 'arquitectura de decisión' — ¿pone tareas difíciles al inicio cuando tiene más voluntad? ¿O las posterga? Este patrón predice con alta precisión la tendencia a procrastinar." },
  { nombre: "Puntos de Soberanía (PS)", desc: "Acumulados por cierres, puertas de atención, justificaciones", psico: "Sistema de refuerzo positivo que activa el circuito de recompensa (dopamina). Los PS funcionan como 'evidencia de capacidad' que contrarresta la narrativa interna de 'no puedo' o 'no soy disciplinado'. Con suficiente acumulación, reescribe la autoimagen del usuario." },
  { nombre: "Entropía de segmentos", desc: "Si el usuario no cerró un segmento a tiempo", psico: "La entropía repetida en los mismos segmentos revela 'puntos ciegos' del usuario — zonas del día donde pierde el control. Puede ser el segmento post-almuerzo (caída de glucosa), o el segmento nocturno (fatiga acumulada). Identificar el patrón permite intervención preventiva." },
  { nombre: "Cierre manual vs automático", desc: "Si el usuario cerró activamente o se venció el tiempo", psico: "El cierre manual es un acto de 'agencia' — el usuario decide terminar. El cierre automático es 'pasividad'. Un ratio bajo de cierres manuales indica que el usuario está en modo reactivo en vez de proactivo. Psicológicamente correlaciona con locus de control externo (creer que las cosas le pasan, en vez de que él las controla)." },
  { nombre: "Energía oscura", desc: "Vehículos cerrados fuera de tiempo sin justificación", psico: "Representa la 'deuda cognitiva no reconocida'. El usuario excedió su tiempo pero no quiso o no pudo explicar por qué. Puede indicar vergüenza (evita confrontar su fallo), alexitimia (dificultad para nombrar lo que siente), o simple apatía. La acumulación de energía oscura es un predictor fuerte de abandono del sistema." },
  { nombre: "Justificaciones", desc: "Texto libre explicando excesos de tiempo", psico: "El acto de justificar es terapéutico en sí mismo — obliga a la introspección. El contenido de las justificaciones revela el 'narrativa interna' del usuario: ¿se culpa? ¿culpa al entorno? ¿busca soluciones? ¿minimiza? La IA puede clasificar el tipo de justificación y detectar patrones de pensamiento disfuncionales." },
  { nombre: "Paréntesis de recarga", desc: "Pausas tomadas dentro de un vehículo", psico: "Mide la 'autorregulación activa'. Tomar pausas conscientemente es señal de madurez cognitiva — el usuario sabe que necesita descansar y lo hace. No tomar pausas nunca puede indicar perfeccionismo tóxico o desconexión corporal. Tomar demasiadas pausas puede indicar evitación disfrazada de autocuidado." },
  { nombre: "Sub-tareas completadas", desc: "Progreso granular dentro de cada vehículo", psico: "La capacidad de descomponer una tarea grande en partes pequeñas es una función ejecutiva superior (corteza prefrontal). Usuarios que completan sub-tareas secuencialmente muestran buena planificación. Los que saltan entre sub-tareas pueden tener tendencia a la dispersión atencional." },
  { nombre: "Bono temple", desc: "Si lanzó vehículo fuera de horario de segmento", psico: "Mide la 'voluntad contra la inercia'. Lanzar un vehículo cuando no hay segmento activo requiere motivación intrínseca — no hay estructura externa que lo empuje. Es un indicador de autodeterminación alta y correlaciona con resiliencia psicológica." },
  { nombre: "Voltaje (ejecuciones por tarea)", desc: "En Bóveda de Récords", psico: "El voltaje mide la 'consistencia de práctica'. En la teoría de las 10,000 horas (Ericsson), la repetición deliberada es lo que produce maestría. Un voltaje alto en una tarea específica indica compromiso con la excelencia. Un voltaje bajo disperso en muchas tareas indica 'síndrome del generalista' — sabe un poco de todo pero no domina nada." }
];

const MEDIDAS_FALTANTES = [
  { nombre: "Hora del día vs rendimiento", desc: "¿A qué hora rinde mejor el usuario?", psico: "Permitiría identificar el cronotipo real (matutino, vespertino, intermedio) basado en datos reales, no en lo que el usuario cree. La neurociencia muestra que el pico de cortisol (energía) varía hasta 4 horas entre cronotipos. Trabajar en contra del cronotipo reduce rendimiento hasta 40%." },
  { nombre: "Patrón de pausas", desc: "¿Cuántas pausas toma por sesión? ¿Son productivas o escapismo?", psico: "Revelaría si las pausas siguen un patrón saludable (cada 25-50 min, estilo Pomodoro natural) o errático (pausas cada 5 min = ansiedad; nunca = hiperactivación). El patrón de pausas es uno de los mejores indicadores de salud mental en el contexto laboral." },
  { nombre: "Tendencia de rendimiento", desc: "¿Mejora o empeora con el tiempo?", psico: "Un gráfico de evolución mostraría la 'curva de aprendizaje' real. En psicología del rendimiento, se espera una mejora logarítmica (rápida al inicio, luego meseta). Si la curva es errática, indica inestabilidad emocional. Si es constantemente descendente, es señal de burnout." },
  { nombre: "Ratio de cumplimiento", desc: "% de vehículos cerrados manualmente vs abandonados", psico: "Este ratio es un espejo del 'compromiso con las promesas que se hace a sí mismo'. Un ratio alto (>80%) indica integridad personal alta. Un ratio bajo correlaciona con baja autoeficacia (Bandura) — la persona ha aprendido que no puede confiar en sus propias promesas." },
  { nombre: "Densidad de trabajo por segmento", desc: "¿Cuántos vehículos lanza por segmento?", psico: "Revela la 'capacidad de carga cognitiva'. Algunos usuarios rinden mejor con 1 vehículo enfocado (monotarea), otros con 2-3 en paralelo (multitarea controlada). El dato empírico supera la autoevaluación — muchos creen ser buenos en multitarea cuando los datos muestran lo contrario." },
  { nombre: "Tiempo entre vehículos", desc: "¿Cuánto tiempo muerto entre cierre y apertura?", psico: "El 'tiempo muerto' es psicológicamente complejo. Puede ser: transición saludable (cerebro procesando), procrastinación activa (sabe que debe empezar pero no lo hace), o agotamiento de voluntad (la batería se acabó). El patrón temporal permite diferenciar." },
  { nombre: "Consistencia diaria", desc: "¿Usa el sistema todos los días o tiene baches?", psico: "La consistencia es el predictor #1 de resultados a largo plazo. Los 'baches' de uso revelan los momentos de quiebre del hábito. En psicología conductual, un hábito necesita 66 días promedio para consolidarse. Rastrear la consistencia permite saber en qué fase está el usuario." },
  { nombre: "Tipo de tarea vs rendimiento", desc: "¿En qué tipo de tareas rinde mejor?", psico: "Revelaría las 'fortalezas cognitivas' naturales. Algunos cerebros procesan mejor tareas manuales-repetitivas, otros brillan en tareas creativas-abstractas. Conocer esto permite al usuario diseñar su día alrededor de sus fortalezas reales, no las que imagina." },
  { nombre: "Efecto de la justificación", desc: "¿Después de justificar, mejora o sigue igual?", psico: "Si el rendimiento mejora después de justificar, la justificación funciona como 'catarsis cognitiva' — el acto de nombrar el problema lo resuelve parcialmente. Si no mejora, la justificación es solo racionalización defensiva, y el usuario necesita intervención más profunda." },
  { nombre: "Fatiga acumulada", desc: "¿El rendimiento baja conforme avanza el día?", psico: "La curva de fatiga diaria revela la 'reserva de voluntad' (Baumeister). Algunos usuarios mantienen rendimiento estable todo el día (alta reserva), otros caen dramáticamente después del mediodía (reserva limitada). Este dato permite prescribir estratégicamente cuándo poner tareas difíciles vs fáciles." }
];

export default function MetricasDocumento() {
  const [, navigate] = useLocation();

  const generarTextoDescarga = () => {
    let texto = "";
    texto += "═══════════════════════════════════════════════════════\n";
    texto += "     SISTEMICAR — DOCUMENTO DE MÉTRICAS COGNITIVAS\n";
    texto += "     Sistema de Medición del Rendimiento Humano\n";
    texto += "═══════════════════════════════════════════════════════\n\n";
    texto += `Fecha de generación: ${new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;

    texto += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    texto += " SECCIÓN 1: MÉTRICAS ACTUALMENTE IMPLEMENTADAS\n";
    texto += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    MEDIDAS_ACTUALES.forEach((m, i) => {
      texto += `${i + 1}. ${m.nombre}\n`;
      texto += `   Descripción: ${m.desc}\n`;
      texto += `   Significado Psicológico: ${m.psico}\n\n`;
    });

    texto += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    texto += " SECCIÓN 2: MÉTRICAS PENDIENTES DE IMPLEMENTACIÓN\n";
    texto += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    MEDIDAS_FALTANTES.forEach((m, i) => {
      texto += `${i + 1}. ${m.nombre}\n`;
      texto += `   Descripción: ${m.desc}\n`;
      texto += `   Significado Psicológico: ${m.psico}\n\n`;
    });

    texto += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    texto += " CONCLUSIÓN\n";
    texto += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    texto += "SISTEMICAR no es solo una herramienta de productividad.\n";
    texto += "Es un laboratorio de observación del comportamiento humano.\n\n";
    texto += "Cada métrica captura un aspecto diferente de cómo funciona\n";
    texto += "la mente bajo presión, en reposo, en flow, y en resistencia.\n\n";
    texto += "La combinación de todas estas métricas permite construir un\n";
    texto += "'perfil cognitivo-conductual' único para cada usuario que\n";
    texto += "ningún test psicológico tradicional podría capturar, porque\n";
    texto += "estos datos son reales, longitudinales y contextuales.\n\n";
    texto += "El Doctor IA utiliza estos datos para ofrecer coaching\n";
    texto += "personalizado basado en evidencia real del usuario, no en\n";
    texto += "auto-reportes subjetivos que suelen estar distorsionados\n";
    texto += "por sesgos cognitivos.\n\n";
    texto += "═══════════════════════════════════════════════════════\n";
    texto += "     © SISTEMICAR · Plataforma de Comando Personal\n";
    texto += "═══════════════════════════════════════════════════════\n";

    return texto;
  };

  const handleDescargar = () => {
    const texto = generarTextoDescarga();
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SISTEMICAR_Metricas_Cognitivas.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-24">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/menu")} className="p-2 rounded-lg border border-white/10" data-testid="button-back-metricas">
            <ArrowLeft size={16} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-wider" style={{ color: GOLD, fontFamily: "Playfair Display, serif" }}>MÉTRICAS COGNITIVAS</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Documento de Medición del Rendimiento Humano</p>
          </div>
        </div>

        <motion.button
          onClick={handleDescargar}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider mb-6 flex items-center justify-center gap-3"
          style={{ backgroundColor: `${GOLD}20`, color: GOLD, border: `2px solid ${GOLD}40`, boxShadow: `0 0 30px ${GOLD}15` }}
          data-testid="button-descargar-metricas"
        >
          <Download size={18} />
          Descargar Documento Completo
        </motion.button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} style={{ color: EMERALD }} />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: EMERALD }}>Métricas Implementadas ({MEDIDAS_ACTUALES.length})</h2>
          </div>
          <div className="space-y-3">
            {MEDIDAS_ACTUALES.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="p-3 rounded-xl border" style={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-[11px] font-bold text-white mb-0.5">{i + 1}. {m.nombre}</p>
                <p className="text-[9px] text-slate-500 mb-2">{m.desc}</p>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${VIOLET}08`, border: `1px solid ${VIOLET}15` }}>
                  <div className="flex items-start gap-1.5">
                    <Brain size={10} className="mt-0.5 flex-shrink-0" style={{ color: VIOLET }} />
                    <p className="text-[9px] leading-relaxed" style={{ color: "#a78bfa" }}>{m.psico}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} style={{ color: GOLD }} />
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Métricas Pendientes ({MEDIDAS_FALTANTES.length})</h2>
          </div>
          <div className="space-y-3">
            {MEDIDAS_FALTANTES.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="p-3 rounded-xl border" style={{ backgroundColor: "#0a0a0a", borderColor: `${GOLD}10` }}>
                <p className="text-[11px] font-bold text-white mb-0.5">{i + 1}. {m.nombre}</p>
                <p className="text-[9px] text-slate-500 mb-2">{m.desc}</p>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${VIOLET}08`, border: `1px solid ${VIOLET}15` }}>
                  <div className="flex items-start gap-1.5">
                    <Brain size={10} className="mt-0.5 flex-shrink-0" style={{ color: VIOLET }} />
                    <p className="text-[9px] leading-relaxed" style={{ color: "#a78bfa" }}>{m.psico}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border text-center" style={{ backgroundColor: `${GOLD}05`, borderColor: `${GOLD}15` }}>
          <p className="text-[10px] text-slate-400 leading-relaxed italic" style={{ fontFamily: "Georgia, serif" }}>
            SISTEMICAR no es solo productividad. Es un laboratorio de observación del comportamiento humano. Cada métrica captura cómo funciona la mente bajo presión, en flow y en resistencia.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
