import { store } from '../_lib/store.js';
import { clientIp, decrypt, hashDevice, isCode, isDeviceId, send } from '../_lib/util.js';

/** A TV consulta se a lista chegou. Avisa a TV que a lista chegou (o código é descartado). Query: deviceId, code */
export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Método não permitido.' });
  try {
    const ip = clientIp(req);
    if ((await store.hit(`rl:poll:${ip}`, 60)) > 60) return send(res, 429, { error: 'Muitas consultas.' });
    const { deviceId, code } = req.query ?? {};
    if (!isDeviceId(deviceId) || !isCode(code)) return send(res, 400, { error: 'Parâmetros inválidos.' });
    const owner = await store.get(`code:${code}`);
    if (!owner) return send(res, 404, { status: 'expired' });
    if (owner !== hashDevice(deviceId)) return send(res, 403, { error: 'Código pertence a outro dispositivo.' });
    if (!(await store.get(`ready:${code}`))) return send(res, 200, { status: 'waiting' });
    const enc = await store.get(`list:${owner}`);
    if (!enc) return send(res, 200, { status: 'waiting' });
    const playlist = decrypt(enc);
    await store.del(`ready:${code}`);
    await store.del(`code:${code}`);
    return send(res, 200, { status: 'ready', playlist });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
