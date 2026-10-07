export const BUCKET = 'reportes-fotos';
export const MAX_FOTOS = 6;

// Fotos de un reporte con enlaces temporales (1 hora). El bucket es privado.
export async function cargarFotos(supabase, reporteId) {
  const { data } = await supabase.from('fotos').select('id, ruta').eq('reporte_id', reporteId).order('id');
  if (!data?.length) return [];
  const { data: firmadas } = await supabase.storage.from(BUCKET).createSignedUrls(data.map((f) => f.ruta), 3600);
  return data.map((f) => ({ ...f, url: firmadas?.find((x) => x.path === f.ruta)?.signedUrl }));
}
