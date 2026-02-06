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

### 17.1 Logger Centralizado

Crear `src/utils/logger.ts`:

```typescript
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export const logger = {
  debug: (context: string, message: string, data?: Record<string, any>) => {...},
  info: (context: string, message: string, data?: Record<string, any>) => {...},
  warn: (context: string, message: string, data?: Record<string, any>) => {...},
  error: (context: string, message: string, error?: Error, data?: Record<string, any>) => {...},
  audit: (action: string, entity: string, data: Record<string, any>) => {...},
};
```

**Características:**

- ✅ Timestamps ISO
- ✅ Context (componente/función)
- ✅ Niveles: DEBUG, INFO, WARN, ERROR, AUDIT
- ✅ Metadata estructurada
- ✅ Flag para dev/prod

### 17.2 Error Boundary & Error Tracking

- [ ] Crear `ErrorBoundary.jsx` component
- [ ] Implementar error tracking (Sentry o custom)
- [ ] Toast notifications para errores
- [ ] Log automático de stack traces

### 17.3 Performance Monitoring

- [ ] Medir tiempos de carga de queries
- [ ] Detectar memory leaks
- [ ] Monitor de renders (React DevTools)
- [ ] Web Vitals: LCP, FID, CLS

### 17.4 Audit Logs Mejorados

- [ ] Tabla `audit_logs` en Supabase (crear si no existe)
- [ ] Logging de acciones: LOGIN, UPLOAD, UPDATE_STATUS, etc.
- [ ] Incluir: usuario, timestamp, acción, resultado
- [ ] Dashboard admin para ver audit logs

### 17.5 Request/Response Logging (Server)

Actualizar `server/index.js`:

- [ ] Middleware de logging para cada request
- [ ] Log de tiempo de respuesta
- [ ] Log de errores 4xx y 5xx
- [ ] Log de payloads (sin contraseñas)

**Resultado esperado:** Sistema de observabilidad funcionando, poder debuggear sin `console.log` aleatorios.

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

- [ ] 0 `console.log()` o todos usando `logger()`
- [ ] `npm run lint` sin warnings
- [ ] Documentación actualizada
- [ ] Tests de performance OK

### Sprint 17

- [ ] Logger centralizado funcionando
- [ ] ErrorBoundary implementado
- [ ] Audit logs en Supabase
- [ ] Dashboard admin muestra audit logs

### Sprint 18

- [ ] Todos los inputs validados con Zod
- [ ] RLS policies verificadas en todas tablas
- [ ] CORS/CSRF/CSP headers implementados
- [ ] Security headers en servidor

---

## 🚀 Ejecución

Empezamos con **SPRINT 16**? Quieres que implemente en orden o prefieres algún adjustments?
