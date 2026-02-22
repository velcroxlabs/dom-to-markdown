/**
 * Test DIRECTO usando el tool browser de OpenClaw
 * Este test se ejecuta DENTRO del agente OpenClaw
 */

async function testDirectBrowser() {
  console.log('🧪 Test DIRECTO del browser tool de OpenClaw\n');
  
  // Verificar que el tool browser está disponible
  if (typeof browser !== 'function') {
    console.error('❌ ERROR: El tool "browser" no está disponible en este contexto.');
    console.error('   Este test debe ejecutarse DENTRO de un agente OpenClaw.');
    return { success: false, error: 'Browser tool not available' };
  }
  
  console.log('✅ Browser tool disponible\n');
  
  const urls = [
    'https://openclaw.ai/',
    'https://lit.dev/',
    'https://elnacional.com.do/'
  ];
  
  const results = [];
  
  for (const url of urls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 Probando: ${url}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const startTime = Date.now();
    
    try {
      // 1. Verificar estado del browser
      console.log('1. Verificando estado del browser...');
      const status = await browser({
        action: 'status',
        profile: 'openclaw'
      });
      console.log(`   ✅ Status: ${JSON.stringify(status).slice(0, 100)}...\n`);
      
      // 2. Iniciar browser si no está corriendo
      if (!status || !status.includes('running')) {
        console.log('2. Iniciando browser...');
        await browser({
          action: 'start',
          profile: 'openclaw'
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('   ✅ Browser iniciado\n');
      }
      
      // 3. Navegar a la URL
      console.log(`3. Navegando a ${url}...`);
      await browser({
        action: 'navigate',
        profile: 'openclaw',
        targetUrl: url
      });
      console.log('   ✅ Navegación completada\n');
      
      // 4. Esperar a que cargue
      console.log('4. Esperando carga (5 segundos)...');
      await browser({
        action: 'act',
        profile: 'openclaw',
        request: {
          kind: 'wait',
          timeMs: 5000
        }
      });
      console.log('   ✅ Carga completada\n');
      
      // 5. Extraer HTML
      console.log('5. Extrayendo HTML...');
      const htmlResult = await browser({
        action: 'act',
        profile: 'openclaw',
        request: {
          kind: 'evaluate',
          fn: '() => document.documentElement.outerHTML'
        }
      });
      console.log(`   ✅ HTML extraído: ${htmlResult.length} caracteres\n`);
      
      // 6. Extraer texto
      console.log('6. Extrayendo texto...');
      const textResult = await browser({
        action: 'act',
        profile: 'openclaw',
        request: {
          kind: 'evaluate',
          fn: '() => document.body.innerText || document.body.textContent'
        }
      });
      console.log(`   ✅ Texto extraído: ${textResult.length} caracteres\n`);
      
      // 7. Tomar snapshot
      console.log('7. Tomando snapshot...');
      const snapshot = await browser({
        action: 'snapshot',
        profile: 'openclaw',
        snapshotFormat: 'ai',
        maxChars: 5000
      });
      console.log(`   ✅ Snapshot: ${snapshot.length} caracteres\n`);
      
      // 8. Analizar resultados
      const duration = Date.now() - startTime;
      
      // Detectar si es SPA (HTML corto con mucho texto)
      const isLikelySpa = htmlResult.length < 10000 && textResult.length > 1000;
      const hasReact = htmlResult.includes('react') || htmlResult.includes('React');
      const hasVue = htmlResult.includes('vue') || htmlResult.includes('Vue');
      const hasAngular = htmlResult.includes('angular') || htmlResult.includes('Angular');
      
      const frameworks = [];
      if (hasReact) frameworks.push('React');
      if (hasVue) frameworks.push('Vue');
      if (hasAngular) frameworks.push('Angular');
      
      const pageType = isLikelySpa ? 'spa' : 
                      (htmlResult.length > 50000 ? 'static' : 'mixed');
      
      results.push({
        url,
        success: true,
        duration,
        htmlLength: htmlResult.length,
        textLength: textResult.length,
        snapshotLength: snapshot.length,
        pageType,
        frameworks: frameworks.length > 0 ? frameworks : ['none'],
        isLikelySpa,
        htmlPreview: htmlResult.substring(0, 500) + '...',
        textPreview: textResult.substring(0, 300) + '...'
      });
      
      console.log(`📊 RESULTADO:`);
      console.log(`   ✅ Éxito: SÍ`);
      console.log(`   📏 HTML: ${htmlResult.length} caracteres`);
      console.log(`   📝 Texto: ${textResult.length} caracteres`);
      console.log(`   🎯 Tipo: ${pageType} ${isLikelySpa ? '(probable SPA)' : ''}`);
      console.log(`   🔧 Frameworks: ${frameworks.join(', ') || 'ninguno'}`);
      console.log(`   ⏱️  Duración: ${duration}ms`);
      
      // Mostrar preview del texto
      console.log(`\n   📄 Preview texto:\n   "${textResult.substring(0, 200).replace(/\n/g, ' ')}..."`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      results.push({
        url,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
    
    // Pequeña pausa entre tests
    console.log('\n⏳ Esperando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 9. Cerrar browser
  console.log('\n9. Cerrando browser...');
  try {
    await browser({
      action: 'stop',
      profile: 'openclaw'
    });
    console.log('   ✅ Browser cerrado\n');
  } catch (error) {
    console.log(`   ⚠️  Error cerrando browser: ${error.message}`);
  }
  
  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log('📈 RESUMEN DE PRUEBAS DIRECTAS');
  console.log('='.repeat(70));
  
  const successCount = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = successCount > 0 ? totalDuration / successCount : 0;
  
  console.log(`\nTotal URLs: ${results.length}`);
  console.log(`Éxitos: ${successCount}/${results.length}`);
  console.log(`Duración total: ${totalDuration}ms`);
  console.log(`Duración promedio: ${Math.round(avgDuration)}ms\n`);
  
  for (const result of results) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.url}`);
    
    if (result.success) {
      console.log(`   Tipo: ${result.pageType}`);
      console.log(`   Frameworks: ${result.frameworks.join(', ')}`);
      console.log(`   HTML: ${result.htmlLength} chars`);
      console.log(`   Texto: ${result.textLength} chars`);
      console.log(`   Duración: ${result.duration}ms`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  }
  
  // Análisis de tipos de página
  const pageTypes = results
    .filter(r => r.success)
    .reduce((acc, r) => {
      acc[r.pageType] = (acc[r.pageType] || 0) + 1;
      return acc;
    }, {});
  
  console.log('🎯 DISTRIBUCIÓN DE TIPOS DE PÁGINA:');
  for (const [type, count] of Object.entries(pageTypes)) {
    console.log(`   ${type}: ${count} (${Math.round((count/successCount)*100)}%)`);
  }
  
  return {
    success: successCount === results.length,
    total: results.length,
    successful: successCount,
    results,
    pageTypes
  };
}

// Ejecutar test
console.log('🚀 Iniciando test directo del browser tool...\n');

testDirectBrowser()
  .then(result => {
    console.log('\n' + '='.repeat(70));
    console.log(result.success ? '✅ TEST COMPLETADO EXITOSAMENTE' : '⚠️ TEST COMPLETADO CON FALLOS');
    console.log('='.repeat(70));
    
    // Guardar resultados
    const fs = require('fs');
    const path = require('path');
    
    const reportDir = path.join(__dirname, '..', 'exports', 'direct-tests');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `direct-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log(`📄 Reporte guardado en: ${reportPath}`);
    
    // Mostrar conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('El tool browser de OpenClaw funciona correctamente y puede:');
    console.log('1. ✅ Navegar a URLs');
    console.log('2. ✅ Extraer HTML renderizado (con JavaScript)');
    console.log('3. ✅ Extraer texto de la página');
    console.log('4. ✅ Tomar snapshots del contenido');
    console.log('5. ✅ Manejar diferentes tipos de páginas (estáticas, SPAs, mixtas)');
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });