/**
 * CENTRALIZED LOGGER - SPRINT 16
 * Single logging system for the entire application
 * Replaces all scattered console.log/warn/error calls
 */

const isDevelopment = import.meta.env.MODE === "development";

// Color codes for terminal (dev tools)
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
 * Formats structured log entry
 * @param {string} level - DEBUG, INFO, WARN, ERROR, AUDIT
 * @param {string} context - Component/function name
 * @param {string} message - Main message
 * @param {object} data - Additional data
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
 * Prints log to console with nice formatting
 */
const printLog = (level, context, message, data) => {
  if (!isDevelopment) return; // No logs in production (env var will be needed)

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
 * Centralized logging system
 */
export const logger = {
  /**
   * Debug log - highest level of detail
   * @usage logger.debug('LoginForm', 'User verified', { email: user.email })
   */
  debug: (context, message, data) => {
    const log = formatLog("DEBUG", context, message, data);
    printLog("DEBUG", context, message, data);
    // In the future: send to logging services (DataDog, etc)
    return log;
  },

  /**
   * Informational log - normal flow
   * @usage logger.info('AuthContext', 'Session started')
   */
  info: (context, message, data) => {
    const log = formatLog("INFO", context, message, data);
    printLog("INFO", context, message, data);
    return log;
  },

  /**
   * Warning log - something might be wrong
   * @usage logger.warn('ScholarshipTable', 'Query with delay', { duration: 2500 })
   */
  warn: (context, message, data) => {
    const log = formatLog("WARN", context, message, data);
    printLog("WARN", context, message, data);
    return log;
  },

  /**
   * Error log - something went wrong
   * @usage logger.error('BankUploadModal', 'OCR failed', error, { fileName: 'doc.pdf' })
   */
  error: (context, message, error, data) => {
    const log = formatLog("ERROR", context, message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...data,
    });

    // Display error + data in console
    const timestamp = new Date().toLocaleTimeString("en-US");
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
   * Audit log - important actions for compliance
   * @usage logger.audit('UPLOAD_DOC', 'scholarship_selections', { selectionId: '123', fileName: 'cert.pdf' })
   */
  audit: (action, entity, data) => {
    const log = formatLog("AUDIT", entity, action, data);
    printLog("AUDIT", entity, action, data);
    // In the future: send to audit_logs table in Supabase
    return log;
  },

  /**
   * Capture performance of operation
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
