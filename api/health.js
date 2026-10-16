import { store } from './_lib/store.js';
import { send } from './_lib/util.js';

/** Diagnóstico de configuração: mostra só ok/faltando, nunca valores. GET /api/health */
export default async function handler(req, res) {
  const out = {};
  const s = process.env.PAIR_SECRET;
  out.PAIR_SECRET = !s ? 'FALTANDO' : s.length < 32 ? `CURTO (${s.length} caracteres, mínimo 32)` : 'ok';
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  out.REDIS_URL = !url ? 'FALTANDO' : /^https:\/\//.test(url) ? 'ok' : 'FORMATO ERRADO (deve começar com https://)';
  out.REDIS_TOKEN = !token ? 'FALTANDO' : /\s/.test(token) ? 'TEM ESPAÇO/QUEBRA DE LINHA' : 'ok';
  if (url && token) {
    try {
      await store.set('health:ping', '1', 30);
      out.REDIS_CONEXAO = (await store.get('health:ping')) === '1' ? 'ok' : 'respondeu, mas não gravou';
    } catch (e) {
      out.REDIS_CONEXAO = 'ERRO: ' + String(e?.message || e).slice(0, 80);
    }
  } else {
    out.REDIS_CONEXAO = 'não testado (faltam URL/token)';
  }
  return send(res, 200, out);
}
