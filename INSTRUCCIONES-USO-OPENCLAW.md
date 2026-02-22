# 📖 INSTRUCCIONES CLARAS: Cómo usar el skill `dom-to-markdown` desde OpenClaw

## 🎯 **OBJETIVO PRINCIPAL**
Que los agentes OpenClaw usen automáticamente este skill para convertir cualquier página web a markdown limpio.

## 📍 **UBICACIÓN DEL SKILL**
```
/home/jarvis/.openclaw/workspace/skills/dom-to-markdown/
```

## 🚀 **3 FORMAS DE USARLO**

### 1️⃣ **USO DIRECTO EN AGENTE (RECOMENDADO)**

```javascript
// Dentro de cualquier sesión de agente OpenClaw
const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');

// Convertir cualquier URL
const result = await skill.convertUrlToMarkdown('https://diariolibre.com', {
  debug: true,
  saveToFile: true
});

if (result.success) {
  console.log(`✅ Convertido: ${result.markdown.length} caracteres`);
  console.log(`📁 Guardado en: ${result.metadata.savedPath}`);
  
  // Usar el markdown para lo que necesites
  await message({
    action: 'send',
    to: '2022326950',
    message: `Extraí ${result.markdown.length} caracteres de ${result.metadata.url}`
  });
}
```

### 2️⃣ **USO AUTOMÁTICO EN HEARTBEATS**

```javascript
// En HEARTBEAT.md o en cron jobs
const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');

// Revisar páginas importantes periódicamente
const urlsToMonitor = [
  'https://diariolibre.com',
  'https://elnacional.com.do',
  'https://openclaw.ai'
];

for (const url of urlsToMonitor) {
  const result = await skill.convertUrlToMarkdown(url, {
    saveToFile: true,
    outputDir: './exports/monitoring'
  });
  
  if (result.success) {
    // Registrar en memoria
    await memory_search({ query: `Extraído ${url}` });
  }
}
```

### 3️⃣ **INTEGRACIÓN EN SUB-AGENTES**

```javascript
// Spawnear un sub-agente dedicado a extracción
await sessions_spawn({
  task: `Extraer y convertir https://lit.dev a markdown usando el skill dom-to-markdown`,
  label: 'extraccion-lit-dev',
  agentId: 'main',
  runTimeoutSeconds: 120
});

// El sub-agente ejecutará:
const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');
await skill.convertUrlToMarkdown('https://lit.dev', {
  useBrowserHeadless: true,
  waitTime: 8000
});
```

## ⚙️ **CONFIGURACIÓN PARA USO AUTOMÁTICO**

### **Configuración mínima:**
```javascript
{
  useBrowserHeadless: true,    // SIEMPRE true para SPAs
  useWebFetch: true,           // true para páginas estáticas
  debug: false,                // false en producción
  saveToFile: true,            // Guardar resultados
  outputDir: './exports/auto'  // Directorio para guardar
}
```

### **Configuración avanzada:**
```javascript
{
  // Métodos de extracción
  useBrowserHeadless: true,
  useWebFetch: true,
  useFirecrawl: false,         // Opcional si tienes API key
  
  // Comportamiento del browser
  headless: true,
  waitTime: 10000,             // 10 segundos para JavaScript pesado
  profile: 'openclaw',         // Perfil del browser
  
  // Procesamiento
  removeAds: true,
  preserveCodeBlocks: true,
  maxFileSize: 5000000,        // 5MB máximo
  
  // Salida
  saveToFile: true,
  outputDir: './exports/web-content',
  createMetadata: true,
  
  // Seguridad
  timeout: 120,                // 2 minutos máximo
  maxRetries: 3
}
```

## 🔄 **EJEMPLO COMPLETO: Agente que usa el skill**

```javascript
// Ejemplo: Agente que responde a solicitudes de extracción
async function handleExtractionRequest(url) {
  console.log(`🔍 Iniciando extracción de: ${url}`);
  
  // 1. Cargar el skill
  const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');
  
  // 2. Ejecutar conversión
  const result = await skill.convertUrlToMarkdown(url, {
    useBrowserHeadless: true,
    waitTime: 5000,
    saveToFile: true,
    outputDir: './exports/user-requests',
    debug: true
  });
  
  // 3. Procesar resultado
  if (result.success) {
    return {
      status: 'success',
      markdownLength: result.markdown.length,
      savedPath: result.metadata.savedPath,
      compression: result.metadata.compressionRatio,
      preview: result.markdown.substring(0, 500) + '...'
    };
  } else {
    return {
      status: 'error',
      error: result.error,
      fallbackHtml: result.fallbackHtml?.substring(0, 1000)
    };
  }
}

// Uso:
const response = await handleExtractionRequest('https://react.dev');
console.log(response);
```

## 📁 **ESTRUCTURA DE SALIDA AUTOMÁTICA**

```
exports/
├── auto/                          # Extracciones automáticas
│   ├── 2026-02-22/
│   │   ├── diariolibre.com/
│   │   │   ├── homepage.md
│   │   │   └── metadata.json
│   │   └── react.dev/
│   │       ├── learn.md
│   │       └── metadata.json
│   └── logs/
│       └── extraction-log.json
├── monitoring/                    # Heartbeats/cron
│   └── daily-check-2026-02-22.json
└── user-requests/                # Solicitudes manuales
    └── user-2022326950/
        └── lit-dev-2026-02-22.md
```

## 🎯 **CASOS DE USO PRÁCTICOS**

### **Caso 1: Extraer noticias diarias**
```javascript
// En un cron job diario a las 8:00 AM
const newsSites = [
  'https://diariolibre.com',
  'https://elnacional.com.do',
  'https://listindiario.com'
];

for (const site of newsSites) {
  await skill.convertUrlToMarkdown(site, {
    outputDir: `./exports/news/${new Date().toISOString().split('T')[0]}`
  });
}
```

### **Caso 2: Investigar competidores**
```javascript
// Agente de investigación
const competitors = [
  'https://openai.com',
  'https://anthropic.com',
  'https://cohere.com'
];

const reports = [];
for (const competitor of competitors) {
  const result = await skill.convertUrlToMarkdown(competitor);
  reports.push({
    company: competitor,
    contentLength: result.markdown?.length || 0,
    extracted: result.success
  });
}
```

### **Caso 3: Archivar páginas importantes**
```javascript
// Archivar documentación técnica
const docsToArchive = [
  'https://docs.openclaw.ai',
  'https://lit.dev/docs',
  'https://react.dev/learn'
];

await Promise.all(docsToArchive.map(url => 
  skill.convertUrlToMarkdown(url, {
    outputDir: './exports/archived-docs'
  })
));
```

## ⚠️ **PUNTOS CLAVE A RECORDAR**

### **✅ LO QUE SÍ FUNCIONA:**
1. **Dentro de agentes OpenClaw** - El skill accede al browser tool sin problemas
2. **SPAs con JavaScript** - Usa browser headless automáticamente
3. **Páginas estáticas** - Usa web_fetch para mayor velocidad
4. **Almacenamiento automático** - Guarda en estructura organizada

### **❌ LO QUE NO FUNCIONA:**
1. **Fuera de OpenClaw** - Scripts Node.js independientes NO pueden usar el skill
2. **Sin sesión de agente** - Necesita el contexto de OpenClaw para herramientas

### **🔧 CONFIGURACIÓN REQUERIDA:**
1. **Browser de OpenClaw habilitado** en `openclaw.json`
2. **Perfil `openclaw`** configurado para headless
3. **Espacio en disco** para archivos exportados

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Problema: "Browser tool not available"**
```javascript
// CAUSA: Estás fuera del contexto de agente OpenClaw
// SOLUCIÓN: Usar el skill solo dentro de agentes

// ❌ MAL (script independiente):
// node mi-script.js → ERROR

// ✅ BIEN (dentro de agente):
// 1. En sesión OpenClaw
// 2. En sub-agente spawn
// 3. En cron job con agentTurn
```

### **Problema: Timeout en SPAs pesadas**
```javascript
// Aumentar waitTime
await skill.convertUrlToMarkdown(url, {
  useBrowserHeadless: true,
  waitTime: 15000,  // 15 segundos
  timeout: 180      // 3 minutos máximo
});
```

### **Problema: Muchos archivos generados**
```javascript
// Configurar limpieza automática
await skill.convertUrlToMarkdown(url, {
  saveToFile: true,
  outputDir: './exports',
  maxFilesPerDay: 10,  // Mantener solo 10 archivos por día
  cleanupOldFiles: true
});
```

## 📊 **MONITOREO DEL USO**

```javascript
// Verificar estadísticas de uso
const fs = require('fs');
const statsPath = '/home/jarvis/.openclaw/workspace/skills/dom-to-markdown/exports/stats.json';

function getUsageStats() {
  if (fs.existsSync(statsPath)) {
    return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  }
  
  return {
    totalConversions: 0,
    byDomain: {},
    lastUsed: null,
    successRate: 0
  };
}

// Actualizar después de cada uso
function updateStats(result) {
  const stats = getUsageStats();
  stats.totalConversions++;
  stats.lastUsed = new Date().toISOString();
  
  const domain = new URL(result.metadata.url).hostname;
  stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
  
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}
```

## 🔗 **INTEGRACIÓN CON OTROS SKILLS**

```javascript
// Combinar con skill de resumen
const domSkill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');
const summarySkill = require('/home/jarvis/.openclaw/workspace/skills/content-summarizer');

async function extractAndSummarize(url) {
  // 1. Extraer contenido
  const extraction = await domSkill.convertUrlToMarkdown(url);
  
  if (!extraction.success) {
    return { error: 'Failed to extract' };
  }
  
  // 2. Resumir
  const summary = await summarySkill.summarizeText(extraction.markdown, {
    maxLength: 500
  });
  
  return {
    url,
    extractedLength: extraction.markdown.length,
    summary,
    savedPath: extraction.metadata.savedPath
  };
}
```

## 🎉 **¡LISTO PARA PRODUCCIÓN!**

El skill `dom-to-markdown` está **completamente funcional** y listo para que:

1. **Los agentes principales** lo usen automáticamente
2. **Los sub-agentes** lo ejecuten en background  
3. **Los cron jobs** lo programen periódicamente
4. **Los heartbeats** monitoreen páginas importantes

**Próximo paso:** Configurar un cron job de ejemplo que use el skill automáticamente cada día.

---

**¿Necesitas ayuda con algo específico?** 
- ¿Configurar uso automático en heartbeats?
- ¿Crear un sub-agente dedicado?
- ¿Integrar con otro skill existente?