// Armazenamento: Upstash Redis (REST) em produção; memória nos testes/local.
// Variáveis aceitas: UPSTASH_REDIS_REST_URL/TOKEN ou KV_REST_API_URL/TOKEN (Vercel Marketplace).
const mem = new Map();

function remote() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function cmd(args) {
  const r = remote();
  const res = await fetch(r.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${r.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`store ${res.status}`);
  return (await res.json()).result;
}

const now = () => Date.now();
function memGet(k) {
  const v = mem.get(k);
  if (!v) return null;
  if (v.exp && v.exp < now()) {
    mem.delete(k);
    return null;
  }
  return v;
}

export const store = {
  async get(k) {
    if (remote()) return cmd(['GET', k]);
    return memGet(k)?.v ?? null;
  },
  /** ttl em segundos (opcional). nx = só grava se não existir. Retorna true se gravou. */
  async set(k, v, ttl, nx = false) {
    if (remote()) {
      const a = ['SET', k, v];
      if (ttl) a.push('EX', String(ttl));
      if (nx) a.push('NX');
      return (await cmd(a)) === 'OK';
    }
    if (nx && memGet(k)) return false;
    mem.set(k, { v, exp: ttl ? now() + ttl * 1000 : 0 });
    return true;
  },
  async del(k) {
    if (remote()) return void (await cmd(['DEL', k]));
    mem.delete(k);
  },
  /** Contador com janela (segundos). Retorna o valor atual. */
  async hit(k, windowSec) {
    if (remote()) {
      const n = await cmd(['INCR', k]);
      if (n === 1) await cmd(['EXPIRE', k, String(windowSec)]);
      return n;
    }
    const cur = memGet(k);
    const n = (cur ? Number(cur.v) : 0) + 1;
    mem.set(k, { v: String(n), exp: cur ? cur.exp : now() + windowSec * 1000 });
    return n;
  },
  _reset: () => mem.clear(),
};
