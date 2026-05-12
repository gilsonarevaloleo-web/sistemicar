export interface PrincipioMaestro {
  id: string;
  texto: string;
  fuente: string;
  moduloOrigen: string;
  createdAt: Date;
}

export interface DoctorIAResponse {
  diagnostico: string;
  leyAplicada: string | null;
  receta: string;
  preguntaEspejo: string;
}

export function filtrarRespuestaPorPrincipios(
  respuesta: DoctorIAResponse,
  principios: PrincipioMaestro[]
): DoctorIAResponse {
  if (!principios || principios.length === 0) {
    return respuesta;
  }

  if (respuesta.leyAplicada) {
    const leyNormalizada = respuesta.leyAplicada.toLowerCase().trim();
    const principioMatch = principios.find((p) =>
      leyNormalizada.includes(p.texto.toLowerCase().trim()) ||
      p.texto.toLowerCase().trim().includes(leyNormalizada)
    );

    if (principioMatch) {
      return {
        ...respuesta,
        leyAplicada: principioMatch.texto,
      };
    }
  }

  return respuesta;
}

export function construirContextoPrincipios(principios: PrincipioMaestro[]): string {
  if (!principios || principios.length === 0) {
    return "";
  }

  return principios
    .map((p, i) => `LEY ${i + 1}: "${p.texto}" [Fuente: ${p.moduloOrigen}]`)
    .join("\n");
}

export function detectarPrincipioRelevante(
  texto: string,
  principios: PrincipioMaestro[]
): PrincipioMaestro | null {
  if (!principios || principios.length === 0) return null;

  const palabrasTexto = texto.toLowerCase().split(/\s+/);

  let mejorMatch: PrincipioMaestro | null = null;
  let mejorScore = 0;

  for (const principio of principios) {
    const palabrasPrincipio = principio.texto.toLowerCase().split(/\s+/);
    let coincidencias = 0;

    for (const palabra of palabrasPrincipio) {
      if (palabra.length > 3 && palabrasTexto.includes(palabra)) {
        coincidencias++;
      }
    }

    const score = coincidencias / palabrasPrincipio.length;
    if (score > mejorScore && score >= 0.3) {
      mejorScore = score;
      mejorMatch = principio;
    }
  }

  return mejorMatch;
}
