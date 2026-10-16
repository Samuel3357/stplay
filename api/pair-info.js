import { store } from './_lib/store.js';
import { clientIp, hostOf, decrypt, isCode, send } from './_lib/util.js';

/** "Minha lista": com o código mostrado na TV, o celular vê (sem senha) o que está salvo. Corpo: { code } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    if ((await store.hit(`rl:info:${clientIp(req)}`, 60)) > 15) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!isCode(code)) return send(res, 400, { error: 'Código inválido.' });
    const dev = await store.get(`code:${code}`);
    if (!dev) return send(res, 404, { error: 'Código expirado ou inexistente. Gere outro na TV.' });
    const enc = await store.get(`list:${dev}`);
    if (!enc) return send(res, 200, { has: false });
    const p = decrypt(enc);
    return send(res, 200, { has: true, type: p.type, name: p.name, host: hostOf(p.type === 'xtream' ? p.server : p.url) });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
