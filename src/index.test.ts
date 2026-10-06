import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app, registry } from "./index.js";

describe("URL Shortener API", () => {
  beforeEach(() => {
    registry.clear();
  });

  it("POST /shorten - should shorten a valid URL and return a 6-char code", async () => {
    const res = await request(app)
      .post("/shorten")
      .send({ url: "https://example.com/some/long/path" });

    assert.equal(res.status, 200);
    assert.equal(typeof res.body.code, "string");
    assert.equal(res.body.code.length, 6);
  });

  it("POST /shorten - should return 400 for an invalid URL", async () => {
    const res = await request(app)
      .post("/shorten")
      .send({ url: "not-a-valid-url" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Invalid URL");
  });

  it("GET /:code - should redirect (302) to the original URL and increment clicks", async () => {
    const createRes = await request(app)
      .post("/shorten")
      .send({ url: "https://example.com/test" });
    const { code } = createRes.body;

    const redirectRes = await request(app).get(`/${code}`);
    assert.equal(redirectRes.status, 302);
    assert.equal(redirectRes.headers.location, "https://example.com/test");
  });

  it("GET /:code/stats - should track and return the number of clicks", async () => {
    const createRes = await request(app)
      .post("/shorten")
      .send({ url: "https://example.com/stats-test" });
    const { code } = createRes.body;

    await request(app).get(`/${code}`);
    await request(app).get(`/${code}`);

    const statsRes = await request(app).get(`/${code}/stats`);
    assert.equal(statsRes.status, 200);
    assert.deepEqual(statsRes.body, {
      code,
      url: "https://example.com/stats-test",
      clicks: 2,
    });
  });

  it("GET /:code and GET /:code/stats - should return 404 for unknown code", async () => {
    const res1 = await request(app).get("/unknown1");
    assert.equal(res1.status, 404);

    const res2 = await request(app).get("/unknown1/stats");
    assert.equal(res2.status, 404);
  });
});
