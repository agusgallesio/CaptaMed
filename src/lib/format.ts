export function fmtMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

export function fmtMoney2(n: number): string {
  return (
    "$" +
    n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function fmtNum(n: number): string {
  return n.toLocaleString("es-AR");
}

export function fmtPct(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
}

export function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
