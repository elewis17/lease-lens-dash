import assert from "node:assert/strict";
import test from "node:test";
import { createParseHandler } from "./index.ts";

const appOrigin = "https://divergentcapitalllc.com";
const env = name => ({ SUPABASE_URL: "https://auth.example", SUPABASE_ANON_KEY: "example", GEMINI_API_KEY: "example" })[name];

function makeRequest({ token = "session-example", origin = appOrigin, file, type = "application/pdf", method = "POST" } = {}) {
  const form = new FormData();
  if (file) form.append("file", new Blob([file], { type }), "sample.pdf");
  return new Request("https://function.example", {
    method,
    headers: { Origin: origin, ...(token && { Authorization: `Bearer ${token}` }) },
    ...(method === "POST" && { body: form }),
  });
}

test("only configured origins receive CORS, including the company domain", async () => {
  const handler = createParseHandler(env, () => assert.fail("Preflight should never fetch"));
  for (const origin of [appOrigin, "https://elewis17.github.io", "http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5173", "http://127.0.0.1:5173"]) {
    const response = await handler(makeRequest({ origin, method: "OPTIONS" }));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  }
  const denied = await handler(makeRequest({ origin: "https://elewis17.github.io/lease-lens-dash", method: "OPTIONS" }));
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
});

test("missing, rejected and anonymous sessions never reach extraction", async () => {
  const handler = createParseHandler(env, async url => {
    assert.match(url, /auth\.example/);
    return Response.json({ id: "demo", is_anonymous: true });
  });
  const invalid = createParseHandler(env, async url => {
    assert.match(url, /auth\.example/);
    return Response.json({ message: "provider details" }, { status: 401 });
  });
  for (const response of [await handler(makeRequest({ token: "" })), await handler(makeRequest()), await invalid(makeRequest())]) {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Sign-in required." });
  }
});

test("malformed and oversized uploads are rejected generically", async () => {
  const handler = createParseHandler(env, async url => {
    assert.match(url, /auth\.example/);
    return Response.json({ id: "owner" });
  });
  for (const file of [undefined, "not a PDF"]) {
    const response = await handler(makeRequest({ file }));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Choose a PDF or supported image." });
  }
  const size = 8 * 1024 * 1024;
  const oversizedFiles = [
    makeRequest({ file: new Uint8Array(size + 1) }),
    new Request("https://function.example", {
      method: "POST", duplex: "half",
      headers: { Authorization: "Bearer session-example", "Content-Type": "multipart/form-data; boundary=oversized" },
      body: new ReadableStream({ start(stream) { stream.enqueue(new Uint8Array(size + 20_000)); stream.close(); } }),
    }),
  ];
  for (const request of oversizedFiles) {
    const response = await handler(request);
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "File is too large." });
  }
});

test("authenticated PDF and PNG are sent as bytes and only expected fields return", async () => {
  for (const [type, file] of [
    ["application/pdf", Buffer.from("%PDF-1.4 test fixture")],
    ["image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])],
  ]) {
    let calls = 0;
    const handler = createParseHandler(env, async (url, options) => {
      calls++;
      if (calls === 1) {
        assert.equal(url, "https://auth.example/auth/v1/user");
        assert.equal(options.headers.Authorization, "Bearer session-example");
        return Response.json({ id: "owner" });
      }
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent");
      const { contents, generationConfig } = JSON.parse(options.body);
      assert.equal(generationConfig.responseMimeType, "application/json");
      const input = contents[0].parts[0].inlineData;
      assert.equal(input.mimeType, type);
      assert.equal(input.data, file.toString("base64"));
      const result = JSON.stringify({
        tenantName: "Sample Tenant", monthlyRent: 1450, deposit: 0, arbitrary: "ignored",
        confidence: { tenantName: 0.9, monthlyRent: 1.1, deposit: 0.7 },
      });
      return Response.json({ candidates: [{ content: { parts: [
        { text: "Internal thought", thought: true },
        { text: result.slice(0, 22) },
        { text: result.slice(22) },
      ] } }] });
    });
    const response = await handler(makeRequest({ type, file }));
    assert.equal(response.status, 200);
    const { fields, confidence } = await response.json();
    assert.equal(calls, 2);
    assert.equal(fields.deposit, 0);
    assert.equal(fields.noticeDays, null);
    assert.equal(fields.arbitrary, undefined);
    assert.equal(confidence.tenantName, 0.9);
    assert.equal(confidence.monthlyRent, null);
    assert.equal(confidence.deposit, 0.7);
  }
});

test("upstream failures do not disclose provider content", async () => {
  const handler = createParseHandler(env, async url => url.includes("auth.example")
    ? Response.json({ id: "owner" }) : Response.json({ details: "private provider detail" }, { status: 500 }));
  const response = await handler(makeRequest({ file: "%PDF-1.4 fixture" }));
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "The document could not be read. Try again." });
});
