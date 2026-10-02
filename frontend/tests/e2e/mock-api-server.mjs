import { createServer } from 'node:http';

let state = {};
const counters = { brokers: 0, submissions: 0, details: 0 };

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function sendConfigured(response, configured) {
  if (configured.delayMs) await new Promise((resolve) => setTimeout(resolve, configured.delayMs));
  sendJson(response, configured.status ?? 200, configured.body ?? {});
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');

  if (request.method === 'GET' && url.pathname === '/__test__/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/__test__/state') {
    try {
      state = await readJson(request);
      counters.brokers = 0;
      counters.submissions = 0;
      counters.details = 0;
      sendJson(response, 200, { ok: true });
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON state' });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/__test__/state') {
    sendJson(response, 200, { state, counters });
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { detail: 'Method not allowed' });
    return;
  }

  if (url.pathname === '/api/brokers/') {
    counters.brokers += 1;
    await sendConfigured(response, state.brokersResponse ?? { body: state.brokers ?? [] });
    return;
  }

  if (url.pathname === '/api/submissions/') {
    counters.submissions += 1;
    if (state.submissionsResponse) {
      await sendConfigured(response, state.submissionsResponse);
      return;
    }

    let items = [...(state.submissions ?? [])];
    const status = url.searchParams.get('status');
    const brokerId = url.searchParams.get('brokerId');
    const search = url.searchParams.get('companySearch')?.toLowerCase();
    if (status) items = items.filter((item) => item.status === status);
    if (brokerId) items = items.filter((item) => String(item.broker.id) === brokerId);
    if (search) {
      items = items.filter((item) => item.company.legalName.toLowerCase().includes(search));
    }
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    sendJson(response, 200, {
      count: items.length,
      next: page * 10 < items.length ? `?page=${page + 1}` : null,
      previous: page > 1 ? `?page=${page - 1}` : null,
      results: items.slice((page - 1) * 10, page * 10),
    });
    return;
  }

  const detailMatch = url.pathname.match(/^\/api\/submissions\/(\d+)\/$/);
  if (detailMatch) {
    counters.details += 1;
    const configured = state.detailResponses?.[detailMatch[1]] ?? {
      status: 404,
      body: { detail: 'Not found' },
    };
    await sendConfigured(response, configured);
    return;
  }

  sendJson(response, 404, { detail: 'Not found' });
});

server.listen(8010, '127.0.0.1');
