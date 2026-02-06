/**
 * REQUEST LOGGING MIDDLEWARE - SPRINT 17
 * Registra todas las requests HTTP, responses y errores
 * Incluye métricas de latencia y trazabilidad
 */

import { logger } from "./logger.js";

/**
 * Middleware para Express/Node.js
 * Registra request/response con métricas
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Guardar info en request para logs posteriores
  req.requestId = requestId;
  req.startTime = startTime;

  // Loguear request incoming
  logger.info("RequestHandler", `${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  // Interceptar response para loguear salida
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Loguear response
    if (statusCode >= 400) {
      // Errores
      logger.warn(
        "RequestHandler",
        `${req.method} ${req.path} - ${statusCode}`,
        {
          requestId,
          statusCode,
          duration,
          method: req.method,
          path: req.path,
        },
      );
    } else {
      // Success
      logger.debug(
        "RequestHandler",
        `${req.method} ${req.path} - ${statusCode}`,
        {
          requestId,
          statusCode,
          duration,
          method: req.method,
          path: req.path,
        },
      );
    }

    // llamar original json
    return originalJson.call(this, data);
  };

  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      logger.warn(
        "RequestHandler",
        `${req.method} ${req.path} - ${statusCode}`,
        {
          requestId,
          statusCode,
          duration,
          method: req.method,
          path: req.path,
        },
      );
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para error handling
 * Captura errores y los registra estruturadamente
 */
export const errorHandler = (err, req, res, next) => {
  const duration = Date.now() - req.startTime;
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.error("ErrorHandler", `${req.method} ${req.path}`, err, {
    errorId,
    requestId: req.requestId,
    statusCode: res.statusCode,
    duration,
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack,
  });

  // Enviar response de error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || "Error interno del servidor",
    errorId,
    requestId: req.requestId,
  });
};

/**
 * Middleware para auditar cambios en datos
 */
export const auditLog = (action, entity) => {
  return (req, res, next) => {
    // Guardar info para auditoría
    req.auditAction = action;
    req.auditEntity = entity;
    req.auditTimestamp = new Date().toISOString();

    logger.audit(action, entity, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      user: req.user?.id,
      userId: req.user?.id,
    });

    next();
  };
};

/**
 * Middleware para Performance Monitoring
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  const originalJson = res.json;
  res.json = function (data) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // convertir a ms

    if (duration > 500) {
      // Threshold 500ms
      logger.warn("Performance", `Slow request: ${req.method} ${req.path}`, {
        duration: `${duration.toFixed(2)}ms`,
        requestId: req.requestId,
        path: req.path,
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

export default {
  requestLogger,
  errorHandler,
  auditLog,
  performanceMonitor,
};
