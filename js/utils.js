/* utilitário de seleção rápido */
export const $ = id => document.getElementById(id);

/* formata número em Real, sempre com 2 casas */
export function formatMoney(v){
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

/* upload para Cloudinary – já utilizado pelo módulo students */
export async function uploadImage(file, uid){
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'unsigned');          // seu preset
  data.append('folder', `students/${uid}`);          // pasta opcional

  const res  = await fetch('https://api.cloudinary.com/v1_1/dqa8jupnh/image/upload', {
    method : 'POST',
    body   : data
  });
  const json = await res.json();
  if(json.secure_url) return json.secure_url;
  throw new Error(json.error?.message || 'Falha no upload');
}
