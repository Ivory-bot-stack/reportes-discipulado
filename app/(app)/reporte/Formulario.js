'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarBorrador, enviarReporte } from './actions';
import { dinero, porcentaje } from '@/lib/fechas';
import Fotos from '@/components/Fotos';

const GRUPOS = [['LIDER', 'Líderes'], ['SUBLIDER', 'Sublíderes'], ['DISCIPULO', 'Discípulos']];

function Fila({ texto, activo, onClick }) {
  return <button type="button" className="row" aria-pressed={activo} onClick={onClick}><span className="box" />{texto}</button>;
}

export default function Formulario({ reporte, asistencias, fotos }) {
  const router = useRouter();
  const [mentor, setMentor] = useState(reporte.mentor_asistio);
  const [asis, setAsis] = useState(Object.fromEntries(asistencias.map((a) => [a.id, a.asistio])));
  const [c, setC] = useState({
    ofrenda: Number(reporte.ofrenda) || '', diezmos: Number(reporte.diezmos) || '',
    tema: reporte.tema, seguimiento: reporte.seguimiento, observaciones: reporte.observaciones,
  });
  const [error, setError] = useState('');
  const [nota, setNota] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const primera = useRef(true);
  const datos = { mentor_asistio: mentor, asistencia: asis, ...c };

  // Autoguardado del borrador
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const t = setTimeout(async () => {
      const r = await guardarBorrador(reporte.id, datos);
      setNota(r?.error ? 'No se pudo guardar. Revisa tu conexión.' : 'Borrador guardado');
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor, asis, c]);

  const disc = asistencias.filter((a) => a.personas.tipo === 'DISCIPULO');
  const dPres = disc.filter((a) => asis[a.id]).length;
  const pres = asistencias.filter((a) => asis[a.id]).length;
  const pct = porcentaje(pres, asistencias.length);
  const cambiar = (k) => (e) => setC({ ...c, [k]: e.target.value });

  function revisar() {
    if (!c.tema.trim()) { setError('Escribe el tema que impartiste.'); return; }
    if (Number(c.ofrenda) < 0 || Number(c.diezmos) < 0) { setError('Los montos no pueden ser negativos.'); return; }
    setError(''); setConfirmar(true);
  }
  async function enviar() {
    setEnviando(true);
    const r = await enviarReporte(reporte.id, datos);
    if (r?.error) { setError(r.error); setConfirmar(false); setEnviando(false); return; }
    router.refresh();
  }

  return (
    <>
      <div className="sec"><h2>Asistencia</h2>
        <p className="etq">Mentor</p>
        <Fila texto="Asistió" activo={mentor} onClick={() => setMentor(!mentor)} />
        {GRUPOS.map(([tipo, titulo]) => {
          const lista = asistencias.filter((a) => a.personas.tipo === tipo);
          return lista.length ? (
            <div key={tipo}><p className="etq">{titulo}</p>
              {lista.map((a) => <Fila key={a.id} texto={a.personas.nombre} activo={!!asis[a.id]} onClick={() => setAsis({ ...asis, [a.id]: !asis[a.id] })} />)}
            </div>
          ) : null;
        })}
        <div className="stats">
          <div className="stat"><b>{dPres}/{disc.length}</b><span>Discípulos</span></div>
          <div className="stat"><b>{pct}%</b><span>Asistencia</span></div>
        </div>
      </div>
      <div className="sec"><h2>Finanzas</h2>
        <label className="f" style={{ marginTop: 0 }} htmlFor="of">Ofrenda</label>
        <div className="money"><i>C$</i><input id="of" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={c.ofrenda} onChange={cambiar('ofrenda')} /></div>
        <label className="f" htmlFor="di">Diezmos</label>
        <div className="money"><i>C$</i><input id="di" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={c.diezmos} onChange={cambiar('diezmos')} /></div>
      </div>
      <div className="sec"><h2>Tema impartido</h2>
        <input type="text" placeholder="¿Qué enseñaste esta semana?" value={c.tema} onChange={cambiar('tema')} aria-label="Tema impartido" /></div>
      <div className="sec"><h2>Seguimiento</h2>
        <label className="f" style={{ marginTop: 0 }} htmlFor="se">¿Alguien necesita atención?</label>
        <textarea id="se" placeholder="Nombre y motivo" value={c.seguimiento} onChange={cambiar('seguimiento')} /></div>
      <div className="sec"><h2>Observaciones</h2>
        <textarea placeholder="Algo más que el pastor deba saber" value={c.observaciones} onChange={cambiar('observaciones')} aria-label="Observaciones" /></div>
      <div className="sec"><h2>Fotos</h2><Fotos reporteId={reporte.id} inicial={fotos} editable /></div>
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn gold" onClick={revisar}>Enviar reporte</button>
      <p className="hint">{nota || 'Tus datos se guardan solos mientras escribes.'}</p>

      {confirmar && (
        <div className="veil"><div className="sheet" role="dialog" aria-modal="true">
          <h2>¿Enviar el reporte?</h2>
          <p>Discípulos {dPres}/{disc.length} · Asistencia {pct}% · Ofrenda {dinero(c.ofrenda)} · Diezmos {dinero(c.diezmos)}</p>
          <p>Después de enviarlo no podrás modificarlo.</p>
          <button className="btn" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando...' : 'Sí, enviar reporte'}</button>
          <button className="btn ghost" onClick={() => setConfirmar(false)} disabled={enviando}>Volver a revisar</button>
        </div></div>
      )}
    </>
  );
}
