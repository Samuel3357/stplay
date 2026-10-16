const $ = (id) => document.getElementById(id);
const DICT = {
  pt: {
    title: 'Coloque sua lista na TV', sub: 'Escaneie o QR da TV, informe sua lista e pronto: ela fica salva só para o seu aparelho.',
    tabAdd: 'Adicionar lista', tabMine: 'Minha lista', lCode: 'Código mostrado na TV', lType: 'Tipo de lista', lName: 'Nome (opcional)', phName: 'Minha lista',
    lUrl: 'Link da lista', lServer: 'Servidor', lUser: 'Usuário', lPass: 'Senha', send: 'Enviar para a TV',
    note: 'Adicione apenas conteúdo que você tem direito de acessar. A lista é guardada criptografada e ligada somente ao seu aparelho; você pode removê-la quando quiser.',
    ok: 'Pronto! A TV carregará a lista em instantes.', net: 'Falha de conexão. Tente de novo.', err: 'Ocorreu um erro.',
    look: 'Consultar', saved: 'Lista salva neste aparelho', kName: 'Nome', kType: 'Tipo', kHost: 'Servidor', remove: 'Remover lista do servidor',
    replaceNote: 'Para trocar a lista, use a aba “Adicionar lista” com um código novo da TV.', none: 'Nenhuma lista salva para este aparelho.', removed: 'Lista removida do servidor.',
    howTitle: 'Como funciona', s1: 'Na TV, abra o ST PLAY e vá em “Adicionar lista” (aparece sozinho na primeira vez).', s2: 'Escaneie o QR com o celular (o código já vem preenchido) e informe sua lista M3U ou Xtream.', s3: 'A TV recebe a lista em segundos. Se você reinstalar o app, ela volta sozinha.',
    privTitle: 'Privacidade', privText: 'Sem anúncios e sem rastreamento. Sua lista é criptografada, fica ligada apenas ao identificador do seu aparelho e pode ser apagada por você a qualquer momento.',
  },
  en: {
    title: 'Put your playlist on your TV', sub: 'Scan the QR on your TV, enter your playlist and you are done: it stays saved for your device only.',
    tabAdd: 'Add playlist', tabMine: 'My playlist', lCode: 'Code shown on the TV', lType: 'Playlist type', lName: 'Name (optional)', phName: 'My playlist',
    lUrl: 'Playlist link', lServer: 'Server', lUser: 'Username', lPass: 'Password', send: 'Send to TV',
    note: 'Only add content you have the right to access. The playlist is stored encrypted and tied only to your device; you can remove it at any time.',
    ok: 'Done! Your TV will load the playlist in a few seconds.', net: 'Connection failed. Try again.', err: 'Something went wrong.',
    look: 'Look up', saved: 'Playlist saved for this device', kName: 'Name', kType: 'Type', kHost: 'Server', remove: 'Remove playlist from server',
    replaceNote: 'To replace it, use the “Add playlist” tab with a new code from the TV.', none: 'No playlist saved for this device.', removed: 'Playlist removed from the server.',
    howTitle: 'How it works', s1: 'On the TV, open ST PLAY and go to “Add playlist” (it opens by itself the first time).', s2: 'Scan the QR with your phone (the code is pre-filled) and enter your M3U or Xtream playlist.', s3: 'The TV gets it in seconds. If you reinstall the app, it comes back by itself.',
    privTitle: 'Privacy', privText: 'No ads, no tracking. Your playlist is encrypted, tied only to your device identifier, and you can delete it at any time.',
  },
};
let lang = 'pt';
try { lang = localStorage.getItem('lang') || (/^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en'); } catch { lang = /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en'; }
const t = (k) => DICT[lang][k];
function apply() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  $('legal').innerHTML = lang === 'pt'
    ? '<a href="/termos.html">Termos de Uso</a>·<a href="/privacidade.html">Privacidade</a>·<a href="/terms.html">Terms</a>·<a href="/privacy.html">Privacy</a>'
    : '<a href="/terms.html">Terms of Use</a>·<a href="/privacy.html">Privacy</a>·<a href="/termos.html">Termos</a>·<a href="/privacidade.html">Privacidade</a>';
}
for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('lang', lang); } catch { /* ok */ } apply(); });

const params = new URLSearchParams(location.search);
const fromQr = (params.get('c') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
if (fromQr) { $('code').value = fromQr; $('code2').value = fromQr; }

function tab(mine) {
  $('f').hidden = mine; $('mine').hidden = !mine;
  $('tab-add').setAttribute('aria-selected', String(!mine)); $('tab-mine').setAttribute('aria-selected', String(mine));
}
$('tab-add').addEventListener('click', () => tab(false));
$('tab-mine').addEventListener('click', () => tab(true));
$('type').addEventListener('change', () => { const x = $('type').value === 'xtream'; $('g-x').hidden = !x; $('g-m3u').hidden = x; });

const show = (id, cls, text) => { $(id).className = 'msg ' + cls; $(id).textContent = text; };
async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

$('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('go').disabled = true; $('msg').className = 'msg';
  const type = $('type').value;
  const body = { code: $('code').value.trim().toUpperCase(), type, name: $('name').value };
  if (type === 'm3u') body.url = $('url').value;
  else Object.assign(body, { server: $('server').value, username: $('user').value, password: $('pass').value });
  try {
    const { ok, j } = await post('/api/pair', body);
    if (ok) { show('msg', 'ok', t('ok')); $('pass').value = ''; } else show('msg', 'err', j.error || t('err'));
  } catch { show('msg', 'err', t('net')); }
  $('go').disabled = false;
});

$('look').addEventListener('click', async () => {
  $('msg2').className = 'msg'; $('info').hidden = true;
  try {
    const { ok, j } = await post('/api/pair-info', { code: $('code2').value.trim().toUpperCase() });
    if (!ok) return show('msg2', 'err', j.error || t('err'));
    if (!j.has) return show('msg2', 'err', t('none'));
    $('i-name').textContent = j.name; $('i-type').textContent = j.type === 'xtream' ? 'Xtream Codes' : 'M3U / M3U8'; $('i-host').textContent = j.host;
    $('info').hidden = false;
  } catch { show('msg2', 'err', t('net')); }
});
$('del').addEventListener('click', async () => {
  try {
    const { ok, j } = await post('/api/pair-remove', { code: $('code2').value.trim().toUpperCase() });
    if (ok) { $('info').hidden = true; show('msg2', 'ok', t('removed')); } else show('msg2', 'err', j.error || t('err'));
  } catch { show('msg2', 'err', t('net')); }
});
apply();
if (params.get('tab') === 'mine') tab(true);
