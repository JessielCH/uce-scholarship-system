# 🎯 SPRINT 16-18 ROADMAP: Optimización, Observabilidad y Seguridad

## 🔵 SPRINT 16 — Optimización y Cleanup (Deuda Técnica)

**Objetivo:** Eliminar deuda técnica, optimizar código y preparar base para observabilidad.

### 16.1 Eliminación de Logs Residuales

- [ ] Remover todos `console.log/warn/error` sin estructura
- [ ] Reemplazar con función centralizada `logger()`
- [ ] Archivo: `src/utils/logger.ts` (nuevo)

**Archivos a limpiar:**

- ✅ `src/utils/scholarshipLogic.js` - 12+ logs
- ✅ `src/utils/ocrLogic.js` - 8+ logs
- ✅ `src/context/AuthContext.jsx` - 10+ logs
- ✅ `src/pages/Login.jsx` - 5+ logs
- ✅ `src/pages/admin/StaffSettings.jsx` - 4+ logs
- ✅ `src/pages/admin/StaffDashboard.jsx` - 2+ logs
- ✅ `src/components/organisms/BankUploadModal/BankUploadModal.jsx` - 2+ logs
- ✅ `src/components/student/BankUploadModal.jsx` - 2+ logs
- ✅ `server/scripts/ingestData.js` - 15+ logs

### 16.2 Optimización de Imports y Dependencias

- [ ] Ejecutar `npm run lint` y fijar issues
- [ ] Revisar imports no utilizados
- [ ] Consolidar imports duplicados
- [ ] Actualizar barrel exports si es necesario

### 16.3 Code Splitting & Performance

- [ ] Identificar componentes grandes (>300 LOC)
- [ ] Lazy load routes si aplica
- [ ] Revisar re-renders innecesarios
- [ ] Optimizar queries en React Query

### 16.4 Cleanup de Archivos

- [ ] Eliminar comentarios TODO innecesarios
- [ ] Standarizar comentarios de bloque
- [ ] Remover código comentado
- [ ] Verificar archivos .bak o temporales

**Resultado esperado:** Código limpio, sin logs dispersos, base lista para logging estructurado.

---

## 🔵 SPRINT 17 — Logs y Observabilidad (Debugging)

**Objetivo:** Sistema centralizado de logs, error tracking y debugging sin adivinanzas.

### 17.1 Logger Centralizado ✅

✅ **Completado:**

- ✅ `client/src/utils/logger.js` (210 LOC)
- ✅ `server/utils/logger.js` (130 LOC)

**Características implementadas:**

- ✅ Timestamps ISO
- ✅ Context (componente/función)
- ✅ Niveles: DEBUG, INFO, WARN, ERROR, AUDIT
- ✅ Metadata estructurada
- ✅ Flag para dev/prod
- ✅ Performance timing helpers (`perf()`)
- ✅ Color console output (desarrollo)

### 17.2 Error Boundary & Error Tracking ✅

✅ **Completado:**

- ✅ `client/src/components/shared/ErrorBoundary.jsx` (120 LOC)
  - Error ID generation: `ERR_${timestamp}_${random}`
  - getDerivedStateFromError() + componentDidCatch()
  - Structured error logging with stack traces
  - Beautiful error UI (dev mode shows details, prod mode user-friendly)
  - Reset button navigation
- ✅ `client/src/utils/errorTracking.js` (90 LOC)
  - `trackError()` - Registra errores en audit_logs
  - `trackFetchError()` - Captura errores de fetch
  - `trackQueryError()` - Captura errores de React Query
  - Almacenamiento en BD para análisis posterior

- ✅ Integración en `App.jsx`
  - ErrorBoundary envuelve toda la aplicación
  - Captura React errors antes de crashear

### 17.3 Performance Monitoring ✅

✅ **Completado:**

- ✅ `client/src/hooks/usePerformance.js` (120 LOC)
  - `usePerformance()` - Mide tiempos de renderizado
  - `useQueryPerformance()` - Monitorea queries
  - `useWebVitals()` - Mide Web Vitals (LCP, FID, CLS)
  - `useMemoryProfile()` - Memory snapshots en desarrollo
  - Threshold-based logging (1000ms por defecto)

### 17.4 Audit Logs Mejorados ✅

✅ **Completado:**

- ✅ `client/src/pages/admin/AuditLogs.jsx` (280 LOC)
  - Tabla completa de audit_logs desde Supabase
  - Filtrado por acción, entidad, fecha, usuario
  - Paginación (20 registros por página)
  - Exportación a CSV
  - Color-coding por acción tipo
  - Búsqueda en tiempo real con debouncing
  - Timestamps formateados
  - Detalles JSON visualizables

- ✅ Rutas integradas:
  - `/admin/audit-logs` - Acceso solo ADMIN
  - Enlace en AdminLayout (pendiente agregar a nav)

**Acciones auditadas:**

- ✅ CREATE_STAFF
- ✅ UPDATE_STAFF
- ✅ LOGOUT
- ✅ UPLOAD_EXCEL
- ✅ ERROR_TRACKED
- ✅ Todas las requests (server)

### 17.5 Request/Response Logging (Server) ✅

✅ **Completado:**

- ✅ `server/middleware/requestLogger.js` (140 LOC)
  - `requestLogger()` - Middleware main
    - Request logging (method, path, query, IP, user-agent)
    - Response logging (status, duration)
    - Unique request ID generation: `REQ_${timestamp}_${random}`
  - `errorHandler()` - Error handling middleware
    - Error logging con stack traces
    - Structured error response
    - Error ID generation
  - `auditLog()` - Audit logging middleware
    - Wrapper para acciones críticas
    - Registra userName, acción, entidad
  - `performanceMonitor()` - Threshold-based perf logging
    - Logs slow requests (>500ms)
    - High-resolution timing (hrtime)

**Resultado esperado:** ✅ Sistema de observabilidad funcionando full, poder debuggear sin `console.log` aleatorios.

---

## 🔵 SPRINT 18 — Seguridad Extra (Hardening)

**Objetivo:** Hardening completo contra vulnerabilidades comunes.

### 18.1 Input Validation & Sanitization

- [ ] Revisar todos los `Zod` schemas (cliente + servidor)
- [ ] Validar en ambos lados (cliente + API)
- [ ] Sanitizar HTML en inputs
- [ ] Prevenir XSS: escapar renderizados dinámicos

**Lugares críticos:**

- ✅ Login form (email, password)
- ✅ Staff Settings (fullName, email)
- ✅ Excel upload (processScholarshipFile)
- ✅ File uploads (BankUploadModal, ContractUploadModal)

### 18.2 CORS & CSRF Hardening

En `server/index.js`:

- [ ] Validar CORS origins (no `*`)
- [ ] Implementar CSRF tokens
- [ ] Verificar referer headers
- [ ] Rate limiting en endpoints sensibles

### 18.3 Authentication & Authorization

- [ ] Revisar RLS policies en Supabase
- [ ] Verificar que users solo accedan sus datos
- [ ] Role-based access control (ADMIN vs STAFF vs STUDENT)
- [ ] Session timeout config

**Checklist RLS:**

- ✅ `students` table - students solo leen sus registros
- ✅ `documents` table - users solo acceden documentos de sus selections
- ✅ `scholarship_selections` - RLS por student_id
- ✅ `profiles` - RLS por id

### 18.4 Secret Management

- [ ] Verificar `.env` contiene solo en servidor
- [ ] No exponer env vars en cliente (excepto VITE\_)
- [ ] Verificar Supabase keys están en .env
- [ ] Rekeying de keys en README

### 18.5 Output Encoding & CSP

- [ ] Content-Security-Policy headers
- [ ] X-Frame-Options (clickjacking)
- [ ] X-Content-Type-Options (MIME sniffing)
- [ ] Strict-Transport-Security (HTTPS)

### 18.6 File Upload Security

Revisar en `BankUploadModal`, `ContractUploadModal`:

- [ ] Validar tipo MIME (no solo extensión)
- [ ] Limitar tamaño de archivo
- [ ] Scan de malware (si presupuesto lo permite)
- [ ] Almacenar en carpeta no pública

### 18.7 SQL Injection Prevention

- [ ] Verificar todos queries usan parameterización
- [ ] No concatenar strings en queries
- [ ] Usar Zod para validar antes de queries

### 18.8 Dependency Security

- [ ] `npm audit --fix` en client y server
- [ ] Revisar vulnerabilidades de librerías críticas
- [ ] Update to latest patches

**Resultado esperado:** Aplicación hardened contra OWASP Top 10.

---

## 📋 Timeline Estimado

| Sprint | Duración | Tareas                        | Prioridad  |
| ------ | -------- | ----------------------------- | ---------- |
| 16     | 2-3 días | Cleanup, Imports, Performance | 🔴 ALTA    |
| 17     | 3-4 días | Logger, Error Tracking, Audit | 🔴 ALTA    |
| 18     | 4-5 días | Seguridad, Hardening, RLS     | 🔴 CRÍTICA |

**Total estimado:** 1.5-2 semanas

---

## ✅ Definición de Hecho para cada Sprint

### Sprint 16

- ✅ 0 `console.log()` o todos usando `logger()`
- ✅ `npm run lint` sin warnings
- ✅ Documentación actualizada
- ✅ Tests de performance OK

### Sprint 17 ✅ COMPLETADO

- ✅ Logger centralizado funcionando (client + server)
- ✅ ErrorBoundary implementado e integrado en App.jsx
- ✅ Error tracking service con BD storage
- ✅ Performance monitoring hooks (render, query, Web Vitals, memory)
- ✅ Audit logs dashboard con filtrado, paginación, export CSV
- ✅ Request/Response logging middleware para server
- ✅ 0 compilation errors verified

### Sprint 18

- [ ] Todos los inputs validados con Zod
- [ ] RLS policies verificadas en todas tablas
- [ ] CORS/CSRF/CSP headers implementados
- [ ] Security headers en servidor

---

## 🚀 Ejecución

Empezamos con **SPRINT 16**? Quieres que implemente en orden o prefieres algún adjustments?
