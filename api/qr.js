import QRCode from 'qrcode';
import { store } from './_lib/store.js';
import { clientIp, isCode, send } from './_lib/util.js';

/** PNG do QR que leva ao site de vinculação já com o código. GET /api/qr?c=ABC234 */
export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Método não permitido.' });
  try {
    if ((await store.hit(`rl:qr:${clientIp(req)}`, 60)) > 60) return send(res, 429, { error: 'Muitas consultas.' });
    const c = typeof req.query?.c === 'string' ? req.query.c.toUpperCase() : '';
    if (!isCode(c)) return send(res, 400, { error: 'Código inválido.' });
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    if (!host || !/^[a-z0-9.:-]+$/i.test(host)) return send(res, 400, { error: 'Host inválido.' });
    const png = await QRCode.toBuffer(`https://${host}/?c=${c}`, { type: 'png', margin: 2, width: 360, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.end(png);
  } catch {
    return send(res, 500, { error: 'Erro interno.' });
  }
}
