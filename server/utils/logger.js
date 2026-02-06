/**
 * LOGGER CENTRALIZADO - SERVER (SPRINT 16)
 * Sistema único de logging para toda la API
 * Compatible con Node.js
 */

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Formatea entry de log estructurado
 */
const formatLog = (level, context, message, data) => ({
  timestamp: new Date().toISOString(),
  level,
  context,
  message,
  ...(data && { data }),
});

/**
 * Imprime log en consola
 */
const printLog = (level, context, message, data) => {
  if (!isDevelopment && level === "DEBUG") return; // No DEBUG en producción

  const timestamp = new Date().toLocaleTimeString("es-EC");

  const icons = {
    DEBUG: "🔍",
    INFO: "ℹ️",
    WARN: "⚠️",
    ERROR: "❌",
    AUDIT: "📋",
  };

  const icon = icons[level] || "•";
  const prefix = `[${level}] ${context} — ${timestamp}`;

  let output = `${icon} ${prefix}\n  ${message}`;

  if (data && Object.keys(data).length > 0) {
    output += "\n  " + JSON.stringify(data, null, 2).split("\n").join("\n  ");
  }

  console.log(output);
};

/**
 * Sistema centralizado de logging para servidor
 */
export const logger = {
  debug: (context, message, data) => {
    const log = formatLog("DEBUG", context, message, data);
    printLog("DEBUG", context, message, data);
    return log;
  },

  info: (context, message, data) => {
    const log = formatLog("INFO", context, message, data);
    printLog("INFO", context, message, data);
    return log;
  },

  warn: (context, message, data) => {
    const log = formatLog("WARN", context, message, data);
    printLog("WARN", context, message, data);
    return log;
  },

  error: (context, message, error, data) => {
    const log = formatLog("ERROR", context, message, {
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...data,
    });

    const timestamp = new Date().toLocaleTimeString("es-EC");
    const prefix = `[ERROR] ${context} — ${timestamp}`;

    let output = `❌ ${prefix}\n  ${message}`;
    if (error?.message) output += `\n  Error: ${error.message}`;
    if (data && Object.keys(data).length > 0) {
      output += "\n  " + JSON.stringify(data, null, 2).split("\n").join("\n  ");
    }

    console.error(output);
    return log;
  },

  audit: (action, entity, data) => {
    const log = formatLog("AUDIT", entity, action, data);
    printLog("AUDIT", entity, action, data);
    return log;
  },
};

export default logger;
