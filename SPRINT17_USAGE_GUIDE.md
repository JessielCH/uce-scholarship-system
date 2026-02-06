/\*\*

- SPRINT 17 — OBSERVABILIDAD
- GUÍA DE USO Y EJEMPLOS
  \*/

// ============================================================================
// 1. LOGGER CENTRALIZADO
// ============================================================================

// Importar
import { logger } from "@/utils/logger";

// Ejemplos básicos:
logger.debug("ComponenteName", "Mensaje de debug", { data: value });
logger.info("ComponenteName", "Información general", { count: 42 });
logger.warn("ComponenteName", "Advertencia", { issue: "missing_data" });
logger.error("ComponenteName", "Error occurred", error, { context: "fetching" });
logger.audit("CREATE_STAFF", "users", { userId: "123", email: "user@test.com" });

// Performance timing:
logger.perf("QueryName", 150); // 150ms

// ============================================================================
// 2. ERROR BOUNDARY (Envuelve componentes críticos)
// ============================================================================

// App.jsx - Ya implementado, envuelve toda la app
import ErrorBoundary from "@/components/shared/ErrorBoundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// O en componentes específicos
<ErrorBoundary>
<AdminDashboard />
</ErrorBoundary>

// ============================================================================
// 3. ERROR TRACKING SERVICE (Registrar errores en BD)
// ============================================================================

import { trackError, trackFetchError, trackQueryError } from "@/utils/errorTracking";

// Capturar error genérico
try {
await someAsyncOperation();
} catch (error) {
const errorId = await trackError("ComponentName", error, {
operation: "fetch_data",
endpoint: "/api/endpoint"
});
// errorId puede mostrarse al usuario para reporting
}

// Capturar error de fetch
try {
const response = await fetch("/api/data");
if (!response.ok) {
const error = new Error(`HTTP ${response.status}`);
await trackFetchError("/api/data", "GET", response.status, error, "DataFetch");
}
} catch (error) {
await trackFetchError("/api/data", "GET", null, error, "DataFetch");
}

// Capturar error de query (React Query)
try {
const data = await queryFn();
} catch (error) {
await trackQueryError(["scholarships", "list"], error, "ScholarshipsQuery");
}

// ============================================================================
// 4. PERFORMANCE MONITORING HOOKS
// ============================================================================

import { usePerformance, useQueryPerformance, useWebVitals, useMemoryProfile } from "@/hooks/usePerformance";

// 4.1 - usePerformance: Medir renderización de componente
function Dashboard() {
const { getRenderMetrics, renderCount } = usePerformance("Dashboard", { logThreshold: 100 });

useEffect(() => {
const metrics = getRenderMetrics();
console.log(`Rendered ${metrics.renderCount} times, total: ${metrics.totalTime}ms`);
}, []);

return <div>Component content</div>;
}

// 4.2 - useQueryPerformance: Monitorear duración de queries
function UserList() {
const wrappedQueryFn = useQueryPerformance(
["users", "list"],
async () => {
return await supabase.from("users").select("\*");
},
{ logThreshold: 1000 } // Log si toma más de 1s
);

const { data } = useQuery(["users", "list"], wrappedQueryFn);

return <div>{data?.length} usuarios</div>;
}

// 4.3 - useWebVitals: Medir Core Web Vitals
function App() {
useWebVitals(); // Ejecutar en el componente raíz
return <YourRoutes />;
}

// 4.4 - useMemoryProfile: Snapshot de memoria (desarrollo)
function DebugComponent() {
const { checkMemory } = useMemoryProfile("MyComponent");

const handleSnapshot = () => {
checkMemory(); // Logueará en console el uso de memoria
};

return <button onClick={handleSnapshot}>Memory Snapshot</button>;
}

// ============================================================================
// 5. AUDIT LOGS DASHBOARD
// ============================================================================

// Ubicación: /admin/audit-logs (solo ADMIN)
// "Rutas" → "Admin" → "Audit Logs"

// Funciones:
// - Ver todos los audit logs en tabla
// - Filtrar por: acción, entidad, rango de fechas, usuario
// - Paginación (20 por página)
// - Exportar a CSV para análisis externo
// - Color-coded by action type

// ============================================================================
// 6. SERVER MIDDLEWARE (Usar en server/index.js)
// ============================================================================

import { requestLogger, errorHandler, auditLog, performanceMonitor } from "./middleware/requestLogger.js";

// En tu Express app:
app.use(requestLogger); // Loguea todas las requests
app.use(performanceMonitor); // Monitorea performance

// En rutas específicas que requieren auditoría:
app.post("/api/staff", auditLog("CREATE_STAFF", "users"), staffController.create);
app.put("/api/staff/:id", auditLog("UPDATE_STAFF", "users"), staffController.update);

// Al final:
app.use(errorHandler); // Captura y loguea errores

// ============================================================================
// 7. INTEGRACIONES PRÁCTICAS
// ============================================================================

// EJEMPLO 1: Dashboard con error boundary
export default function AdminDashboard() {
const { getRenderMetrics } = usePerformance("AdminDashboard");

useEffect(() => {
const metrics = getRenderMetrics();
logger.info("AdminDashboard", "Component rendered", {
renderCount: metrics.renderCount,
totalTime: metrics.totalTime,
});
}, [getRenderMetrics]);

return (
<ErrorBoundary>
<div className="dashboard">
{/_ Content _/}
</div>
</ErrorBoundary>
);
}

// EJEMPLO 2: Query con performance tracking
function ScholarshipsList() {
const wrappedQueryFn = useQueryPerformance(
["scholarships", "list"],
async () => {
try {
const { data, error } = await supabase
.from("scholarships")
.select("\*");

        if (error) throw error;
        return data;
      } catch (error) {
        await trackQueryError(["scholarships", "list"], error, "ScholarshipsList");
        throw error;
      }
    },
    { logThreshold: 500 }

);

const { data: scholarships } = useQuery(
["scholarships", "list"],
wrappedQueryFn
);

return (
<div>
{scholarships?.map(s => (
<div key={s.id}>{s.name}</div>
))}
</div>
);
}

// EJEMPLO 3: Manejo de errores con tracking
async function uploadFile(file) {
try {
const { error } = await supabase.storage
.from("documents")
.upload(`uploads/${file.name}`, file);

    if (error) throw error;
    logger.info("Upload", "Archivo subido exitosamente", { fileName: file.name });

} catch (error) {
const errorId = await trackError("FileUpload", error, {
fileName: file.name,
fileSize: file.size,
});
logger.error("Upload", "Error al subir archivo", error, { errorId });
}
}

// ============================================================================
// 8. CÓMO ACCEDER A AUDIT LOGS
// ============================================================================

// 1. Iniciar sesión como ADMIN
// 2. Ir a /admin/audit-logs
// 3. Ver tabla con todos los registros
// 4. Filtrar por:
// - Acción (CREATE_STAFF, LOGOUT, etc.)
// - Entidad (users, scholarship_selections, etc.)
// - Rango de fechas
// - Usuario específico
// 5. Exportar a CSV para análisis en Excel
// 6. Ver detalles en JSON en la columna "Detalles"

// Los datos se almacenan en la tabla "audit_logs" de Supabase
// Estructura:
// - id: uuid (auto)
// - action: string (CREATE_STAFF, LOGOUT, etc.)
// - target_entity: string (users, documents, etc.)
// - target_id: uuid (opcional, ID de el recurso afectado)
// - user_id: uuid (quién realizó la acción)
// - details: jsonb (metadata adicional)
// - created_at: timestamp (auto)

// ============================================================================
// 9. LOG LEVELS EXPLICADOS
// ============================================================================

// DEBUG - Información detallada para debugging (solo en desarrollo)
logger.debug("MyComponent", "Entering function with params", { params });

// INFO - Información general del flujo de la aplicación
logger.info("Auth", "User login successful", { userId, email });

// WARN - Algo inusual pero no es error
logger.warn("Query", "Slow query detected", { duration: 2000 });

// ERROR - Error que ocurrió pero la app continúa
logger.error("Upload", "File upload failed", error, { fileName });

// AUDIT - Acciones críticas para compliance/auditoría
logger.audit("CREATE_STAFF", "users", { createdBy: userId, newUserId });

// ============================================================================
// 10. PRÓXMOS PASOS - SPRINT 18 (SEGURIDAD)
// ============================================================================

// El siguiente sprint cubrirá:
// - Input validation endurecimiento
// - CORS/CSRF hardening
// - RLS policies verificación
// - Secret management cleanup
// - Security headers

// Mientras tanto:
// - Usa el logger para todo (no más console.log)
// - Captura errores con trackError()
// - Monitorea performance con usePerformance()
// - Auditea acciones en AuditLogs dashboard
