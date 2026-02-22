/**
 * Test del skill DOM → Markdown con las URLs del usuario
 * 
 * URLs a probar:
 * 1. https://openclaw.ai/      (sitio oficial de OpenClaw)
 * 2. https://lit.dev/          (framework Lit - probable SPA)
 * 3. https://elnacional.com.do/ (periódico dominicano - probable mixto)
 */

const { DomToMarkdownConverter } = require('./src/converter');
const fs = require('fs');
const path = require('path');

async function testUserUrls() {
  console.log('🧪 Probando skill DOM → Markdown con URLs del usuario\n');
  
  const urls = [
    {
      url: 'https://openclaw.ai/',
      name: 'OpenClaw AI',
      expectedType: 'static' // Sitio estático/documentación
    },
    {
      url: 'https://lit.dev/',
      name: 'Lit.dev',
      expectedType: 'spa' // Framework JavaScript
    },
    {
      url: 'https://elnacional.com.do/',
      name: 'El Nacional',
      expectedType: 'mixed' // Periódico, posiblemente con JavaScript
    }
  ];
  
  // Configurar converter
  const converter = new DomToMarkdownConverter({
    debug: true,
    saveToFile: true,
    outputDir: path.join(__dirname, '..', 'exports', 'user-tests'),
    headless: true,
    waitTime: 7000, // Más tiempo para SPAs
    timeout: 90
  });
  
  const results = [];
  
  for (const test of urls) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🌐 Probando: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    console.log(`🎯 Tipo esperado: ${test.expectedType}`);
    console.log(`${'='.repeat(70)}\n`);
    
    const startTime = Date.now();
    
    try {
      const result = await converter.convertUrlToMarkdown(test.url);
      const duration = Date.now() - startTime;
      
      console.log(`📊 RESULTADO:`);
      console.log(`   ✅ Éxito: ${result.success ? 'SÍ' : 'NO'}`);
      
      if (result.success) {
        console.log(`   🎯 Tipo detectado: ${result.detection?.type || 'N/A'}`);
        console.log(`   🤝 Confianza: ${(result.detection?.confidence * 100).toFixed(1)}%`);
        console.log(`   🛠️  Método usado: ${result.extraction?.method || 'N/A'}`);
        console.log(`   📏 Longitud markdown: ${result.markdown?.length || 0} caracteres`);
        console.log(`   ⏱️  Duración: ${duration}ms`);
        console.log(`   📁 Guardado en: ${result.metadata?.savedPath || 'No'}`);
        
        // Mostrar frameworks detectados
        if (result.detection?.frameworks && Object.keys(result.detection.frameworks).length > 0) {
          console.log(`   🔧 Frameworks: ${Object.keys(result.detection.frameworks).join(', ')}`);
        }
        
        // Mostrar primeras líneas del markdown
        if (result.markdown && result.markdown.length > 0) {
          const preview = result.markdown.substring(0, 300).replace(/\n/g, '\n   ');
          console.log(`   📝 Preview markdown:\n   ${preview}...`);
        }
        
        // Verificar si se usó el método apropiado
        const usedBrowser = result.extraction?.method === 'browser_headless';
        const methodAppropriate = (test.expectedType === 'spa' && usedBrowser) ||
                                 (test.expectedType === 'static' && !usedBrowser) ||
                                 (test.expectedType === 'mixed');
        
        console.log(`   ${methodAppropriate ? '✅' : '⚠️'} Método apropiado para ${test.expectedType}`);
        
      } else {
        console.log(`   ❌ Error: ${result.error || 'Desconocido'}`);
      }
      
      results.push({
        name: test.name,
        url: test.url,
        expectedType: test.expectedType,
        success: result.success,
        detection: result.detection,
        extraction: result.extraction,
        markdownLength: result.markdown?.length || 0,
        duration,
        savedPath: result.metadata?.savedPath,
        error: result.error,
        methodAppropriate
      });
      
    } catch (error) {
      console.error(`❌ Error no manejado: ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        success: false,
        error: error.message
      });
    }
    
    // Pequeña pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Generar reporte detallado
  console.log('\n' + '='.repeat(70));
  console.log('📈 REPORTE FINAL DE PRUEBAS');
  console.log('='.repeat(70));
  
  let successCount = 0;
  let appropriateMethodCount = 0;
  let totalMarkdownChars = 0;
  
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const methodIcon = result.methodAppropriate ? '🎯' : '⚠️';
    
    console.log(`\n${status} ${methodIcon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Éxito: ${result.success ? 'SÍ' : 'NO'}`);
    
    if (result.success) {
      successCount++;
      totalMarkdownChars += result.markdownLength;
      
      if (result.methodAppropriate) {
        appropriateMethodCount++;
      }
      
      console.log(`   Tipo esperado: ${result.expectedType}`);
      console.log(`   Tipo detectado: ${result.detection?.type || 'N/A'}`);
      console.log(`   Método: ${result.extraction?.method || 'N/A'}`);
      console.log(`   Simulado: ${result.extraction?.simulated ? 'SÍ' : 'NO'}`);
      console.log(`   Markdown: ${result.markdownLength} caracteres`);
      console.log(`   Duración: ${result.duration}ms`);
      console.log(`   Guardado: ${result.savedPath || 'No'}`);
    } else {
      console.log(`   Error: ${result.error || 'Desconocido'}`);
    }
  }
  
  // Estadísticas
  console.log('\n' + '='.repeat(70));
  console.log('📊 ESTADÍSTICAS:');
  console.log('='.repeat(70));
  console.log(`Total tests: ${results.length}`);
  console.log(`Tests exitosos: ${successCount}/${results.length} (${Math.round((successCount/results.length)*100)}%)`);
  console.log(`Métodos apropiados: ${appropriateMethodCount}/${successCount} (${successCount > 0 ? Math.round((appropriateMethodCount/successCount)*100) : 0}%)`);
  console.log(`Total caracteres markdown: ${totalMarkdownChars}`);
  console.log(`Promedio por test: ${Math.round(totalMarkdownChars/Math.max(successCount, 1))} caracteres`);
  
  // Métodos usados
  const methods = results
    .filter(r => r.success && r.extraction)
    .reduce((acc, r) => {
      acc[r.extraction.method] = (acc[r.extraction.method] || 0) + 1;
      return acc;
    }, {});
  
  console.log('\n🔧 MÉTODOS UTILIZADOS:');
  for (const [method, count] of Object.entries(methods)) {
    console.log(`   ${method}: ${count} veces`);
  }
  
  // Tipos detectados
  const types = results
    .filter(r => r.success && r.detection)
    .reduce((acc, r) => {
      acc[r.detection.type] = (acc[r.detection.type] || 0) + 1;
      return acc;
    }, {});
  
  console.log('\n🎯 TIPOS DETECTADOS:');
  for (const [type, count] of Object.entries(types)) {
    console.log(`   ${type}: ${count} veces`);
  }
  
  // Guardar reporte completo
  const reportDir = path.join(__dirname, '..', 'exports', 'user-tests', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `user-test-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: results.map(r => ({ name: r.name, url: r.url, expectedType: r.expectedType })),
    totalTests: results.length,
    successfulTests: successCount,
    successRate: Math.round((successCount/results.length)*100),
    appropriateMethodRate: successCount > 0 ? Math.round((appropriateMethodCount/successCount)*100) : 0,
    totalMarkdownChars,
    averageMarkdownLength: Math.round(totalMarkdownChars/Math.max(successCount, 1)),
    results,
    methods,
    types,
    converterStats: converter.getStats()
  }, null, 2));
  
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  
  return {
    success: successCount === results.length,
    totalTests: results.length,
    successfulTests: successCount,
    appropriateMethodCount,
    successRate: Math.round((successCount/results.length)*100),
    appropriateMethodRate: successCount > 0 ? Math.round((appropriateMethodCount/successCount)*100) : 0,
    reportPath
  };
}

// Ejecutar pruebas
if (require.main === module) {
  testUserUrls()
    .then(result => {
      console.log('\n' + '='.repeat(70));
      console.log(`🏁 PRUEBAS ${result.success ? '✅ COMPLETADAS EXITOSAMENTE' : '⚠️ COMPLETADAS CON FALLOS'}`);
      console.log(`   Éxito: ${result.successfulTests}/${result.totalTests} (${result.successRate}%)`);
      console.log(`   Métodos apropiados: ${result.appropriateMethodCount}/${result.successfulTests} (${result.appropriateMethodRate}%)`);
      console.log('='.repeat(70));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error en pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testUserUrls };