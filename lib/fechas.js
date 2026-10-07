const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

// "2026-10-05" -> "5 - 11 octubre"
export function etiquetaSemana(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const a = new Date(y, m - 1, d), b = new Date(y, m - 1, d + 6);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} - ${b.getDate()} ${MES[b.getMonth()]}`
    : `${a.getDate()} ${MES[a.getMonth()]} - ${b.getDate()} ${MES[b.getMonth()]}`;
}
export const dinero = (n) => 'C$ ' + Number(n || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const porcentaje = (a, b) => (b ? Math.round((a / b) * 100) : 0);
