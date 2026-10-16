import { store } from './_lib/store.js';
import { CODE_TTL_SEC, clientIp, encrypt, isCode, send, validatePlaylist } from './_lib/util.js';

/** O celular envia a lista para o código mostrado na TV. */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    const ip = clientIp(req);
    if ((await store.hit(`rl:pair:${ip}`, 60)) > 15) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!isCode(code)) return send(res, 400, { error: 'Código inválido. Confira o código mostrado na TV.' });
    const dev = await store.get(`code:${code}`);
    if (!dev) return send(res, 404, { error: 'Código expirado ou inexistente. Gere outro na TV.' });
    const v = validatePlaylist(req.body);
    if (!v.ok) return send(res, 400, { error: v.error });
    // Lista guardada (criptografada) SOMENTE sob o hash deste aparelho; o código só sinaliza a entrega.
    await store.set(`list:${dev}`, encrypt(v.value));
    await store.set(`ready:${code}`, '1', CODE_TTL_SEC);
    return send(res, 200, { ok: true });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
