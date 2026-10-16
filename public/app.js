const $ = (id) => document.getElementById(id);
const en = !/^pt/i.test(navigator.language || 'pt');
const T = en
  ? { title: 'Add a playlist to your TV', sub: 'Enter the code shown on your TV and your playlist details.', code: 'TV code', type: 'Playlist type', name: 'Name (optional)', url: 'Playlist link', server: 'Server', user: 'Username', pass: 'Password', go: 'Send to TV', note: 'Only add content you have the right to access. The playlist is delivered to the TV once and deleted from the server.', ok: 'Done! Your TV will load the playlist in a few seconds.', net: 'Connection failed. Try again.' }
  : null;
if (T) {
  document.documentElement.lang = 'en';
  const m = { 't-title': T.title, 't-sub': T.sub, 'l-code': T.code, 'l-type': T.type, 'l-name': T.name, 'l-url': T.url, 'l-server': T.server, 'l-user': T.user, 'l-pass': T.pass, go: T.go, 't-note': T.note };
  for (const [k, v] of Object.entries(m)) $(k).textContent = v;
}
const params = new URLSearchParams(location.search);
if (params.get('c')) $('code').value = params.get('c').toUpperCase().slice(0, 6);
$('type').addEventListener('change', () => {
  const x = $('type').value === 'xtream';
  $('g-x').hidden = !x;
  $('g-m3u').hidden = x;
});
const show = (cls, text) => {
  $('msg').className = 'msg ' + cls;
  $('msg').textContent = text;
};
$('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('go').disabled = true;
  $('msg').className = 'msg';
  const type = $('type').value;
  const body = { code: $('code').value.trim().toUpperCase(), type, name: $('name').value };
  if (type === 'm3u') body.url = $('url').value;
  else Object.assign(body, { server: $('server').value, username: $('user').value, password: $('pass').value });
  try {
    const r = await fetch('/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (r.ok) {
      show('ok', T ? T.ok : 'Pronto! A TV carregará a lista em instantes.');
      $('pass').value = '';
    } else show('err', j.error || 'Erro.');
  } catch {
    show('err', T ? T.net : 'Falha de conexão. Tente de novo.');
  }
  $('go').disabled = false;
});
