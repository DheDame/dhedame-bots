// Gambar (toggle Image): hasilkan gambar lewat gateway BYO pengguna
// sendiri (endpoint OpenAI-compatible /v1/images/generations, pola
// skill 9router-image). Model image dicari dulu lewat
// GET /v1/models/image — jadi tidak ada nama model yang di-hardcode.
// Kredensial HANYA dikirim ke baseUrl BYO (header Bearer) — tidak
// pernah ke server pendamping, tidak pernah di-log.

export interface GeneratedImage {
  /** URL gambar (response_format=url) atau data URI (b64_json). */
  uri: string;
  /** Model image yang dipakai (dari GET /v1/models/image). */
  model: string;
}

const MODELS_TIMEOUT_MS = 30_000;
const GENERATE_TIMEOUT_MS = 180_000;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function authHeaders(credential: string): Record<string, string> {
  return { Authorization: `Bearer ${credential}` };
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${t ? `: ${t.slice(0, 200)}` : ''}`);
    }
    return (await res.json()) as unknown;
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error('Permintaan timeout — coba lagi.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Daftar model image di gateway (GET {baseUrl}/models/image). */
export async function listImageModels(baseUrl: string, credential: string): Promise<string[]> {
  const json = (await fetchJson(`${stripTrailingSlash(baseUrl)}/models/image`, {
    headers: authHeaders(credential),
  }, MODELS_TIMEOUT_MS)) as { data?: Array<{ id?: unknown }> };
  const ids = (json?.data ?? [])
    .map((m) => (typeof m?.id === 'string' ? m.id : ''))
    .filter(Boolean);
  return ids;
}

/**
 * Hasilkan satu gambar dari prompt. Model diambil dari daftar model
 * image gateway (yang pertama) — bila gateway tidak menjawab daftar
 * itu atau daftarnya kosong, lempar error yang jelas (bukan diam-diam
 * memakai model yang tidak ada).
 */
export async function generateImage(
  baseUrl: string,
  credential: string,
  prompt: string,
): Promise<GeneratedImage> {
  let models: string[];
  try {
    models = await listImageModels(baseUrl, credential);
  } catch {
    throw new Error(
      'Gateway tidak menjawab daftar model image — pastikan base URL BYO betul dan gateway punya provider image.',
    );
  }
  if (models.length === 0) {
    throw new Error('Tiada model image di gateway — tambah provider image di dashboard 9Router dulu.');
  }
  const model = models[0];
  const json = (await fetchJson(
    `${stripTrailingSlash(baseUrl)}/images/generations`,
    {
      method: 'POST',
      headers: { ...authHeaders(credential), 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size: '1024x1024' }),
    },
    GENERATE_TIMEOUT_MS,
  )) as { data?: Array<{ url?: unknown; b64_json?: unknown }> };
  const item = json?.data?.[0];
  if (item && typeof item.url === 'string' && item.url) {
    return { uri: item.url, model };
  }
  if (item && typeof item.b64_json === 'string' && item.b64_json) {
    return { uri: `data:image/png;base64,${item.b64_json}`, model };
  }
  throw new Error('Gateway tidak mengembalikan gambar (tiada url/b64_json).');
}
