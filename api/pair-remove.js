import { store } from './_lib/store.js';
import { clientIp, isCode, send } from './_lib/util.js';

/** Remove a lista salva do aparelho dono do código. Corpo: { code } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    if ((await store.hit(`rl:prm:${clientIp(req)}`, 60)) > 15) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!isCode(code)) return send(res, 400, { error: 'Código inválido.' });
    const dev = await store.get(`code:${code}`);
    if (!dev) return send(res, 404, { error: 'Código expirado ou inexistente. Gere outro na TV.' });
    await store.del(`list:${dev}`);
    return send(res, 200, { ok: true });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
