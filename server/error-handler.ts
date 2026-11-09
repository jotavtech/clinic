import type { ErrorRequestHandler } from "express";
import multer from "multer";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return _next(error);
  const uploadTooLarge = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
  const status = uploadTooLarge ? 413 : error.status || error.statusCode || 500;
  const message = uploadTooLarge ? "A imagem deve ter no máximo 10MB." : status < 500
    ? error.message : "Não foi possível concluir a solicitação. Tente novamente.";
  if (status >= 500) console.error("Erro interno ao processar solicitação.");
  res.status(status).json({ success: false, message });
};
