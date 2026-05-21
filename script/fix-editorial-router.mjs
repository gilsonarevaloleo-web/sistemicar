import fs from "fs";

const p = "server/editorialKnowledgeRouter.ts";
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("export function extractFichaForCarril");
const end = s.indexOf("export function getFichaText", start);
if (start === -1 || end === -1) {
  console.error("markers not found");
  process.exit(1);
}

const replacement = `export function extractFichaForCarril(fichaText: string, carril: EditorialCarril): string {
  if (!fichaText?.trim()) return "";
  const metodo = "M\\u00C9TODO";
  const stopLector = ["AL USUARIO", \`\${metodo} DE INTERVENCI\\u00D3N\`, \`\${metodo} DE\`, "NOTA DEL", SECTION_LINE];
  const stopExtranjero = ["AL LECTOR", "AL USUARIO", metodo, "NOTA DEL", SECTION_LINE];
  const material = sliceFichaByRegex(
    fichaText,
    /MATERIAL DE OBSTRUCCI[\\u00D3O]N:/i,
    ["AL EXTRA", "AL LECTOR", "LA BRECHA", SECTION_LINE]
  );
  if (carril === 1) {
    const extranjero = sliceFichaSection(fichaText, "AL EXTRA", stopExtranjero);
    const solucion = sliceFichaByRegex(
      fichaText,
      /SOLUCI[\\u00D3O]N AUT[\\u00C1A]RQUICA/i,
      [metodo, "NOTA DEL", "AL LECTOR", SECTION_LINE]
    );
    return ["=== FICHA EXTRACTO CARRIL 1 ===", material, extranjero, solucion].filter(Boolean).join("\\n\\n");
  }
  if (carril === 2) {
    const lector = sliceFichaSection(fichaText, "AL LECTOR", stopLector);
    const brecha = sliceFichaSection(fichaText, "LA BRECHA", ["CLIENTE", metodo, "AL USUARIO", SECTION_LINE]);
    const cliente = sliceFichaByRegex(fichaText, /CLIENTE/i, [metodo, "AL USUARIO", "NOTA DEL", SECTION_LINE]);
    return ["=== FICHA EXTRACTO CARRIL 2 ===", material, brecha, lector, cliente].filter(Boolean).join("\\n\\n");
  }
  return \`=== FICHA CARRIL 3 COMPLETA ===\\n\${fichaText}\`;
}

`;

s = s.slice(0, start) + replacement + s.slice(end);
fs.writeFileSync(p, s, "utf8");
console.log("Replaced extractFichaForCarril");
