/* utils.js  ---------------------------------------------------------
 * utilitário genérico usado por vários módulos
 * ----------------------------------------------------------------- */

/* ---------- DOM helper rápido ---------- */
export const $ = id => document.getElementById(id);

/* ---------- formata número em Real ---------- */
export function formatMoney(v) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

/* ------------------------------------------------------------------
 * 1. resizeImage(file, maxSizePx, maxBytes)
 *    - Redimensiona e comprime imagem no navegador.
 *    - Garante que o blob final ≤ maxBytes (padrão 80 KB).
 * ----------------------------------------------------------------- */
export async function resizeImage(
  file,
  maxSize = 600,      // largura/altura máx. em px
  maxBytes = 80 * 1024, // 80 KB
  minQuality = 0.5     // qualidade mínima aceitável
) {
  if (!file.type.startsWith('image/')) return file; // se não for imagem

  // 1) Ler arquivo original
  const dataURL = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  // 2) Desenhar num canvas redimensionado
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataURL;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  // 3) Exportar JPEG/WebP iterando qualidade até ≤ maxBytes
  let quality = 0.9;
  let blob;

  while (quality >= minQuality) {
    blob = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', quality)
    );
    if (blob.size <= maxBytes) break;
    quality -= 0.05;              // diminui 5 % e tenta de novo
  }

  // 4) Se ainda estiver grande, manda mesmo assim (última tentativa)
  const resultFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
    type: blob.type,
    lastModified: Date.now()
  });

  return resultFile;
}

/* ------------------------------------------------------------------
 * 2. uploadImage(file, uid)
 *    - Envia ao Cloudinary; usado em students.js
 * ----------------------------------------------------------------- */
export async function uploadImage(file, uid) {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'unsigned');      // ➜ seu preset
  data.append('folder', `students/${uid}`);      // pasta opcional

  const res  = await fetch(
    'https://api.cloudinary.com/v1_1/dqa8jupnh/image/upload',
    { method: 'POST', body: data }
  );
  const json = await res.json();
  if (json.secure_url) return json.secure_url;
  throw new Error(json.error?.message || 'Falha no upload');
}
