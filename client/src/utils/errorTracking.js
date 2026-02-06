/**
 * ERROR TRACKING SERVICE - SPRINT 17
 * Logs errors to audit_logs table for later analysis
 * Neutral interface for future services (Sentry, DataDog, etc)
 */

import { supabase } from "../services/supabaseClient";
import { logger } from "./logger";

const isDevelopment = import.meta.env.MODE === "development";

/**
 * Logs error to database
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

    // Save to audit_logs as 'ERROR' type
    const { error: insertError } = await supabase.from("audit_logs").insert({
      action: "ERROR_TRACKED",
      target_entity: "error_tracking",
      target_id: null,
      details: errorRecord,
    });

    if (insertError) {
      logger.warn("ErrorTracking", "Could not save error to database", {
        originalError: error?.message,
      });
    } else {
      logger.debug("ErrorTracking", "Error logged to database", {
        errorId: errorRecord.errorId,
        context,
      });
    }

    return errorRecord.errorId;
  } catch (e) {
    // Do not throw error here to avoid breaking the app
    logger.error("ErrorTracking", "Critical error in trackError", e);
    return null;
  }
};

/**
 * Captures fetch/request errors
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
    // In production, send to external error service
    // await sendToErrorService({ errorId, ...args })
  }

  return errorId;
};

/**
 * Captures query errors (React Query, Supabase)
 */
export const trackQueryError = async (queryKey, error, context) => {
  const errorId = await trackError(context, error, {
    type: "QUERY_ERROR",
    queryKey,
  });

  logger.error(context, `Query error: ${queryKey}`, error, {
    errorId,
  });

  return errorId;
};

export default {
  trackError,
  trackFetchError,
  trackQueryError,
};
