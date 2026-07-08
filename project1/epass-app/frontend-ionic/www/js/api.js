// =====================================================================
// E-PASS — Central API client (fetch wrapper)
// Mirrors backend/docs/API_DOCUMENTATION.md exactly.
// =====================================================================

class ApiException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const Api = {
  _headers(json = true) {
    const token = Storage.getToken();
    const headers = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  _url(path, query) {
    const url = new URL(APP_CONFIG.baseUrl + path);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      });
    }
    return url.toString();
  },

  async _decode(res) {
    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = { success: false, message: 'Unexpected server response' };
    }
    if (res.ok) return data;
    throw new ApiException(data.message || `Request failed (${res.status})`, res.status);
  },

  async get(path, query) {
    const res = await fetch(this._url(path, query), { headers: this._headers() });
    return this._decode(res);
  },

  async post(path, body) {
    const res = await fetch(this._url(path), {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(body || {}),
    });
    return this._decode(res);
  },

  async put(path, body) {
    const res = await fetch(this._url(path), {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(body || {}),
    });
    return this._decode(res);
  },

  async delete(path) {
    const res = await fetch(this._url(path), {
      method: 'DELETE',
      headers: this._headers(),
    });
    return this._decode(res);
  },

  /** Multipart upload — used by Apply Leave (attachment is optional). */
  async postMultipart(path, fields, file, fileField = 'attachment') {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    if (file) form.append(fileField, file, file.name);

    const res = await fetch(this._url(path), {
      method: 'POST',
      headers: this._headers(false), // let the browser set the multipart boundary
      body: form,
    });
    return this._decode(res);
  },
};
