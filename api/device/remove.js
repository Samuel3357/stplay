import { store } from '../_lib/store.js';
import { clientIp, hashDevice, isDeviceId, send } from '../_lib/util.js';

/** A TV apaga a lista salva no servidor. Corpo: { deviceId } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    if ((await store.hit(`rl:rm:${clientIp(req)}`, 60)) > 20) return send(res, 429, { error: 'Muitas tentativas.' });
    const deviceId = req.body?.deviceId;
    if (!isDeviceId(deviceId)) return send(res, 400, { error: 'ID de dispositivo inválido.' });
    await store.del(`list:${hashDevice(deviceId)}`);
    return send(res, 200, { ok: true });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
