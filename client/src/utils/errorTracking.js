/**
 * ERROR TRACKING SERVICE - SPRINT 17
 * Registra errores en tabla audit_logs para análisis posterior
 * Interfaz neutral para futuros servicios (Sentry, DataDog, etc)
 */

import { supabase } from "../services/supabaseClient";
import { logger } from "./logger";

const isDevelopment = import.meta.env.MODE === "development";

/**
 * Registra error en base de datos
 */
export const trackError = async (context, error, metadata = {}) => {
  try {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message,
      stack: error?.stack,
      metadata: JSON.stringify(metadata),
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Guardar en audit_logs como tipo 'ERROR'
    const { error: insertError } = await supabase.from("audit_logs").insert({
      action: "ERROR_TRACKED",
      target_entity: "error_tracking",
      target_id: null,
      details: errorRecord,
    });

    if (insertError) {
      logger.warn("ErrorTracking", "No se pudo guardar error en BD", {
        originalError: error?.message,
      });
    } else {
      logger.debug("ErrorTracking", "Error registrado en BD", {
        errorId: errorRecord.errorId,
        context,
      });
    }

    return errorRecord.errorId;
  } catch (e) {
    // No lanzar error aquí para no romper la app
    logger.error("ErrorTracking", "Error crítico en trackError", e);
    return null;
  }
};

/**
 * Captura errores de fetch/requests
 */
export const trackFetchError = async (
  url,
  method,
  statusCode,
  error,
  context,
) => {
  const errorId = await trackError(context, error, {
    type: "FETCH_ERROR",
    url,
    method,
    statusCode,
  });

  if (!isDevelopment) {
    // En producción, enviar a servicio externo
    // await sendToErrorService({ errorId, ...args })
  }

  return errorId;
};

/**
 * Captura errores de queries (React Query, Supabase)
 */
export const trackQueryError = async (queryKey, error, context) => {
  const errorId = await trackError(context, error, {
    type: "QUERY_ERROR",
    queryKey,
  });

  logger.error(context, `Error en query: ${queryKey}`, error, {
    errorId,
  });

  return errorId;
};

export default {
  trackError,
  trackFetchError,
  trackQueryError,
};
