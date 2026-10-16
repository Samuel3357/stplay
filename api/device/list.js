import { store } from '../_lib/store.js';
import { clientIp, decrypt, hashDevice, isDeviceId, send } from '../_lib/util.js';

/** A TV pede a lista salva para ELA (ex.: após reinstalar). Corpo: { deviceId } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    if ((await store.hit(`rl:list:${clientIp(req)}`, 60)) > 30) return send(res, 429, { error: 'Muitas consultas.' });
    const deviceId = req.body?.deviceId;
    if (!isDeviceId(deviceId)) return send(res, 400, { error: 'ID de dispositivo inválido.' });
    const enc = await store.get(`list:${hashDevice(deviceId)}`);
    return send(res, 200, { playlist: enc ? decrypt(enc) : null });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
