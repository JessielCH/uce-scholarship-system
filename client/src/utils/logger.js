/**
 * LOGGER CENTRALIZADO - SPRINT 16
 * Sistema único de logging para toda la aplicación
 * Reemplaza todos los console.log/warn/error dispersos
 */

const isDevelopment = import.meta.env.MODE === "development";

// Color codes para terminal (dev tools)
const colors = {
  DEBUG: "#9CA3AF",
  INFO: "#3B82F6",
  WARN: "#F59E0B",
  ERROR: "#EF4444",
  AUDIT: "#10B981",
};

const icons = {
  DEBUG: "🔍",
  INFO: "ℹ️",
  WARN: "⚠️",
  ERROR: "❌",
  AUDIT: "📋",
};

/**
 * Formatea entry de log estructurado
 * @param {string} level - DEBUG, INFO, WARN, ERROR, AUDIT
 * @param {string} context - Nombre del componente/función
 * @param {string} message - Mensaje principal
 * @param {object} data - Datos adicionales
 * @returns {object} Structured log entry
 */
const formatLog = (level, context, message, data) => ({
  timestamp: new Date().toISOString(),
  level,
  context,
  message,
  ...(data && { data }),
});

/**
 * Imprime log en consola con formato bonito
 */
const printLog = (level, context, message, data) => {
  if (!isDevelopment) return; // No logs en producción (env var será necesaria)

  const timestamp = new Date().toLocaleTimeString("es-EC");
  const icon = icons[level];
  const color = colors[level];

  const groupLabel = `${icon} [${level}] ${context} — ${timestamp}`;

  console.group(`%c${groupLabel}`, `color: ${color}; font-weight: bold;`);
  console.log(`%c${message}`, `color: ${color}`);

  if (data && Object.keys(data).length > 0) {
    console.table(data);
  }

  console.groupEnd();
};

/**
 * Sistema centralizado de logging
 */
export const logger = {
  /**
   * Log de debugging - máximo nivel de detalle
   * @usage logger.debug('LoginForm', 'Usuario verificado', { email: user.email })
   */
  debug: (context, message, data) => {
    const log = formatLog("DEBUG", context, message, data);
    printLog("DEBUG", context, message, data);
    // En el futuro: enviar a servicios de logging (DataDog, etc)
    return log;
  },

  /**
   * Log informativo - flujo normal
   * @usage logger.info('AuthContext', 'Sesión iniciada')
   */
  info: (context, message, data) => {
    const log = formatLog("INFO", context, message, data);
    printLog("INFO", context, message, data);
    return log;
  },

  /**
   * Log de advertencia - algo puede estar mal
   * @usage logger.warn('ScholarshipTable', 'Query con retardo', { duration: 2500 })
   */
  warn: (context, message, data) => {
    const log = formatLog("WARN", context, message, data);
    printLog("WARN", context, message, data);
    return log;
  },

  /**
   * Log de error - algo salió mal
   * @usage logger.error('BankUploadModal', 'Fallo en OCR', error, { fileName: 'doc.pdf' })
   */
  error: (context, message, error, data) => {
    const log = formatLog("ERROR", context, message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...data,
    });

    // En consola mostramos error + datos
    const timestamp = new Date().toLocaleTimeString("es-EC");
    const groupLabel = `${icons.ERROR} [ERROR] ${context} — ${timestamp}`;

    console.group(
      `%c${groupLabel}`,
      `color: ${colors.ERROR}; font-weight: bold;`,
    );
    console.log(`%c${message}`, `color: ${colors.ERROR}`);

    if (error) {
      console.error("Stack:", error);
    }

    if (data && Object.keys(data).length > 0) {
      console.table(data);
    }

    console.groupEnd();

    return log;
  },

  /**
   * Log de auditoría - acciones importantes para compliance
   * @usage logger.audit('UPLOAD_DOC', 'scholarship_selections', { selectionId: '123', fileName: 'cert.pdf' })
   */
  audit: (action, entity, data) => {
    const log = formatLog("AUDIT", entity, action, data);
    printLog("AUDIT", entity, action, data);
    // En el futuro: enviar a tabla de audit_logs en Supabase
    return log;
  },

  /**
   * Captura performance de operación
   * @usage const perfId = logger.perf('DataFetch'); ... logger.perfEnd(perfId);
   */
  perf: (operation) => {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = (performance.now() - startTime).toFixed(2);
        logger.debug("Performance", `${operation}`, {
          duration: `${duration}ms`,
        });
        return duration;
      },
    };
  },
};

export default logger;
