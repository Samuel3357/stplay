import crypto from 'node:crypto';

export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L
export const CODE_TTL_SEC = 15 * 60;
export const TRIAL_DAYS = 10;

function secret() {
  const s = process.env.PAIR_SECRET;
  if (!s || s.length < 32) throw new Error('PAIR_SECRET ausente ou curto (mínimo 32 caracteres).');
  return s;
}

/** Hash do ID do dispositivo: o ID bruto nunca é gravado. */
export const hashDevice = (id) => crypto.createHmac('sha256', secret()).update('dev:' + id).digest('hex');

export function newCode() {
  let out = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

const key = () => crypto.createHash('sha256').update('enc:' + secret()).digest();

export function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}

export function decrypt(b64) {
  const buf = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8'));
}

export const isDeviceId = (v) => typeof v === 'string' && /^[A-Za-z0-9]{16,64}$/.test(v);
export const isCode = (v) => typeof v === 'string' && /^[A-Z2-9]{6}$/.test(v) && [...v].every((c) => CODE_ALPHABET.includes(c));

export function clientIp(req) {
  const f = req.headers?.['x-forwarded-for'];
  return (typeof f === 'string' ? f.split(',')[0].trim() : '') || req.socket?.remoteAddress || 'unknown';
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Valida e normaliza a lista enviada pelo usuário. Retorna {ok, value} ou {ok:false, error}. */
export function validatePlaylist(b) {
  const bad = (error) => ({ ok: false, error });
  if (!b || typeof b !== 'object') return bad('Dados inválidos.');
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 40) : '';
  const httpUrl = (u, label) => {
    if (typeof u !== 'string' || u.length > 1000) return `${label} inválido.`;
    try {
      const p = new URL(u.trim());
      if (p.protocol !== 'http:' && p.protocol !== 'https:') return `${label} deve começar com http:// ou https://`;
    } catch {
      return `${label} inválido.`;
    }
    return null;
  };
  if (b.type === 'm3u') {
    const e = httpUrl(b.url, 'Link da lista');
    if (e) return bad(e);
    return { ok: true, value: { type: 'm3u', name: name || 'Minha lista', url: b.url.trim() } };
  }
  if (b.type === 'xtream') {
    const e = httpUrl(b.server, 'Servidor');
    if (e) return bad(e);
    if (typeof b.username !== 'string' || !b.username.trim() || b.username.length > 200) return bad('Usuário inválido.');
    if (typeof b.password !== 'string' || !b.password || b.password.length > 200) return bad('Senha inválida.');
    return {
      ok: true,
      value: { type: 'xtream', name: name || 'Minha lista', server: b.server.trim().replace(/\/+$/, ''), username: b.username.trim(), password: b.password },
    };
  }
  return bad('Escolha M3U ou Xtream.');
}

/** Referência curta (10 hex) do aparelho, segura para mostrar na TV e usar na lista de acesso livre. */
export const deviceRef = (hash) => hash.slice(0, 10);

/** Aparelhos com acesso livre (testes do dono): variável FREE_DEVICES = refs separadas por vírgula. */
export function isFree(hash) {
  const list = (process.env.FREE_DEVICES || '').split(',').map((x) => x.trim().toLowerCase()).filter((x) => x.length >= 10);
  return list.some((r) => hash.startsWith(r));
}

export const hostOf = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
};
