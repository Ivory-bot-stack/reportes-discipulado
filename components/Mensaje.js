export default function Mensaje({ sp }) {
  if (!sp?.msg) return null;
  return <div className={sp.t === 'ok' ? 'aviso ok' : 'err'} role="status">{sp.msg}</div>;
}
