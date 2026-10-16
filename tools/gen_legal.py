#!/usr/bin/env python3
"""Gera as páginas legais (HTML, site) e os textos (TXT, canal Roku) a partir de UM texto-fonte.
Preencha as constantes abaixo e rode:  python3 tools/gen_legal.py
Os textos são um MODELO: peça revisão a um advogado antes de publicar."""
import html, pathlib, sys

RESPONSAVEL = "SamTech"
EMAIL = "reizindofogo@gmail.com"
SITE = "https://stplay.vercel.app"
FORO = "Brasil"
DATA = "15/10/2026"
VERSAO = "1.0"
PRECO = "R$ 30,00"
TRIAL = "10"

DOCS = {
 "termos": ("pt", "Termos de Uso", [
  ("1. O que é o ST PLAY", [f"O ST PLAY é apenas um reprodutor de listas (M3U/M3U8 e Xtream Codes). O app NÃO fornece, hospeda, vende nem indica canais, filmes, séries ou listas, e não inclui conteúdo próprio de terceiros."]),
  ("2. Responsabilidade pelo conteúdo", ["Você é o único responsável pelas listas e pelo conteúdo que adiciona ao app e declara ter o direito de acessá-lo.", "É proibido usar o app para acessar conteúdo pirata ou obtido sem autorização do titular dos direitos.", "Não somos responsáveis pela origem, legalidade, qualidade ou disponibilidade do conteúdo de listas de terceiros."]),
  ("3. Teste grátis e licença vitalícia", [f"Cada aparelho tem {TRIAL} dias de teste grátis. Depois, para continuar usando, é necessária uma compra única de {PRECO} (licença vitalícia), processada pela plataforma de pagamentos da Roku.", "\"Vitalícia\" significa válida enquanto o app estiver disponível na loja da Roku. Se o app for removido ou descontinuado por exigência legal, da plataforma ou da loja, a licença acompanha essa disponibilidade, nos termos da loja.", "Reembolsos seguem as regras da Roku."]),
  ("4. Disponibilidade", ["O app é fornecido \"como está\", sem garantia de funcionamento ininterrupto, compatibilidade com todos os formatos ou disponibilidade de qualquer stream.", "O app pode ser suspenso, limitado ou removido quando exigido por lei, ordem de autoridade ou regras da plataforma (como a Roku)."]),
  ("5. Uso proibido", ["Violar direitos autorais ou outras leis; contornar o teste grátis ou a licença; sobrecarregar ou atacar o site/serviço de vinculação."]),
  ("6. Limitação de responsabilidade", ["Na extensão permitida pela lei, não respondemos por danos indiretos, perda de dados ou de acesso decorrentes do uso do app ou de conteúdo de terceiros."]),
  ("7. Denúncias e contato", [f"Para denúncias (inclusive de direitos autorais) ou dúvidas: {EMAIL}. Responsável: {RESPONSAVEL}."]),
  ("8. Alterações e foro", [f"Os termos podem mudar; mudanças relevantes exigirão novo aceite. Foro: {FORO}."]),
 ]),
 "privacidade": ("pt", "Política de Privacidade", [
  ("1. Resumo", ["O ST PLAY não usa anúncios, não faz rastreamento e não vende dados."]),
  ("2. Dados que ficam só no seu aparelho", ["Histórico, favoritos, posições de reprodução e configurações ficam armazenados localmente no aparelho e não são enviados para nós."]),
  ("3. Sua lista (vinculação pelo celular)", ["Quando você usa o QR code, a lista que você informa (link M3U ou servidor, usuário e senha Xtream) é enviada ao nosso servidor, guardada CRIPTOGRAFADA (AES-256-GCM) e ligada apenas ao identificador do seu aparelho (em forma de hash). Ela é mantida até você removê-la, na TV (Configurações) ou no site (aba Minha lista), e serve para a lista voltar sozinha se você reinstalar o app.", "Somente o seu aparelho consegue recuperar a lista. Não registramos o conteúdo (links, usuários ou senhas) em logs e não acessamos o endereço da sua lista."]),
  ("4. Teste grátis", [f"Para controlar os {TRIAL} dias de teste, guardamos um identificador do aparelho em forma irreversível (hash) e a data de início. Não guardamos seu nome, e-mail ou o identificador bruto."]),
  ("5. Segurança e provedores", ["Usamos HTTPS e limites de tentativas por endereço IP (contadores temporários). O site é hospedado na Vercel, que pode manter registros técnicos de acesso (como IP) conforme a política dela. As compras são processadas pela Roku; não recebemos dados de pagamento."]),
  ("6. Seus direitos (LGPD)", [f"Você pode apagar sua lista a qualquer momento (TV ou site) e pedir informações ou a exclusão dos dados do teste grátis escrevendo para {EMAIL}."]),
  ("7. Crianças", ["O app não é direcionado a crianças."]),
  ("8. Contato", [f"{RESPONSAVEL} — {EMAIL}"]),
 ]),
 "terms": ("en", "Terms of Use", [
  ("1. What ST PLAY is", ["ST PLAY is only a player for playlists (M3U/M3U8 and Xtream Codes). It does NOT provide, host, sell or recommend channels, movies, series or playlists."]),
  ("2. Responsibility for content", ["You are solely responsible for the playlists and content you add and you represent that you have the right to access them.", "Using the app to access pirated or unauthorized content is prohibited.", "We are not responsible for the origin, legality, quality or availability of third-party content."]),
  ("3. Free trial and lifetime license", [f"Each device gets a {TRIAL}-day free trial. To keep using the app afterwards, a one-time purchase of {PRECO} (lifetime license) is required, processed by Roku's payment platform.", "\"Lifetime\" means valid for as long as the app remains available in the Roku store. If the app is removed or discontinued due to legal, platform or store requirements, the license follows that availability, under the store's terms.", "Refunds follow Roku's rules."]),
  ("4. Availability", ["The app is provided \"as is\", without warranty of uninterrupted operation, compatibility with every format, or availability of any stream.", "The app may be suspended, limited or removed when required by law, authority order or platform rules (such as Roku's)."]),
  ("5. Prohibited use", ["Infringing copyright or other laws; circumventing the trial or license; overloading or attacking the pairing site/service."]),
  ("6. Limitation of liability", ["To the extent permitted by law, we are not liable for indirect damages, data loss or loss of access arising from use of the app or third-party content."]),
  ("7. Reports and contact", [f"For reports (including copyright) or questions: {EMAIL}. Responsible party: {RESPONSAVEL}."]),
  ("8. Changes and jurisdiction", [f"Terms may change; material changes will require new acceptance. Jurisdiction: {FORO}."]),
 ]),
 "privacy": ("en", "Privacy Policy", [
  ("1. Summary", ["ST PLAY has no ads, no tracking and does not sell data."]),
  ("2. Data that stays on your device", ["History, favorites, playback positions and settings are stored locally on the device and are not sent to us."]),
  ("3. Your playlist (pairing from your phone)", ["When you use the QR code, the playlist you enter (M3U link, or Xtream server, username and password) is sent to our server, stored ENCRYPTED (AES-256-GCM) and tied only to your device identifier (as a hash). It is kept until you remove it, on the TV (Settings) or on the website (My playlist tab), so that it comes back by itself if you reinstall the app.", "Only your device can retrieve the playlist. We do not log its contents (links, usernames or passwords) and we never access your playlist address."]),
  ("4. Free trial", [f"To enforce the {TRIAL}-day trial we store an irreversible hash of a device identifier and the start date. We do not store your name, email or the raw identifier."]),
  ("5. Security and providers", ["We use HTTPS and per-IP rate limits (temporary counters). The site is hosted on Vercel, which may keep technical access logs (such as IP) under its own policy. Purchases are processed by Roku; we receive no payment data."]),
  ("6. Your rights", [f"You can delete your playlist at any time (TV or website) and request information or deletion of trial data by writing to {EMAIL}."]),
  ("7. Children", ["The app is not directed to children."]),
  ("8. Contact", [f"{RESPONSAVEL} — {EMAIL}"]),
 ]),
}
OTHER = {"termos": "terms", "terms": "termos", "privacidade": "privacy", "privacy": "privacidade"}

root = pathlib.Path(__file__).resolve().parent.parent
pub = root / "public"
roku = root / "generated_roku_assets"
roku.mkdir(exist_ok=True)
for slug, (lang, title, secs) in DOCS.items():
    body = "".join(f"<h2>{html.escape(h)}</h2><ul>" + "".join(f"<li>{html.escape(p)}</li>" for p in ps) + "</ul>" for h, ps in secs)
    page = f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ST PLAY — {title}</title><link rel="icon" type="image/png" href="/favicon.png"><link rel="stylesheet" href="/style.css"></head><body><main class="legal"><a class="brand" href="/"><img src="/favicon.png" alt="" width="40" height="40">ST <b>PLAY</b></a><h1>{title}</h1><p class="mut">{'Versão' if lang=='pt' else 'Version'} {VERSAO} · {DATA}</p>{body}<footer><a href="/{OTHER[slug]}.html">{'English' if lang=='pt' else 'Português'}</a></footer></main></body></html>"""
    (pub / f"{slug}.html").write_text(page, encoding="utf-8")
    txt = f"{title} - ST PLAY (v{VERSAO}, {DATA})\n\n" + "\n\n".join(h + "\n" + "\n".join("- " + p for p in ps) for h, ps in secs)
    (roku / f"{slug}.txt").write_text(txt, encoding="utf-8")
print("ok")
