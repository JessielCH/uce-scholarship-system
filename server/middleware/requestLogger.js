/**
 * REQUEST LOGGING MIDDLEWARE - SPRINT 17
 * Logs all HTTP requests, responses and errors
 * Includes latency metrics and traceability
 */

import { logger } from "./logger.js";

/**
 * Middleware for Express/Node.js
 * Logs request/response with metrics
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Save info in request for later logs
  req.requestId = requestId;
  req.startTime = startTime;

  // Log incoming request
  logger.info("RequestHandler", `${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  // Intercept response to log output
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log response
    if (statusCode >= 400) {
      // Errors
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

    // Call original json
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
 * Middleware for error handling
 * Captures errors and logs them in a structured manner
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

  // Send error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || "Internal server error",
    errorId,
    requestId: req.requestId,
  });
};

/**
 * Middleware to audit data changes
 */
export const auditLog = (action, entity) => {
  return (req, res, next) => {
    // Save info for audit
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
 * Middleware for Performance Monitoring
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  const originalJson = res.json;
  res.json = function (data) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // convert to ms

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
