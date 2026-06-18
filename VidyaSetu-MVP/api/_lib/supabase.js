function restUrl() {
  const raw = process.env.SUPABASE_REST_URL || process.env.SUPABASE_URL || '';
  if (!raw) {
    return '';
  }

  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/rest/v1') ? trimmed : `${trimmed}/rest/v1`;
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
}

function headers(extra = {}) {
  const key = serviceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

const fallbackDb = globalThis.__VIDYASETU_FALLBACK_DB__ || {
  tables: new Map(),
};
globalThis.__VIDYASETU_FALLBACK_DB__ = fallbackDb;

function timeoutSignal(ms = Number(process.env.SUPABASE_TIMEOUT_MS || 5_000)) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

export function hasSupabaseConfig() {
  return Boolean(restUrl() && serviceKey());
}

export async function insertRows(table, rows, { upsert = false, onConflict = '' } = {}) {
  if (!hasSupabaseConfig()) {
    return fallbackInsertRows(table, rows, { upsert, onConflict });
  }

  const query = new URL(`${restUrl()}/${table}`);
  if (onConflict) {
    query.searchParams.set('on_conflict', onConflict);
  }

  const timeout = timeoutSignal();
  try {
    const response = await fetch(query, {
      method: 'POST',
      signal: timeout.signal,
      headers: headers({
        Prefer: upsert
          ? 'resolution=merge-duplicates,return=representation'
          : 'return=representation',
      }),
      body: JSON.stringify(Array.isArray(rows) ? rows : [rows]),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { ok: false, data: null, error: data?.message || response.statusText };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  } finally {
    timeout.clear();
  }
}

export async function patchRows(table, filters, payload) {
  if (!hasSupabaseConfig()) {
    return fallbackPatchRows(table, filters, payload);
  }

  const query = new URL(`${restUrl()}/${table}`);
  Object.entries(filters).forEach(([key, value]) => query.searchParams.set(key, `eq.${value}`));

  const timeout = timeoutSignal();
  try {
    const response = await fetch(query, {
      method: 'PATCH',
      signal: timeout.signal,
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { ok: false, data: null, error: data?.message || response.statusText };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  } finally {
    timeout.clear();
  }
}

export async function deleteRows(table, filters) {
  if (!hasSupabaseConfig()) {
    return fallbackDeleteRows(table, filters);
  }

  const query = new URL(`${restUrl()}/${table}`);
  Object.entries(filters).forEach(([key, value]) => query.searchParams.set(key, `eq.${value}`));

  const timeout = timeoutSignal();
  try {
    const response = await fetch(query, {
      method: 'DELETE',
      signal: timeout.signal,
      headers: headers({ Prefer: 'return=minimal' }),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { ok: false, data: null, error: data?.message || response.statusText };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  } finally {
    timeout.clear();
  }
}

export async function selectRows(table, { filters = {}, order = '', limit = 50 } = {}) {
  if (!hasSupabaseConfig()) {
    return fallbackSelectRows(table, { filters, order, limit });
  }

  const query = new URL(`${restUrl()}/${table}`);
  Object.entries(filters).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const op = value.op || 'eq';
      query.searchParams.set(key, `${op}.${value.value}`);
      return;
    }
    query.searchParams.set(key, `eq.${value}`);
  });
  if (order) {
    query.searchParams.set('order', order);
  }
  query.searchParams.set('limit', String(limit));

  const timeout = timeoutSignal();
  try {
    const response = await fetch(query, {
      method: 'GET',
      signal: timeout.signal,
      headers: headers(),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { ok: false, data: null, error: data?.message || response.statusText };
    }

    return { ok: true, data, error: null };
  } catch (error) {
    return { ok: false, data: null, error: error.message };
  } finally {
    timeout.clear();
  }
}

function fallbackTable(table) {
  if (!fallbackDb.tables.has(table)) {
    fallbackDb.tables.set(table, []);
  }
  return fallbackDb.tables.get(table);
}

function fallbackInsertRows(table, rows, { upsert = false, onConflict = '' } = {}) {
  const list = fallbackTable(table);
  const now = new Date().toISOString();
  const incoming = (Array.isArray(rows) ? rows : [rows]).map((row) => ({
    id: row.id || fallbackId(table),
    created_at: row.created_at || now,
    updated_at: row.updated_at || now,
    ...clone(row),
  }));

  const saved = incoming.map((row) => {
    if (upsert && onConflict) {
      const keys = onConflict.split(',').map((key) => key.trim()).filter(Boolean);
      const existingIndex = list.findIndex((candidate) =>
        keys.every((key) => String(candidate[key] ?? '') === String(row[key] ?? '')),
      );
      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          ...row,
          id: list[existingIndex].id,
          created_at: list[existingIndex].created_at,
          updated_at: now,
        };
        return clone(list[existingIndex]);
      }
    }
    list.push(row);
    return clone(row);
  });

  return {
    ok: true,
    data: saved,
    error: null,
    fallback: true,
  };
}

function fallbackPatchRows(table, filters, payload) {
  const list = fallbackTable(table);
  const now = new Date().toISOString();
  const patched = [];
  list.forEach((row, index) => {
    if (!matchesFilters(row, filters)) return;
    list[index] = {
      ...row,
      ...clone(payload),
      updated_at: payload.updated_at || now,
    };
    patched.push(clone(list[index]));
  });

  return {
    ok: true,
    data: patched,
    error: null,
    fallback: true,
  };
}

function fallbackDeleteRows(table, filters) {
  const list = fallbackTable(table);
  const removed = [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (!matchesFilters(list[index], filters)) continue;
    removed.push(clone(list[index]));
    list.splice(index, 1);
  }

  return {
    ok: true,
    data: removed.reverse(),
    error: null,
    fallback: true,
  };
}

function fallbackSelectRows(table, { filters = {}, order = '', limit = 50 } = {}) {
  let rows = fallbackTable(table).filter((row) => matchesFilters(row, filters)).map(clone);
  if (order) {
    const [field, direction = 'asc'] = order.split('.');
    rows = rows.sort((a, b) => {
      const left = a[field] || '';
      const right = b[field] || '';
      const compare = String(left).localeCompare(String(right));
      return direction.toLowerCase() === 'desc' ? -compare : compare;
    });
  }
  if (Number.isFinite(Number(limit))) {
    rows = rows.slice(0, Number(limit));
  }

  return {
    ok: true,
    data: rows,
    error: null,
    fallback: true,
  };
}

function matchesFilters(row, filters = {}) {
  return Object.entries(filters).every(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const op = value.op || 'eq';
      return matchesOperator(row[key], op, value.value);
    }
    return matchesOperator(row[key], 'eq', value);
  });
}

function matchesOperator(actual, op, expected) {
  if (op === 'like') {
    const pattern = String(expected ?? '')
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/%/g, '.*');
    return new RegExp(`^${pattern}$`).test(String(actual ?? ''));
  }
  if (op === 'ilike') {
    const pattern = String(expected ?? '')
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/%/g, '.*');
    return new RegExp(`^${pattern}$`, 'i').test(String(actual ?? ''));
  }
  if (op === 'neq') {
    return String(actual ?? '') !== String(expected ?? '');
  }
  return String(actual ?? '') === String(expected ?? '');
}

function fallbackId(table) {
  const random =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${table}_${random}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}
