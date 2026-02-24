# Plan de Migración a Playwright para Skill `dom‑to‑markdown`

**Fecha:** 2026‑02‑23  
**Estado:** Confirmado por el usuario  
**Prioridad:** Alta (problemas actuales con navegador headless de OpenClaw)

## 🎯 Objetivo Principal
Reemplazar el navegador headless inestable de OpenClaw con **Playwright** como motor principal para SPAs, manteniendo `web_fetch` para páginas estáticas y conservando el wrapper de OpenClaw browser como fallback.

## 📋 Instrucciones del Usuario
1. **Playwright como fuente única** para renderizado JavaScript (SPAs).
2. **Eliminar dependencia** del navegador headless de OpenClaw como método principal.
3. **Mantener `useWebFetch`** para páginas estáticas (óptimo en rendimiento).
4. **Browser por defecto:** Chromium.
5. **Mantener wrapper de OpenClaw browser** (actualizado) como componente de fallback/compatibilidad.
6. **Guardar este plan** como referencia.

## 🔧 Cambios Arquitectónicos

### Componentes Modificados
```
src/
├── converter.js              (lógica principal de selección de método)
├── detector.js               (mejora detección SPAs complejas)
├── openclaw-browser-wrapper.js (renombrado, mantenido como fallback)
├── playwright-wrapper.js     (NUEVO: basado en script del usuario)
├── cache-store.js            (sin cambios)
└── utils/
    ├── html-cleaner.js       (extraer lógica de limpieza de DOM)
    └── markdown-minifier.js  (extraer lógica de minificación)
```

### Prioridad de Métodos (nueva)
1. **Playwright** (si está instalado) → para SPAs y páginas mixtas
2. **web_fetch** → para páginas estáticas detectadas con alta confianza
3. **OpenClaw browser** → solo como fallback si Playwright no disponible

### Opciones de Configuración Actualizadas
```javascript
{
  // Métodos principales
  usePlaywright: true,           // Usar Playwright para SPAs (default si instalado)
  useWebFetch: true,             // Usar web_fetch para páginas estáticas
  useOpenClawBrowser: false,     // Solo como fallback (no recomendado por problemas)
  
  // Configuración Playwright
  playwrightBrowser: 'chromium', // 'chromium' (default), 'firefox', 'webkit'
  playwrightHeadless: true,
  playwrightWaitUntil: 'networkidle',
  playwrightTimeout: 30000,
  playwrightRemoveElements: [
    'script', 'style', 'noscript', 'iframe', 'svg', 
    'nav', 'footer', 'header', 'aside'
  ],
  
  // Configuración existente (mantener)
  rawHtml: false,
  saveToFile: true,
  useCache: true,
  // ...
}
```

## 🚀 Fases de Implementación

### Fase 1: Análisis y Preparación (2 horas)
- [ ] Analizar script de referencia del usuario y adaptar a arquitectura modular.
- [ ] Decidir dependencias: `playwright` completo vs `playwright-core`.
- [ ] Actualizar `package.json` con `dependencies` para Playwright (obligatorio).

### Fase 2: Crear `PlaywrightWrapper` (3 horas)
- [ ] Crear `src/playwright-wrapper.js` basado en script del usuario.
- [ ] Implementar métodos: `launchBrowser()`, `navigateAndWait()`, `cleanDOM()`, `extractContent()`.
- [ ] Incluir lógica de extracción priorizando `<main>` → página completa.
- [ ] Manejo robusto de errores y timeouts.
- [ ] Integración con sistema de logging existente.

### Fase 3: Mejorar Detector (2 horas)
- [ ] Mejorar heurística para identificar SPAs complejas (React, Vue, Angular, Next.js).
- [ ] Añadir lista de dominios conocidos de SPAs (amazon.*, mercado libre, app.*).
- [ ] Aumentar confianza mínima para sugerir `web_fetch` (evitar falsos positivos).
- [ ] Priorizar Playwright cuando detección sugiera SPA con confianza media/alta.

### Fase 4: Integrar en Converter (3 horas)
- [ ] Modificar `src/converter.js`:
  - Añadir opción `usePlaywright` y configuración relacionada.
  - Implementar `extractWithPlaywright(url, suggestion)`.
  - Actualizar lógica de selección: Playwright > web_fetch > OpenClaw browser.
  - Detectar automáticamente si Playwright está instalado.
  - Mantener fallbacks elegantes.
- [ ] Preservar caché existente (entradas independientes del método).

### Fase 5: Pruebas y Validación (3 horas)
- [ ] Crear tests específicos para Playwright:
  - Páginas estáticas (deben usar `web_fetch`).
  - SPAs complejas (Amazon.es, React apps).
  - Validar extracciones > 1000 caracteres para SPAs.
- [ ] Probar fallbacks (Playwright no instalado → OpenClaw browser).
- [ ] Medir tiempos de extracción y comparar con enfoque anterior.
- [ ] Validar caché funciona correctamente.

### Fase 6: Documentación y Release (2 horas)
- [ ] Actualizar `SKILL.md` con nueva configuración Playwright.
- [ ] Añadir ejemplos de uso y requisitos de instalación.
- [ ] Documentar `optionalDependencies` y mensaje de sugerencia.
- [ ] Crear `CHANGELOG.md` con cambios.

## ⚙️ Dependencias y Compatibilidad

### Playwright como Dependencia Obligatoria
```json
{
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
```

**Requisitos:**
- **Node.js 18+** (requerido por Playwright)
- **Playwright con Chromium**: Se instalará automáticamente al ejecutar `npm install` en la carpeta del skill.
- **Espacio en disco**: ~150 MB para Playwright + browsers.

**Instalación:**
```bash
cd /home/jarvis/.openclaw/workspace/skills/dom-to-markdown
npm install
```

**Verificación en Runtime:**
```javascript
function ensurePlaywrightAvailable() {
  try {
    require('playwright');
    return true;
  } catch (error) {
    throw new Error(
      'Playwright no está instalado. Para extraer contenido de SPAs (React, Vue, etc.), ' +
      'debes instalar las dependencias:\n' +
      '  cd /home/jarvis/.openclaw/workspace/skills/dom-to-markdown\n' +
      '  npm install\n' +
      'Esto instalará Playwright y Chromium automáticamente (~150 MB).'
    );
  }
}
```

### Cadena de Ejecución (Actualizada)
```
if (usePlaywright) {
  ensurePlaywrightAvailable();
  return extractWithPlaywright();
} else if (useWebFetch && detection.suggestsStatic) {
  return extractWithWebFetch();
} else if (useOpenClawBrowser) {
  // Solo como fallback explícito (no recomendado)
  console.warn('Usando navegador OpenClaw (problemas conocidos). Instala Playwright para mejor rendimiento.');
  return extractWithOpenClawBrowser();
} else {
  throw new Error('No extraction method available');
}
```

## 🧪 Casos de Prueba Clave

| URL | Tipo Esperado | Método Esperado | Validación |
|-----|---------------|-----------------|------------|
| `https://docs.openclaw.ai/` | Estática | `web_fetch` | Mantener rendimiento, cache hit |
| `https://amazon.es` | SPA (React) | `playwright` | > 1000 caracteres, contenido renderizado |
| `https://react.dev` | SPA (Next.js) | `playwright` | Contenido completo, componentes React |
| `https://www.diariolibre.com` | Mixta | `playwright` o `web_fetch` | Comparar resultados |
| `https://example.com` | Estática | `web_fetch` | Cache hit rápido |

## ⚠️ Riesgos y Mitigaciones

### Riesgo: Playwright no está instalado o falla la instalación
- **Mitigación**: Verificación al inicio con mensaje de error claro y pasos de instalación.
- **Mitigación**: Documentar requisitos de sistema (Node.js 18+, dependencias de sistema para Playwright).
- **Mitigación**: Incluir script de post‑install que verifique la instalación de browsers.

### Riesgo: Tiempos de extracción largos
- **Mitigación**: Timeout configurable (default 30s), `waitForSelector` para elementos clave.
- **Mitigación**: Cache agresivo para URLs frecuentes.

### Riesgo: Break de API existente
- **Mitigación**: Mantener todas las opciones actuales con defaults compatibles.
- **Mitigación**: Tests de regresión exhaustivos.

## 📅 Cronograma Estimado

**Total:** 15 horas (≈ 2‑3 sesiones de trabajo)

| Fase | Horas | Estado |
|------|-------|--------|
| 1. Análisis y Preparación | 2 | Pendiente |
| 2. PlaywrightWrapper | 3 | Pendiente |
| 3. Mejorar Detector | 2 | Pendiente |
| 4. Integrar en Converter | 3 | Pendiente |
| 5. Pruebas y Validación | 3 | Pendiente |
| 6. Documentación | 2 | Pendiente |

## 🚀 Próximos Pasos Inmediatos

1. **Confirmar entendimiento** con el usuario (instrucciones claras). ✅
2. **Actualizar `package.json`** para mover `playwright` a `dependencies` (obligatorio).
3. **Iniciar Fase 1** (análisis y preparación).
4. **Crear branch** en el repositorio si se usa control de versiones.
5. **Ejecutar implementación** por fases, validando cada paso.

---

## 📝 Notas Adicionales

- **Script de referencia del usuario:** Ya proporcionado, funciona bien con Amazon.es.
- **Problemas actuales:** Navegador headless de OpenClaw inestable, extracciones mínimas en SPAs.
- **Objetivo de calidad:** Extracciones consistentes > 1000 caracteres para SPAs complejas.
- **Compatibilidad hacia atrás:** Parcial – el skill requerirá `npm install` para instalar Playwright. Las páginas estáticas seguirán funcionando con `web_fetch`, pero las SPAs fallarán con un error claro si Playwright no está instalado.

---

**Última actualización:** 2026‑02‑23 (22:46 AST)  
**Responsable:** Jarvis (OpenClaw Assistant)  
**Estado:** ✅ Plan actualizado según feedback, listo para ejecución