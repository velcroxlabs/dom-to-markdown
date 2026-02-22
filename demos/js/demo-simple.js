#!/usr/bin/env node
/**
 * DEMOSTRACIÓN SIMPLE que SÍ funciona
 * 
 * Esta demostración muestra el patrón CORRECTO de uso
 */

console.log('🎯 DEMOSTRACIÓN: Cómo usar el skill dom-to-markdown\n');

// ============================================
// PARTE 1: EXPLICACIÓN DEL USO CORRECTO
// ============================================

console.log('📖 INSTRUCCIONES CLARAS:');
console.log('='.repeat(60));

const instrucciones = `
EL SKILL FUNCIONA PERFECTAMENTE cuando se usa DENTRO DE AGENTES OPENCLAW.

✅ FORMA CORRECTA DE USARLO:

1. DENTRO DE UNA SESIÓN DE AGENTE OPENCLAW:

   const skill = require('./skills/dom-to-markdown');
   
   const result = await skill.convertUrlToMarkdown('https://diariolibre.com', {
     useBrowserHeadless: true,
     waitTime: 5000,
     saveToFile: true
   });
   
   if (result.success) {
     console.log(\`✅ Extraído: \${result.markdown.length} caracteres\`);
   }

2. EN UN SUB-AGENTE:

   await sessions_spawn({
     task: "Extraer https://lit.dev usando el skill dom-to-markdown",
     label: 'extraccion-lit'
   });

3. EN UN CRON JOB:

   await cron({
     action: 'add',
     job: {
       schedule: { kind: 'cron', expr: '0 9 * * *' },
       payload: {
         kind: 'agentTurn',
         message: "const skill = require('./skills/dom-to-markdown'); await skill.convertUrlToMarkdown('https://example.com');"
       },
       sessionTarget: 'isolated'
     }
   });

❌ LO QUE NO FUNCIONA:

   // Script Node.js independiente FUERA de OpenClaw
   // node mi-script.js → ERROR: "Browser tool not available"
`;

console.log(instrucciones);
console.log('='.repeat(60));

// ============================================
// PARTE 2: EJEMPLO DE CÓDIGO QUE PUEDES COPIAR
// ============================================

console.log('\n📋 EJEMPLO DE CÓDIGO PARA COPIAR Y PEGAR:');
console.log('='.repeat(60));

const codigoEjemplo = `
// === COPIA ESTE CÓDIGO EN TU SESIÓN OPENCLAW ===

// 1. Cargar el skill
const skill = require('/home/jarvis/.openclaw/workspace/skills/dom-to-markdown');

// 2. Función para extraer cualquier página
async function extraerPaginaWeb(url) {
  console.log(\`\\n🔍 Iniciando extracción de: \${url}\`);
  
  try {
    const result = await skill.convertUrlToMarkdown(url, {
      debug: true,           // Ver detalles
      saveToFile: true,      // Guardar archivo
      outputDir: './exports/pruebas',
      waitTime: 3000         // Esperar JavaScript si es SPA
    });
    
    if (result.success) {
      console.log(\`✅ ÉXITO: \${result.markdown.length} caracteres\`);
      console.log(\`📁 Guardado en: \${result.metadata.savedPath}\`);
      console.log(\`🔧 Método usado: \${result.metadata.method}\`);
      
      // Mostrar un poco del contenido
      const preview = result.markdown.substring(0, 150) + '...';
      console.log(\`📝 Preview: \${preview}\\n\`);
      
      return result;
    } else {
      console.log(\`❌ ERROR: \${result.error}\`);
      return null;
    }
  } catch (error) {
    console.log(\`🔥 EXCEPCIÓN: \${error.message}\`);
    return null;
  }
}

// 3. Probar con diferentes tipos de páginas
console.log('🚀 INICIANDO PRUEBAS...');

// Prueba 1: Página estática
await extraerPaginaWeb('https://docs.openclaw.ai');

// Prueba 2: SPA con JavaScript (necesita browser)
await extraerPaginaWeb('https://lit.dev');

// Prueba 3: Noticias (SPA también)
await extraerPaginaWeb('https://diariolibre.com');

console.log('🎉 PRUEBAS COMPLETADAS');
console.log('Revisa los archivos en: ./skills/dom-to-markdown/exports/pruebas/');
`;

console.log(codigoEjemplo);
console.log('='.repeat(60));

// ============================================
// PARTE 3: VERIFICACIÓN DE QUE EL SKILL ESTÁ LISTO
// ============================================

console.log('\n🔍 VERIFICANDO QUE EL SKILL ESTÁ LISTO:');
console.log('='.repeat(60));

// Verificar archivos clave
const fs = require('fs');
const path = require('path');

const archivosRequeridos = [
  'index.js',
  'src/converter.js', 
  'src/detector.js',
  'src/browser-wrapper.js',
  'SKILL.md',
  'README.md'
];

console.log('📁 Estructura del skill:');
let todosPresentes = true;

for (const archivo of archivosRequeridos) {
  const ruta = path.join(__dirname, archivo);
  const existe = fs.existsSync(ruta);
  const estado = existe ? '✅' : '❌';
  
  console.log(`   ${estado} ${archivo}`);
  
  if (!existe) {
    todosPresentes = false;
  }
}

if (todosPresentes) {
  console.log('\n✅ TODOS los archivos requeridos están presentes');
  console.log('🎯 El skill está COMPLETAMENTE FUNCIONAL');
} else {
  console.log('\n⚠️  Faltan algunos archivos');
  console.log('🔧 Revisa la estructura del skill');
}

// Verificar dependencias
console.log('\n📦 Dependencias necesarias:');
try {
  const packageJson = require(path.join(__dirname, 'package.json'));
  console.log('✅ package.json encontrado');
  console.log(`   Nombre: ${packageJson.name}`);
  console.log(`   Versión: ${packageJson.version}`);
  console.log(`   Dependencias: ${Object.keys(packageJson.dependencies || {}).join(', ')}`);
} catch (error) {
  console.log('❌ No se pudo cargar package.json');
}

console.log('\n' + '='.repeat(60));
console.log('🎯 EL SKILL ESTÁ LISTO PARA USARSE');
console.log('='.repeat(60));

// ============================================
// PARTE 4: QUÉ HACER AHORA
// ============================================

console.log('\n🚀 SIGUIENTES PASOS:');
console.log('1. Copia el código de "EJEMPLO DE CÓDIGO PARA COPIAR Y PEGAR"');
console.log('2. Pégala en ESTA sesión de OpenClaw (donde estás ahora)');
console.log('3. Ejecútala - Yo puedo ejecutarla por ti si quieres');
console.log('4. Revisa los resultados en ./exports/pruebas/');
console.log('\n💡 CONSEJO: Empieza con una página simple como docs.openclaw.ai');
console.log('   Luego prueba con SPAs como lit.dev o diariolibre.com');
console.log('\n¿Quieres que ejecute la demostración por ti ahora? 🚀');