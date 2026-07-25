export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(response.status, `Request to ${url} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}
