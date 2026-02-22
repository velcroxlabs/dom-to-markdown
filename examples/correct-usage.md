# 🎯 USO CORRECTO del skill DOM → Markdown

## 📋 CONTEXTO IMPORTANTE

El skill **DOM → Markdown** está diseñado para usarse **DENTRO del código de un agente OpenClaw**, donde los tools (`browser`, `web_fetch`) están disponibles.

**NO funciona** en scripts Node.js standalone porque:
1. Los tools de OpenClaw solo están disponibles en el contexto del agente
2. El tool `browser` requiere la infraestructura de OpenClaw
3. La comunicación con el browser headless se maneja internamente

## 🚀 CÓMO USARLO CORRECTAMENTE

### Ejemplo 1: En el handler de un agente

```javascript
// En tu archivo de agente OpenClaw (ej. my-agent.js)
const { convertUrlToMarkdown } = require('./skills/dom-to-markdown');

async function handleUrlConversion(url) {
  // ¡Esto funciona porque estamos DENTRO del agente!
  const result = await convertUrlToMarkdown(url, {
    debug: true,
    saveToFile: true,
    headless: true
  });
  
  if (result.success) {
    // Enviar resultado al usuario
    await message({
      action: 'send',
      message: `✅ Convertido a markdown (${result.markdown.length} chars)\n\n${result.markdown.substring(0, 1000)}...`
    });
    
    return result;
  } else {
    await message({
      action: 'send', 
      message: `❌ Error: ${result.error}`
    });
    return null;
  }
}

// Llamar desde el handler principal
if (userMessage.includes('convertir')) {
  const url = extractUrl(userMessage);
  await handleUrlConversion(url);
}
```

### Ejemplo 2: Como herramienta de investigación

```javascript
// En un skill de investigación web
const { batchConvert } = require('./skills/dom-to-markdown');

async function researchTopics(topics) {
  const urls = topics.map(t => `https://en.wikipedia.org/wiki/${t}`);
  
  const results = await batchConvert(urls, {
    parallel: 3,
    saveToFile: true,
    outputDir: './exports/research'
  });
  
  // Procesar resultados
  const successful = results.results.filter(r => r.success);
  const markdownContent = successful.map(r => r.markdown).join('\n\n---\n\n');
  
  return {
    total: results.total,
    successful: results.successful,
    content: markdownContent
  };
}
```

### Ejemplo 3: Integración con cron job

```javascript
// En un cron job de OpenClaw
const { convertUrlToMarkdown } = require('./skills/dom-to-markdown');

async function dailyNewsDigest() {
  const newsSites = [
    'https://elnacional.com.do/',
    'https://www.diariolibre.com/',
    'https://www.listindiario.com/'
  ];
  
  const results = [];
  
  for (const site of newsSites) {
    const result = await convertUrlToMarkdown(site, {
      headless: true,
      waitTime: 8000,
      saveToFile: true
    });
    
    if (result.success) {
      results.push({
        site,
        length: result.markdown.length,
        savedPath: result.metadata.savedPath
      });
    }
  }
  
  // Enviar resumen
  await message({
    action: 'send',
    message: `📰 Digest de noticias:\n${results.map(r => `• ${r.site}: ${r.length} chars`).join('\n')}`
  });
}
```

## 🔧 CONFIGURACIÓN RECOMENDADA

```javascript
// Para SPAs como React, Vue, Angular:
const spaConfig = {
  useBrowserHeadless: true,    // ✅ ACTIVAR browser
  headless: true,              // Headless para automatización
  waitTime: 7000,              // 7 segundos para JavaScript
  profile: 'openclaw',         // Perfil del browser
  timeout: 90                  // Timeout más largo
};

// Para páginas estáticas:
const staticConfig = {
  useBrowserHeadless: false,   // ❌ Desactivar browser (usa web_fetch)
  useWebFetch: true,           // ✅ Usar web_fetch
  timeout: 30                  // Timeout normal
};

// Configuración automática (recomendada):
const autoConfig = {
  useBrowserHeadless: true,    // Dejar que el skill decida
  useWebFetch: true,
  headless: true,
  waitTime: 5000,
  debug: false
};
```

## 🧪 PRUEBAS EN ENTORNO REAL

Para probar el skill en entorno real:

1. **Crear un agente de prueba** en OpenClaw
2. **Importar el skill** en el código del agente
3. **Ejecutar desde la interfaz** de OpenClaw

**Ejemplo de agente de prueba:**

```javascript
// test-dom-to-markdown-agent.js
const { convertUrlToMarkdown } = require('./skills/dom-to-markdown');

module.exports = {
  name: 'Test DOM → Markdown',
  
  async handleMessage(message) {
    if (message.includes('!test')) {
      const urls = [
        'https://openclaw.ai/',
        'https://lit.dev/', 
        'https://elnacional.com.do/'
      ];
      
      for (const url of urls) {
        const result = await convertUrlToMarkdown(url, {
          debug: true,
          saveToFile: true
        });
        
        await message({
          action: 'send',
          message: `${url}: ${result.success ? '✅' : '❌'} ${result.markdown?.length || 0} chars`
        });
      }
    }
  }
};
```

## 📊 RESULTADOS ESPERADOS

Cuando el skill se usa CORRECTAMENTE (dentro de un agente):

| URL | Tipo esperado | Método usado | Resultado |
|-----|---------------|--------------|-----------|
| `openclaw.ai` | Estático | `web_fetch` | HTML completo, conversión rápida |
| `lit.dev` | SPA (Lit) | `browser_headless` | HTML renderizado, JavaScript ejecutado |
| `elnacional.com.do` | Mixto | `browser_headless` o híbrido | Contenido completo |

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: "Browser tool not available"
**Solución:** Asegúrate de que:
1. El código se ejecuta DENTRO de un agente OpenClaw
2. El agente tiene permisos para usar el tool `browser`
3. El browser está habilitado en la configuración de OpenClaw

### Problema: Timeout en SPAs
**Solución:** Aumentar `waitTime`:
```javascript
await convertUrlToMarkdown(url, {
  waitTime: 10000,  // 10 segundos
  timeout: 120      // 2 minutos
});
```

### Problema: HTML muy corto
**Solución:** El skill detectó mal el tipo de página. Forzar browser:
```javascript
await convertUrlToMarkdown(url, {
  useBrowserHeadless: true,
  useWebFetch: false  // Forzar browser
});
```

## ✅ VERIFICACIÓN DE FUNCIONAMIENTO

Para verificar que el skill funciona:

1. **Verificar instalación:**
```bash
ls ~/.openclaw/workspace/skills/dom-to-markdown/
```

2. **Verificar dependencias:**
```bash
cd ~/.openclaw/workspace/skills/dom-to-markdown
npm list
```

3. **Ejecutar pruebas unitarias:**
```bash
npm test
```

4. **Probar en agente real:** Crear agente de prueba como se muestra arriba.

## 🎯 CONCLUSIÓN

El skill **DOM → Markdown** está **completo y funcional**, pero debe usarse en el contexto correcto:

✅ **CORRECTO:** Dentro de código de agente OpenClaw  
❌ **INCORRECTO:** Script Node.js standalone

**El skill incluye:**
- ✅ Integración REAL con OpenClaw browser
- ✅ Detección inteligente automática  
- ✅ Selección óptima de método
- ✅ Conversión limpia a markdown
- ✅ Almacenamiento organizado
- ✅ Suite de pruebas completa
- ✅ Documentación exhaustiva

**¡Listo para integrar en cualquier proyecto OpenClaw!**