import type { Router, RequestHandler } from "express";
import { serviceInputSchema, siteSettingsSchema } from "@shared/catalog";
import type { IStorage } from "./storage";
import { ZodError } from "zod";

export function registerCatalogRoutes(
  router: Router,
  storage: IStorage,
  authenticated: RequestHandler,
) {
  const handle =
    (action: RequestHandler): RequestHandler =>
    async (req, res, next) => {
      try {
        await action(req, res, next);
      } catch (error) {
        if (error instanceof ZodError)
          res
            .status(400)
            .json({ message: error.issues[0]?.message || "Dados inválidos." });
        else next(error);
      }
    };
  const validId: RequestHandler = (req, res, next) => {
    if (
      !Number.isSafeInteger(Number(req.params.id)) ||
      Number(req.params.id) <= 0
    ) {
      res.status(400).json({ message: "ID inválido." });
      return;
    }
    next();
  };
  router.get(
    "/services",
    handle(async (_req, res) => {
      res.json({ services: await storage.getServices() });
    }),
  );
  router.get(
    "/services/manage",
    authenticated,
    handle(async (_req, res) => {
      res.json({ services: await storage.getServices(true) });
    }),
  );
  router.post(
    "/services",
    authenticated,
    handle(async (req, res) => {
      res
        .status(201)
        .json({
          service: await storage.createService(
            serviceInputSchema.parse(req.body),
          ),
        });
    }),
  );
  router.put(
    "/services/:id",
    authenticated,
    validId,
    handle(async (req, res) => {
      const service = await storage.updateService(
        Number(req.params.id),
        serviceInputSchema.parse(req.body),
      );
      res
        .status(service ? 200 : 404)
        .json(service ? { service } : { message: "Serviço não encontrado." });
    }),
  );
  router.delete(
    "/services/:id",
    authenticated,
    validId,
    handle(async (req, res) => {
      const archived = await storage.archiveService(Number(req.params.id));
      res
        .status(archived ? 200 : 404)
        .json(
          archived ? { success: true } : { message: "Serviço não encontrado." },
        );
    }),
  );
  router.get(
    "/site-settings",
    handle(async (_req, res) => {
      res.json({ settings: await storage.getSiteSettings() });
    }),
  );
  router.put(
    "/site-settings",
    authenticated,
    handle(async (req, res) => {
      res.json({
        settings: await storage.saveSiteSettings(
          siteSettingsSchema.parse(req.body),
        ),
      });
    }),
  );
}
