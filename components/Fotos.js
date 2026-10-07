'use client';
import { useRef, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { BUCKET, MAX_FOTOS } from '@/lib/fotos';

// Reduce la foto (máx. 1600 px) para que suba rápido con datos móviles.
function comprimir(archivo) {
  return new Promise((ok, fallo) => {
    const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => {
      const e = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? ok(b) : fallo(new Error('x'))), 'image/jpeg', 0.8);
    };
    img.onerror = () => fallo(new Error('x'));
    img.src = url;
  });
}

export default function Fotos({ reporteId, inicial = [], editable = false }) {
  const [fotos, setFotos] = useState(inicial);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const entrada = useRef(null);

  async function agregar(e) {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!archivos.length) return;
    setError(''); setSubiendo(true);
    const supabase = crearClienteNavegador();
    let lista = fotos;
    for (const archivo of archivos) {
      if (lista.length >= MAX_FOTOS) { setError(`Máximo ${MAX_FOTOS} fotos por reporte.`); break; }
      try {
        const blob = await comprimir(archivo);
        const ruta = `${reporteId}/${crypto.randomUUID()}.jpg`;
        const sube = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: 'image/jpeg' });
        if (sube.error) throw sube.error;
        const { data, error: e1 } = await supabase.from('fotos').insert({ reporte_id: reporteId, ruta }).select('id').single();
        if (e1) { await supabase.storage.from(BUCKET).remove([ruta]); throw e1; }
        const firma = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 3600);
        lista = [...lista, { id: data.id, ruta, url: firma.data?.signedUrl }];
        setFotos(lista);
      } catch {
        setError('No se pudo subir una foto. Revisa tu conexión e inténtalo otra vez.');
      }
    }
    setSubiendo(false);
  }

  async function quitar(f) {
    const supabase = crearClienteNavegador();
    const { error: e } = await supabase.from('fotos').delete().eq('id', f.id);
    if (e) { setError('No se pudo quitar la foto.'); return; }
    await supabase.storage.from(BUCKET).remove([f.ruta]);
    setFotos(fotos.filter((x) => x.id !== f.id));
  }

  return (
    <div>
      {fotos.length > 0 && (
        <div className="fotos">
          {fotos.map((f) => (
            <div className="foto" key={f.id}>
              <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt="Foto del reporte" /></a>
              {editable && <button type="button" aria-label="Quitar foto" onClick={() => quitar(f)}>✕</button>}
            </div>
          ))}
        </div>
      )}
      {!fotos.length && !editable && <p className="sub" style={{ margin: 0 }}>Sin fotos.</p>}
      {editable && (
        <>
          <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={agregar} />
          <button type="button" className="btn ghost" style={{ marginTop: fotos.length ? 12 : 0 }}
            disabled={subiendo || fotos.length >= MAX_FOTOS} onClick={() => entrada.current.click()}>
            {subiendo ? 'Subiendo...' : '📷 Agregar fotos'}
          </button>
          <p className="hint">Opcional. Hasta {MAX_FOTOS} fotos ({fotos.length}/{MAX_FOTOS}).</p>
          {error && <div className="err" role="alert">{error}</div>}
        </>
      )}
    </div>
  );
}
