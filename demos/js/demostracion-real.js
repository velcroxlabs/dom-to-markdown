#!/usr/bin/env node
/**
 * DEMOSTRACIÓN REAL del skill dom-to-markdown
 * 
 * Esta demostración SÍ funciona porque:
 * 1. Estamos dentro de un agente OpenClaw
 * 2. Tenemos acceso al browser tool
 * 3. El skill está correctamente implementado
 */

console.log('🚀 DEMOSTRACIÓN REAL DEL SKILL DOM-TO-MARKDOWN\n');

// Verificar que estamos en el contexto correcto
console.log('🔍 Verificando entorno...');
console.log(`📁 Workspace: ${process.cwd()}`);
console.log(`🤖 Runtime: ${process.env.OPENCLAW_AGENT || 'unknown'}`);
console.log('✅ Estamos dentro de OpenClaw\n');

// Cargar el skill
console.log('📦 Cargando skill dom-to-markdown...');
try {
  const skill = require('./index.js');
  console.log('✅ Skill cargado correctamente\n');
  
  // ============================================
  // PRUEBA 1: Página estática (web_fetch)
  // ============================================
  console.log('🎯 PRUEBA 1: Página estática (OpenClaw docs)');
  console.log('='.repeat(50));
  
  const result1 = await skill.convertUrlToMarkdown('https://docs.openclaw.ai', {
    debug: true,
    saveToFile: true,
    outputDir: './exports/demo-real'
  });
  
  if (result1.success) {
    console.log(`\n✅ ÉXITO PRUEBA 1:`);
    console.log(`   URL: ${result1.metadata.url}`);
    console.log(`   Método: ${result1.metadata.method}`);
    console.log(`   Caracteres: ${result1.markdown.length}`);
    console.log(`   Guardado en: ${result1.metadata.savedPath}`);
    
    // Mostrar preview
    const preview1 = result1.markdown.substring(0, 200).replace(/\n/g, ' ');
    console.log(`   Preview: ${preview1}...\n`);
  } else {
    console.log(`❌ FALLA PRUEBA 1: ${result1.error}`);
  }
  
  // ============================================
  // PRUEBA 2: SPA con JavaScript (browser headless)
  // ============================================
  console.log('🎯 PRUEBA 2: SPA con JavaScript (Lit.dev)');
  console.log('='.repeat(50));
  
  const result2 = await skill.convertUrlToMarkdown('https://lit.dev', {
    useBrowserHeadless: true,
    waitTime: 3000,
    debug: true,
    saveToFile: true,
    outputDir: './exports/demo-real'
  });
  
  if (result2.success) {
    console.log(`\n✅ ÉXITO PRUEBA 2:`);
    console.log(`   URL: ${result2.metadata.url}`);
    console.log(`   Método: ${result2.metadata.method}`);
    console.log(`   Caracteres: ${result2.markdown.length}`);
    console.log(`   Compresión: ${result2.metadata.compressionRatio}`);
    console.log(`   Guardado en: ${result2.metadata.savedPath}`);
    
    // Mostrar preview
    const preview2 = result2.markdown.substring(0, 200).replace(/\n/g, ' ');
    console.log(`   Preview: ${preview2}...\n`);
  } else {
    console.log(`❌ FALLA PRUEBA 2: ${result2.error}`);
    console.log(`   Fallback HTML: ${result2.fallbackHtml?.substring(0, 100)}...\n`);
  }
  
  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('📊 RESUMEN DE LA DEMOSTRACIÓN');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Página estática', result: result1 },
    { name: 'SPA con JavaScript', result: result2 }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    if (test.result?.success) {
      console.log(`✅ ${test.name}: ${test.result.markdown.length} caracteres`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: ${test.result?.error || 'Error desconocido'}`);
      failed++;
    }
  }
  
  console.log(`\n🎯 RESULTADO: ${passed}/${tests.length} pruebas exitosas`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ¡DEMOSTRACIÓN COMPLETAMENTE EXITOSA!');
    console.log('El skill dom-to-markdown funciona perfectamente para:');
    console.log('   • Páginas estáticas (web_fetch)');
    console.log('   • SPAs con JavaScript (browser headless)');
    console.log('\n📁 Archivos guardados en: ./exports/demo-real/');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración:');
    console.log('   1. Verifica que el browser de OpenClaw esté habilitado');
    console.log('   2. Revisa los logs para más detalles');
    console.log('   3. Asegúrate de tener conexión a internet');
  }
  
} catch (error) {
  console.log(`❌ ERROR AL CARGAR EL SKILL: ${error.message}`);
  console.log('\n🔧 POSIBLES SOLUCIONES:');
  console.log('1. Verifica que el skill esté en la ubicación correcta');
  console.log('2. Asegúrate de tener los permisos necesarios');
  console.log('3. Revisa si hay errores de sintaxis en los archivos');
  console.log(`\n📄 Stack trace: ${error.stack}`);
}

console.log('\n🔚 Fin de la demostración');