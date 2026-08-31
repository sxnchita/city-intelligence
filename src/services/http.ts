// =====================================
// HTTP TRANSPORT
//
// One place for the base URL and fetch
// semantics. In development the Vite
// dev server proxies /api to the
// backend, so the default base is empty
// and every request is same-origin.
// =====================================

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

// The backend's error envelope, from common/ApiError.java.
type ApiErrorBody = {
  status?: string;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(
    status: number,
    path: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

function buildUrl(
  path: string,
  params?: QueryParams
): string {
  const search = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(
      params
    )) {
      // Skip absent params rather than sending
      // "undefined" — analytics endpoints treat a
      // missing range as "the last 15 minutes",
      // which is exactly what live mode wants.
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        continue;
      }

      search.set(key, String(value));
    }
  }

  const query = search.toString();

  return `${API_BASE}${path}${
    query ? `?${query}` : ""
  }`;
}

export async function getJson<T>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal
): Promise<T> {
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      path,
      await readErrorMessage(response, path)
    );
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(
  response: Response,
  path: string
): Promise<string> {
  try {
    const body =
      (await response.json()) as ApiErrorBody;

    if (body.message) {
      return body.message;
    }

    if (body.error) {
      return body.error;
    }
  } catch {
    // Not a JSON error envelope — fall through.
  }

  return `${path} failed: ${response.status} ${response.statusText}`;
}

// =====================================
// TIME RANGE
//
// from/to bind to Instant via
// @DateTimeFormat(ISO.DATE_TIME), so
// they must carry an offset.
// =====================================

export function toIso(
  value: Date | string
): string {
  return value instanceof Date
    ? value.toISOString()
    : value;
}

export function minutesAgo(
  minutes: number
): string {
  return new Date(
    Date.now() - minutes * 60 * 1000
  ).toISOString();
}

// =====================================
// WRITES
//
// Only the simulator and identity
// rebuild endpoints are POSTs, and both
// take either no body or a plain JSON
// object.
// =====================================

export async function postJson<T>(
  path: string,
  body?: unknown,
  params?: QueryParams,
  signal?: AbortSignal
): Promise<T> {
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      path,
      await readErrorMessage(response, path)
    );
  }

  return response.json() as Promise<T>;
}
