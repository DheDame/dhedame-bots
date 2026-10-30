// Tests for api/image.ts — fetch dimock per tes.
import { generateImage, listImageModels } from '../image';

const fetchMock = jest.fn();
(global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function jsonResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => '',
  };
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('listImageModels', () => {
  it('mengembalikan id model dari GET /models/image', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { data: [{ id: 'a/img-1' }, { id: 'b/img-2' }] }),
    );
    await expect(listImageModels('https://gw.example/v1', 'k')).resolves.toEqual([
      'a/img-1',
      'b/img-2',
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://gw.example/v1/models/image',
      expect.objectContaining({ headers: { Authorization: 'Bearer k' } }),
    );
  });
});

describe('generateImage', () => {
  it('memakai model pertama dan mengembalikan url (baseUrl bertanda / di ujung tetap benar)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 'm/img' }] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ url: 'https://img.example/1.png' }] }));
    await expect(generateImage('https://gw.example/v1/', 'k', 'kucing')).resolves.toEqual({
      uri: 'https://img.example/1.png',
      model: 'm/img',
    });
    expect(fetchMock.mock.calls[1][0]).toBe('https://gw.example/v1/images/generations');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).prompt).toBe('kucing');
  });

  it('mengembalikan data URI untuk b64_json', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 'm/img' }] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ b64_json: 'AAAABBBB' }] }));
    await expect(generateImage('https://gw.example/v1', 'k', 'kucing')).resolves.toEqual({
      uri: 'data:image/png;base64,AAAABBBB',
      model: 'm/img',
    });
  });

  it('error jelas bila tiada model image', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: [] }));
    await expect(generateImage('https://gw.example/v1', 'k', 'kucing')).rejects.toThrow(
      'Tiada model image',
    );
  });

  it('error jelas bila daftar model tidak menjawab', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: 'not found' }));
    await expect(generateImage('https://gw.example/v1', 'k', 'kucing')).rejects.toThrow(
      'tidak menjawab daftar model image',
    );
  });
});
