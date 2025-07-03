// utilidades simples
export const $ = (id) => document.getElementById(id);
export const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
