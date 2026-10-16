import { store } from '../_lib/store.js';
import { TRIAL_DAYS, clientIp, hashDevice, isDeviceId, requestDeviceId, invalidDeviceResponse, send } from '../_lib/util.js';

/** Teste grátis de 10 dias, ancorado no ID persistente do canal. Corpo: { deviceId } */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
  try {
    const ip = clientIp(req);
    if ((await store.hit(`rl:trial:${ip}`, 60)) > 30) return send(res, 429, { error: 'Muitas consultas.' });
    const deviceId = requestDeviceId(req);
    if (!isDeviceId(deviceId)) return invalidDeviceResponse(req, res);
    const k = `trial:${hashDevice(deviceId)}`;
    const now = Date.now();
    await store.set(k, String(now), 0, true); // só grava na primeira vez
    const startedAt = Number(await store.get(k));
    const expiresAt = startedAt + TRIAL_DAYS * 86400000;
    return send(res, 200, {
      startedAt,
      expiresAt,
      now,
      daysLeft: Math.max(0, Math.ceil((expiresAt - now) / 86400000)),
      expired: now >= expiresAt,
    });
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
