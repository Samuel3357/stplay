import { store } from '../_lib/store.js';
import { CODE_TTL_SEC, clientIp, hashDevice, isDeviceId, newCode, send } from '../_lib/util.js';

/** A TV pede um código de vinculação. Corpo: { deviceId } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    const ip = clientIp(req);
    if ((await store.hit(`rl:reg:${ip}`, 60)) > 20) return send(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
    const deviceId = req.body?.deviceId;
    if (!isDeviceId(deviceId)) return send(res, 400, { error: 'ID de dispositivo inválido.' });
    const dev = hashDevice(deviceId);
    for (let i = 0; i < 5; i++) {
      const code = newCode();
      if (await store.set(`code:${code}`, dev, CODE_TTL_SEC, true)) return send(res, 200, { code, expiresIn: CODE_TTL_SEC });
    }
    return send(res, 503, { error: 'Tente novamente.' });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
