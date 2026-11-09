import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import { registerCatalogRoutes } from "../server/catalog-routes";
import { errorHandler } from "../server/error-handler";
import { defaultSiteSettings, type ClinicService } from "../shared/catalog";
import { PrismaStorage } from "../server/storage";
import { db } from "../server/db";

test("catalog CRUD, publishing, archival and content editing require admin authorization", async () => {
  const storage = new PrismaStorage();
  let services: (ClinicService & { archived?: boolean })[] = [];
  let settings = { ...defaultSiteSettings };
  storage.getServices = async (manage) =>
    services.filter((item) => !item.archived && (manage || item.active));
  storage.createService = async (data) => {
    const service = { ...data, id: services.length + 1 };
    services.push(service);
    return service;
  };
  storage.updateService = async (id, data) => {
    const item = services.find((s) => s.id === id && !s.archived);
    if (!item) return undefined;
    Object.assign(item, data);
    return item;
  };
  storage.archiveService = async (id) => {
    const item = services.find((s) => s.id === id && !s.archived);
    if (!item) return false;
    item.archived = true;
    item.active = false;
    return true;
  };
  storage.getSiteSettings = async () => settings;
  storage.saveSiteSettings = async (data) => {
    settings = data;
    return settings;
  };
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerCatalogRoutes(router, storage, (req, res, next) => {
    if (req.headers.authorization === "fixture-admin") next();
    else res.status(401).json({ message: "Não autorizado" });
  });
  app.use("/api", router);
  app.use(errorHandler);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const request = (
    path: string,
    method = "GET",
    body?: unknown,
    admin = false,
  ) =>
    fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(admin ? { authorization: "fixture-admin" } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    assert.deepEqual((await (await request("/services")).json()).services, []);
    assert.equal((await request("/services", "POST", {})).status, 401);
    assert.equal((await request("/site-settings", "PUT", {})).status, 401);
    const draft = {
      name: "Massagem relaxante",
      description: "Uma pausa dedicada ao seu bem-estar.",
      priceCents: 15000,
      durationMinutes: 90,
      imageUrl: "",
      active: false,
    };
    assert.equal(
      (await request("/services", "POST", { ...draft, priceCents: -1 }, true))
        .status,
      400,
    );
    assert.equal(
      (
        await request(
          "/services",
          "POST",
          { ...draft, imageUrl: "javascript:alert(1)" },
          true,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/services",
          "POST",
          { ...draft, durationMinutes: 5 },
          true,
        )
      ).status,
      400,
    );
    assert.equal((await request("/services", "POST", draft, true)).status, 201);
    assert.equal(
      (await (await request("/services")).json()).services.length,
      0,
    );
    assert.equal(
      (await (await request("/services/manage", "GET", undefined, true)).json())
        .services.length,
      1,
    );
    assert.equal(
      (await request("/services/1", "PUT", { ...draft, active: true }, true))
        .status,
      200,
    );
    assert.equal(
      (await (await request("/services")).json()).services[0].name,
      draft.name,
    );
    assert.equal(
      (await request("/services/1abc", "DELETE", undefined, true)).status,
      400,
    );
    assert.equal(
      (await request("/services/1", "DELETE", undefined, true)).status,
      200,
    );
    assert.deepEqual((await (await request("/services")).json()).services, []);
    assert.equal(
      (await request("/services/1", "PUT", draft, true)).status,
      404,
    );
    assert.equal(
      (await request("/services/1", "DELETE", undefined, true)).status,
      404,
    );
    assert.equal(
      (
        await request(
          "/site-settings",
          "PUT",
          { ...settings, weekdayStart: "22:00" },
          true,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/site-settings",
          "PUT",
          { ...settings, phone: "invalid" },
          true,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/site-settings",
          "PUT",
          { ...settings, brandName: "Clínica de teste", weekendsOpen: false },
          true,
        )
      ).status,
      200,
    );
    assert.equal(
      (await (await request("/site-settings")).json()).settings.brandName,
      "Clínica de teste",
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("Prisma catalogue excludes drafts/archived services publicly and only active services can be booked", async () => {
  const original = {
    findMany: db.service.findMany,
    findFirst: db.service.findFirst,
    updateMany: db.service.updateMany,
  };
  const calls: any[] = [];
  (db.service as any).findMany = async (args: any) => {
    calls.push(args);
    return [];
  };
  (db.service as any).findFirst = async (args: any) => {
    calls.push(args);
    return null;
  };
  (db.service as any).updateMany = async (args: any) => {
    calls.push(args);
    return { count: 1 };
  };
  try {
    const storage = new PrismaStorage();
    await storage.getServices();
    await storage.getServices(true);
    await storage.getService(1);
    await storage.archiveService(1);
    assert.deepEqual(calls[0].where, { archived: false, active: true });
    assert.deepEqual(calls[1].where, { archived: false });
    assert.deepEqual(calls[2].where, { id: 1, archived: false, active: true });
    assert.deepEqual(calls[3].data, { active: false, archived: true });
  } finally {
    Object.assign(db.service, original);
  }
});
