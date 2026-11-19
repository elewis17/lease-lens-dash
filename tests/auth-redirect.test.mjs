import assert from "node:assert/strict";
import test from "node:test";
import { callbackHasError, callbackUrl } from "../src/features/auth/authRedirect.ts";

test("sign-in redirect uses the actual dev origin or deployment base", () => {
  assert.equal(callbackUrl("http://localhost:8000", "/"), "http://localhost:8000/auth/callback");
  assert.equal(callbackUrl("http://127.0.0.1:8000", "/"), "http://127.0.0.1:8000/auth/callback");
  assert.equal(callbackUrl("https://example-8000.app.github.dev", "/"), "https://example-8000.app.github.dev/auth/callback");
  assert.equal(callbackUrl("https://elewis17.github.io", "/lease-lens-dash/"), "https://elewis17.github.io/lease-lens-dash/auth/callback");
  assert.equal(callbackUrl("https://divergentcapitalllc.com", "/lease-lens/"), "https://divergentcapitalllc.com/lease-lens/auth/callback");
});

test("provider errors are detected in the query or fragment without reading their messages", () => {
  assert.equal(callbackHasError("?error=access_denied", ""), true);
  assert.equal(callbackHasError("", "#error_code=provider_error"), true);
  assert.equal(callbackHasError("?code=123", "#error_description=private+provider+details"), true);
  assert.equal(callbackHasError("?code=123", ""), false);
  assert.equal(callbackHasError("", ""), false);
});
