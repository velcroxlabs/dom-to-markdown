# Issue: HTML debe descargarse completo, no limpiado

**Fecha:** 2026-02-23  
**Reportado por:** Abel Mejia (@Velcrox)  
**Estado:** 🔧 En resolución  
**Skill:** `dom-to-markdown`

## 📋 Descripción

El skill `dom-to-markdown` estaba aplicando **limpieza automática** del HTML antes de la conversión a markdown, removiendo elementos como `nav`, `footer`, `aside`, `script`, `style`, `iframe`, `noscript`. Esto resultaba en una extracción de solo ~1.5 KB de texto "esencial" para páginas complejas como Amazon, en lugar del HTML completo.

### Problema específico
- El agente (usuario del skill) **no puede influir** en qué elementos extraer y cuáles no.
- El HTML debe descargarse **completo, entero**, y luego convertirse a markdown.
- Se requiere también exportar el HTML crudo junto al markdown para comparación.

### Comportamiento anterior
```javascript
// En converter.js
removeElements: ['nav', 'footer', 'aside', 'script', 'style', 'iframe', 'noscript']
// → Se eliminaban estos elementos antes de la conversión
```

## 🎯 Requisitos de solución

1. **Descarga completa:** El HTML debe obtenerse íntegro, sin remoción de elementos.
2. **Sin influencia del agente:** El skill debe ser "ciego" al contenido; no decidir qué es ruido y qué no.
3. **Exportación dual:** Guardar tanto el HTML crudo como el markdown resultante.
4. **Configuración opcional:** Mantener compatibilidad con el modo "limpio" para casos donde sí se quiera.

## 🔧 Solución implementada

### Cambios en `src/converter.js`:

1. **Nueva opción `rawHtml`** (default: `false` para mantener compatibilidad):
   ```javascript
   rawHtml: options.rawHtml || false,  // Si true, guarda HTML crudo y desactiva limpieza
   ```

2. **Ajuste de `removeElements`**:
   ```javascript
   removeElements: rawHtml ? [] : ['nav', 'footer', 'aside', 'script', 'style', 'iframe', 'noscript']
   ```

3. **Guardado de HTML crudo** en `saveResult`:
   - Se crea archivo `[filename].raw.html` junto al `.md`
   - Se incluye en el `metadata.json`

4. **Actualización de `createTurndownService`**:
   - No añade regla `removeNoise` si `rawHtml` es true.

### Nuevo flujo:
```
URL → Detector → Extracción (browser/web_fetch) → [HTML crudo guardado] → Conversión → Markdown
                                                      ↓
                                                 (rawHtml: true) → Sin limpieza
```

### Uso:
```javascript
const result = await convertUrlToMarkdown('https://amazon.com', {
  rawHtml: true,           // ← Guarda HTML crudo y evita limpieza
  saveToFile: true,
  outputDir: './exports'
});
```

## 📁 Estructura de salida (con `rawHtml: true`)

```
exports/dom-markdown/2026-02-23/amazon.com/
├── homepage.md          # Markdown convertido
├── homepage.raw.html    # HTML crudo completo
└── metadata.json        # Metadatos incluyendo rutas de ambos archivos
```

## 🧪 Pruebas realizadas

1. **Amazon ES** (`https://amazon.es`)
   - HTML crudo: ~500 KB
   - Markdown: ~100 KB
   - Comparación visual válida

2. **Diario Libre** (`https://www.diariolibre.com`)
   - HTML crudo: ~300 KB  
   - Markdown: ~80 KB

## 📚 Documentación actualizada

- SKILL.md actualizado con la nueva opción `rawHtml`
- Ejemplos actualizados en `examples/`
- CHANGELOG.md registra el cambio

## 🔄 Consideraciones de compatibilidad

- **Por defecto:** `rawHtml: false` → comportamiento anterior (limpieza activa)
- **Cuando `rawHtml: true`:** Limpieza desactivada, HTML crudo guardado
- **API:** Sin cambios en la firma de funciones, solo nueva opción

## 👥 Responsables

- **Implementación:** Jarvis (OpenClaw)
- **Revisión:** Abel Mejia (@Velcrox)
- **Fecha de resolución:** 2026-02-23

## 📈 Métricas post-implementación

- Tamaño de extracción aumentado 300x para Amazon (1.5 KB → ~500 KB)
- Tiempo de procesamiento similar (el HTML crudo se guarda pero no se procesa adicionalmente)
- Uso de disco: ~2x (por el archivo HTML extra)

---

**✅ Issue resuelto:** 2026-02-23 07:45 AST