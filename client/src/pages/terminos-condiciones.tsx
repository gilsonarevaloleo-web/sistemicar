import { motion } from "framer-motion";
import { 
  Shield, 
  Scale, 
  Lock, 
  FileText, 
  AlertTriangle, 
  Globe,
  Gavel,
  Building,
  User,
  Mail,
  ChevronLeft
} from "lucide-react";
import { Link } from "wouter";

const GOLD = "#D4AF37";

const secciones = [
  {
    id: "objeto",
    titulo: "1. OBJETO Y ACEPTACIÓN",
    icono: FileText,
    contenido: `Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma SISTEMICAR (en adelante, "la Plataforma"), propiedad de Gilson Arevalo Pezo, identificado con DNI 46114187, con domicilio en Cond. Los Tulipanes de Carapongo Mz. A Lt. 10, Lima, Perú.

El acceso y uso de la Plataforma implica la aceptación expresa, plena y sin reservas de todos los términos aquí contenidos. Si el Usuario no está de acuerdo con alguno de estos términos, debe abstenerse de utilizar la Plataforma.`
  },
  {
    id: "definiciones",
    titulo: "2. DEFINICIONES",
    icono: Scale,
    contenido: `• "Usuario": Toda persona natural o jurídica que acceda y utilice la Plataforma.
• "Plataforma": El software, aplicación web y todos los servicios ofrecidos bajo el nombre SISTEMICAR.
• "Contenido": Toda información, textos, gráficos, imágenes, registros y datos generados o almacenados en la Plataforma.
• "Puntos de Soberanía": Sistema de gamificación interno sin valor monetario real.
• "Suscripción": Acceso premium a funcionalidades adicionales mediante pago periódico.`
  },
  {
    id: "naturaleza",
    titulo: "3. NATURALEZA DEL SERVICIO",
    icono: AlertTriangle,
    contenido: `SISTEMICAR es una herramienta de productividad personal y bienestar mental que utiliza técnicas de gamificación y auto-observación. 

IMPORTANTE: LA PLATAFORMA NO CONSTITUYE NI REEMPLAZA:
• Tratamiento médico, psicológico o psiquiátrico
• Asesoría profesional de salud mental
• Diagnóstico de condiciones médicas o psicológicas
• Terapia o intervención clínica de ningún tipo

El Usuario reconoce que SISTEMICAR es únicamente una herramienta de apoyo personal y que ante cualquier situación de salud mental debe consultar con profesionales calificados.`
  },
  {
    id: "limitacion",
    titulo: "4. LIMITACIÓN DE RESPONSABILIDAD",
    icono: Shield,
    contenido: `El Propietario de SISTEMICAR NO será responsable por:

a) Daños directos, indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de uso de la Plataforma.

b) Decisiones personales, profesionales, financieras o de cualquier índole que el Usuario tome basándose en el contenido o resultados de la Plataforma.

c) Pérdida de datos, interrupción del servicio, errores de software o cualquier falla técnica.

d) Contenido generado por inteligencia artificial, el cual es meramente orientativo y no constituye consejo profesional.

e) Resultados específicos de productividad, bienestar o cualquier otro beneficio esperado por el Usuario.

EN NINGÚN CASO LA RESPONSABILIDAD TOTAL DEL PROPIETARIO EXCEDERÁ EL MONTO PAGADO POR EL USUARIO EN LOS ÚLTIMOS 12 MESES DE SUSCRIPCIÓN.`
  },
  {
    id: "propiedad",
    titulo: "5. PROPIEDAD INTELECTUAL",
    icono: Lock,
    contenido: `Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo pero no limitado a:

• Código fuente, algoritmos y arquitectura de software
• Diseño visual, interfaz de usuario y experiencia de usuario
• Nombres, logos, marcas y elementos gráficos
• Metodologías, sistemas de puntos y mecánicas de gamificación
• Contenido textual, conceptos y filosofía del producto

Son propiedad exclusiva de Gilson Arevalo Pezo o sus licenciantes. 

Queda expresamente prohibida la reproducción, distribución, modificación, ingeniería inversa, o cualquier uso no autorizado del contenido de la Plataforma sin consentimiento escrito previo.`
  },
  {
    id: "privacidad",
    titulo: "6. PRIVACIDAD Y DATOS PERSONALES",
    icono: User,
    contenido: `El tratamiento de datos personales se rige por nuestra Política de Privacidad y la Ley N° 29733, Ley de Protección de Datos Personales del Perú.

El Usuario autoriza expresamente:
• La recolección de datos de registro y uso de la Plataforma
• El almacenamiento seguro de información personal
• El procesamiento de datos para mejora del servicio
• La comunicación de actualizaciones y novedades

El Usuario tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales mediante solicitud escrita.`
  },
  {
    id: "suscripciones",
    titulo: "7. SUSCRIPCIONES Y PAGOS",
    icono: Building,
    contenido: `Las suscripciones premium se procesan a través de proveedores de pago autorizados. 

Políticas de pago:
• Los cargos se realizan de forma anticipada según el período seleccionado
• Las renovaciones son automáticas salvo cancelación previa
• No hay reembolsos por períodos no utilizados
• Los precios pueden modificarse con 30 días de anticipación

El Usuario es responsable de mantener actualizados sus datos de pago y de cancelar la suscripción antes de la renovación si no desea continuar.`
  },
  {
    id: "terminacion",
    titulo: "8. TERMINACIÓN",
    icono: AlertTriangle,
    contenido: `El Propietario se reserva el derecho de suspender o terminar el acceso del Usuario en caso de:

• Violación de estos Términos y Condiciones
• Uso fraudulento o abusivo de la Plataforma
• Conducta que afecte a otros usuarios o al funcionamiento del servicio
• Incumplimiento de obligaciones de pago

El Usuario puede cancelar su cuenta en cualquier momento. Tras la cancelación, los datos podrán ser eliminados según lo establecido en la Política de Privacidad.`
  },
  {
    id: "modificaciones",
    titulo: "9. MODIFICACIONES",
    icono: FileText,
    contenido: `El Propietario se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán notificadas a través de la Plataforma y/o correo electrónico.

El uso continuado de la Plataforma después de la notificación de cambios constituye la aceptación de los nuevos términos.`
  },
  {
    id: "jurisdiccion",
    titulo: "10. LEY APLICABLE Y JURISDICCIÓN",
    icono: Gavel,
    contenido: `Los presentes Términos y Condiciones se rigen por las leyes de la República del Perú.

Para cualquier controversia derivada de la interpretación o ejecución de estos términos, las partes se someten expresamente a la JURISDICCIÓN DE LOS JUZGADOS Y TRIBUNALES DE LIMA, PERÚ, renunciando a cualquier otro fuero que pudiera corresponderles.

Centro de Arbitraje: En caso de disputa, las partes podrán someter la controversia al Centro de Arbitraje de la Cámara de Comercio de Lima.`
  },
  {
    id: "contacto",
    titulo: "11. CONTACTO",
    icono: Mail,
    contenido: `Para cualquier consulta relacionada con estos Términos y Condiciones:

Titular: Gilson Arevalo Pezo
Correo: gilsonarevalo.leo@gmail.com
Teléfono: +51 918 260 514
Ubicación: Lima, Perú

Última actualización: Enero 2026`
  }
];

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#050505" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/menu">
            <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6">
              <ChevronLeft size={18} />
              <span className="text-sm">Volver al menú</span>
            </button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
            >
              <Scale size={28} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 
                className="text-2xl font-black italic text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Términos y Condiciones
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                Blindaje Legal SISTEMICAR
              </p>
            </div>
          </div>

          <div 
            className="p-4 rounded-2xl mb-6"
            style={{ backgroundColor: "rgba(212, 175, 55, 0.08)", border: `1px solid ${GOLD}20` }}
          >
            <p className="text-sm text-zinc-400 leading-relaxed">
              Este documento establece los términos legales que rigen el uso de la plataforma SISTEMICAR. 
              Al utilizar nuestros servicios, usted acepta estar sujeto a estas condiciones.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {secciones.map((seccion, idx) => {
            const IconComponent = seccion.icono;
            return (
              <motion.div
                key={seccion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl overflow-hidden"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${GOLD}15` }}
                    >
                      <IconComponent size={16} style={{ color: GOLD }} />
                    </div>
                    <h2 
                      className="text-base font-bold text-white italic"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {seccion.titulo}
                    </h2>
                  </div>
                  <div className="pl-11">
                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                      {seccion.contenido}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 p-6 rounded-2xl text-center"
          style={{ 
            backgroundColor: "rgba(212, 175, 55, 0.05)",
            border: `1px solid ${GOLD}20`
          }}
        >
          <Globe size={24} className="mx-auto mb-3" style={{ color: GOLD }} />
          <p 
            className="text-lg font-bold italic text-white mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            "La soberanía personal requiere un marco de protección mutua"
          </p>
          <p className="text-xs text-slate-500">
            Documento válido bajo jurisdicción peruana • Lima, Perú
          </p>
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/libro-reclamaciones">
            <button 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: "#3b82f620", color: "#3b82f6", border: "1px solid #3b82f640" }}
            >
              <FileText size={16} />
              Libro de Reclamaciones
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
