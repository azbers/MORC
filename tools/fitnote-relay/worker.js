/* DAUR fit note relay (Cloudflare Worker).
   The storefront posts a fit note here; the relay creates a Fit note metaobject entry
   with Status "Pending" in Shopify admin (Content > Metaobjects > Fit note).
   The Admin API token lives only in the Worker secrets, never in the theme.
   Secrets / vars: SHOP (ppiveu-zp.myshopify.com), ADMIN_TOKEN (write_metaobjects, read_products, write_files),
   ALLOWED_ORIGINS (comma list, e.g. https://daursupply.com,https://ppiveu-zp.myshopify.com). */
const API = '2025-10';
const FIT = { small: 'Runs small', true: 'True to size', large: 'Runs large' };
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);

async function gql(env, query, variables) {
  const r = await fetch(`https://${env.SHOP}/admin/api/${API}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.ADMIN_TOKEN },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

async function uploadPhoto(env, dataUrl, name) {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const bytes = Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0));
  if (bytes.length > 3 * 1024 * 1024) return null;
  const file = `fit-note-${Date.now()}.${m[2] === 'jpeg' ? 'jpg' : m[2]}`;
  const st = await gql(env, `mutation($i:[StagedUploadInput!]!){stagedUploadsCreate(input:$i){stagedTargets{url resourceUrl parameters{name value}} userErrors{message}}}`,
    { i: [{ filename: file, mimeType: m[1], resource: 'IMAGE', httpMethod: 'POST', fileSize: String(bytes.length) }] });
  const t = st.stagedUploadsCreate.stagedTargets[0];
  if (!t) return null;
  const fd = new FormData();
  t.parameters.forEach((p) => fd.append(p.name, p.value));
  fd.append('file', new Blob([bytes], { type: m[1] }), file);
  const up = await fetch(t.url, { method: 'POST', body: fd });
  if (!up.ok) return null;
  const fc = await gql(env, `mutation($f:[FileCreateInput!]!){fileCreate(files:$f){files{id} userErrors{message}}}`,
    { f: [{ originalSource: t.resourceUrl, contentType: 'IMAGE', alt: clip('Fit check photo from ' + name, 120) }] });
  return (fc.fileCreate.files[0] || {}).id || null;
}

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const ok = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean).includes(origin);
  return { ok, headers: { 'Access-Control-Allow-Origin': ok ? origin : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' } };
}
const json = (o, status, headers) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

export default {
  async fetch(req, env) {
    const c = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: c.ok ? 204 : 403, headers: c.headers });
    if (req.method !== 'POST' || !c.ok) return json({ ok: false, error: 'not allowed' }, 403, c.headers);
    let d; try { d = await req.json(); } catch (e) { return json({ ok: false, error: 'bad request' }, 400, c.headers); }
    if (d.website) return json({ ok: true }, 200, c.headers); // honeypot field: bots fill it, people never see it
    const rating = Math.round(+d.rating);
    const body = clip(d.body, 1200), name = clip(d.name, 40), handle = clip(d.product, 120);
    if (!(rating >= 1 && rating <= 5) || body.length < 10 || !name || !handle) return json({ ok: false, error: 'missing fields' }, 400, c.headers);
    try {
      const p = await gql(env, `query($h:String!){productByIdentifier(identifier:{handle:$h}){id}}`, { h: handle });
      const pid = p.productByIdentifier && p.productByIdentifier.id;
      if (!pid) return json({ ok: false, error: 'unknown product' }, 400, c.headers);
      const photo = d.photo ? await uploadPhoto(env, d.photo, name).catch(() => null) : null;
      const fields = [
        ['status', 'Pending'], ['product', pid], ['rating', String(rating)], ['name', name], ['city', clip(d.city, 40)],
        ['title', clip(d.title, 80)], ['body', body],
        ['colour', clip(d.colour, 40)], ['size', clip(d.size, 10)], ['fit', FIT[d.fit] || ''], ['photo', photo || ''],
        ['verified', 'false'], ['date', new Date().toISOString().slice(0, 10)]
      ].filter(([, v]) => v !== '').map(([key, value]) => ({ key, value }));
      const r = await gql(env, `mutation($m:MetaobjectCreateInput!){metaobjectCreate(metaobject:$m){metaobject{id handle} userErrors{field message}}}`,
        { m: { type: 'fit_note', fields } });
      const e = r.metaobjectCreate.userErrors;
      if (e.length) return json({ ok: false, error: e.map((x) => x.message).join('; ') }, 400, c.headers);
      return json({ ok: true }, 200, c.headers);
    } catch (err) {
      return json({ ok: false, error: 'server' }, 502, c.headers);
    }
  }
};
