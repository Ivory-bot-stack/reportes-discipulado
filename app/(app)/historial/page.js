import { crearClienteServidor } from '@/lib/supabase/server';
import { etiquetaSemana } from '@/lib/fechas';

const ETQ = { BORRADOR: ['Pendiente', 'pend'], ENVIADO: ['Enviado', ''], REVISADO: ['Revisado', 'ok'] };

export default async function Historial() {
  const supabase = await crearClienteServidor();
  // RLS garantiza que solo lleguen los reportes del mentor con sesión.
  const { data: reportes } = await supabase.from('reportes').select('id, semana_inicio, estado').order('semana_inicio', { ascending: false });
  return (
    <div className="sec" style={{ marginTop: 0 }}><h2>Mis reportes</h2>
      {!reportes?.length && <p className="sub" style={{ margin: 0 }}>Aún no tienes reportes.</p>}
      {reportes?.map((r) => (
        <div className="item" key={r.id}><span>{etiquetaSemana(r.semana_inicio)}</span>
          <span className={`badge ${ETQ[r.estado][1]}`}>{ETQ[r.estado][0]}</span></div>
      ))}
    </div>
  );
}
