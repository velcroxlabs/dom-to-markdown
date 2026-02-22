#!/usr/bin/env node
/**
 * Convert Lit.dev HTML to Markdown - Real Demo
 * 
 * This script demonstrates the complete conversion process using
 * real HTML extracted from https://lit.dev/
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

// HTML real extraído de lit.dev (truncado para mostrar estructura)
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lit</title>
  <meta name="description" content="Simple. Fast. Web Components.">
  <!-- ... rest of head ... -->
</head>
<body class="auto" code-language-preference="ts">
  <!-- Banner -->
  <section id="new-banner">
    <p>📣 Lit is now part of the OpenJS Foundation! Read <a href="/blog/2025-10-14-openjs/">our announcement</a>.</p>
  </section>

  <!-- Intro section -->
  <section id="intro">
    <div id="splashLogo" role="heading" aria-level="1">
      <svg aria-label="Lit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 425 200" id="full">
        <!-- Lit logo SVG -->
      </svg>
    </div>
    <p id="tagline">
      <span>Simple.</span> 
      <span>Fast.</span> 
      <span style="white-space: nowrap;">Web Components.</span>
    </p>
    <div id="splashButtons">
      <a id="npmInstall" href="https://www.npmjs.com/package/lit" target="_blank" rel="noopener">
        <span class="prompt">&gt; </span>npm i lit
      </a>
      <a id="getStartedLink" href="/docs/getting-started/">Get Started</a>
    </div>
  </section>

  <!-- Advantages section -->
  <section id="advantages">
    <div id="advantagesItems">
      <div class="item">
        <div class="heading">
          <img src="/images/home/standards.svg" width="300" height="300" alt="">
          <h1>Simple</h1>
        </div>
        <p>Skip the boilerplate</p>
        <p>Building on top of the Web Components standards, Lit adds just what you need to be happy and productive: reactivity, declarative templates and a handful of thoughtful features to reduce boilerplate and make your job easier.</p>
      </div>
      <div class="item">
        <div class="heading">
          <img src="/images/home/lightning.svg" width="300" height="300" alt="">
          <h1>Fast</h1>
        </div>
        <p>Tiny footprint, instant updates</p>
        <p>Weighing in at around 5 KB (minified and compressed), Lit helps keep your bundle size small and your loading time short. And rendering is blazing fast, because Lit touches only the dynamic parts of your UI when updating.</p>
      </div>
      <div class="item">
        <div class="heading">
          <img src="/images/home/future.svg" width="300" height="300" alt="">
          <h1>Web Components</h1>
        </div>
        <p>Interoperable &amp; future-ready</p>
        <p>Every Lit component is a native web component, with the superpower of interoperability. Web components work anywhere you use HTML, with any framework or none at all.</p>
      </div>
    </div>
  </section>

  <!-- Code tour section -->
  <section id="tour">
    <div id="tourCodeAndNotes">
      <div id="tourCode">
        <litdev-code-language-switch></litdev-code-language-switch>
        <div id="tourTsCode">
          <figure class="cm-editor">
            <pre class="cm-line"><span class="tok-keyword">import</span> <span class="tok-punctuation">{</span><span class="tok-variableName tok-definition">html</span><span class="tok-punctuation">,</span> <span class="tok-variableName tok-definition">css</span><span class="tok-punctuation">,</span> <span class="tok-variableName tok-definition">LitElement</span><span class="tok-punctuation">}</span> <span class="tok-keyword">from</span> <span class="tok-string">'lit'</span><span class="tok-punctuation">;</span></pre>
            <pre class="cm-line"><span class="tok-keyword">import</span> <span class="tok-punctuation">{</span><span class="tok-variableName tok-definition">customElement</span><span class="tok-punctuation">,</span> <span class="tok-variableName tok-definition">property</span><span class="tok-punctuation">}</span> <span class="tok-keyword">from</span> <span class="tok-string">'lit/decorators.js'</span><span class="tok-punctuation">;</span></pre>
            <pre class="cm-line"><br></pre>
            <pre class="cm-line"><span class="tok-meta">@</span><span class="tok-variableName">customElement</span><span class="tok-punctuation">(</span><span class="tok-string">'simple-greeting'</span><span class="tok-punctuation">)</span></pre>
            <pre class="cm-line"><span class="tok-keyword">export</span> <span class="tok-keyword">class</span> <span class="tok-className">SimpleGreeting</span> <span class="tok-keyword">extends</span> <span class="tok-variableName">LitElement</span> <span class="tok-punctuation">{</span></pre>
            <pre class="cm-line">  <span class="tok-keyword">static</span> <span class="tok-propertyName tok-definition">styles</span> <span class="tok-operator">=</span> <span class="tok-variableName">css</span>`<span class="tok-typeName">p</span> <span class="tok-punctuation">{</span> <span class="tok-propertyName">color</span><span class="tok-punctuation">:</span> <span class="tok-atom">blue</span> <span class="tok-punctuation">}</span>`<span class="tok-punctuation">;</span></pre>
            <pre class="cm-line"><br></pre>
            <pre class="cm-line">  <span class="tok-meta">@</span><span class="tok-variableName">property</span><span class="tok-punctuation">(</span><span class="tok-punctuation">)</span></pre>
            <pre class="cm-line">  <span class="tok-propertyName tok-definition">name</span> <span class="tok-operator">=</span> <span class="tok-string">'Somebody'</span><span class="tok-punctuation">;</span></pre>
            <pre class="cm-line"><br></pre>
            <pre class="cm-line">  <span class="tok-propertyName tok-definition">render</span><span class="tok-punctuation">(</span><span class="tok-punctuation">)</span> <span class="tok-punctuation">{</span></pre>
            <pre class="cm-line">    <span class="tok-keyword">return</span> <span class="tok-variableName">html</span>`<span class="tok-punctuation">&lt;</span><span class="tok-typeName">p</span><span class="tok-punctuation">&gt;</span>Hello, <span class="tok-punctuation">${</span><span class="tok-keyword">this</span><span class="tok-operator">.</span><span class="tok-propertyName">name</span><span class="tok-punctuation">}</span>!<span class="tok-punctuation">&lt;/</span><span class="tok-typeName">p</span><span class="tok-punctuation">&gt;</span>`<span class="tok-punctuation">;</span></pre>
            <pre class="cm-line">  <span class="tok-punctuation">}</span></pre>
            <pre class="cm-line"><span class="tok-punctuation">}</span></pre>
          </figure>
        </div>
        <a id="playgroundLink" href="/playground/">Edit this example in the Lit Playground</a>
      </div>
      
      <div id="tourNotes">
        <div id="tourNoteCustomElements" tabindex="0">
          <h1>Custom Elements</h1>
          <p>Lit components are standard <em>custom elements</em>, so the browser treats them exactly like built-in elements.</p>
        </div>
        <div id="tourNoteStyles" tabindex="0">
          <h1>Scoped styles</h1>
          <p>Lit scopes your styles by default, using <em>Shadow DOM</em>.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div id="footerTop">
      <div id="footerNameAndLogo">
        <lazy-svg id="footerName" href="/images/logo.svg#name-symbol" label="Lit"></lazy-svg>
        <lazy-svg id="footerFlame" href="/images/logo.svg#flame-symbol" label="Lit logo"></lazy-svg>
      </div>
      <div id="footerSocialLinks">
        <a href="/discord/" target="_blank" rel="noopener" title="Discord">
          <lazy-svg href="/images/social/discord.svg#discord" label="Discord"></lazy-svg>
        </a>
        <a href="https://github.com/lit/lit/" target="_blank" rel="noopener" title="GitHub">
          <lazy-svg href="/images/social/github.svg#github" label="GitHub"></lazy-svg>
        </a>
      </div>
    </div>
    <div id="footerBottom">
      <p>Copyright Google LLC. Code licensed under <a href="https://spdx.org/licenses/BSD-3-Clause.html">BSD-3-Clause</a>.</p>
    </div>
  </footer>
</body>
</html>`;

console.log('🚀 DEMOSTRACIÓN: Conversión de Lit.dev a Markdown');
console.log('================================================\n');

// Paso 1: Configurar Turndown (como en el skill)
console.log('1. 📦 Configurando Turndown con reglas personalizadas...');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// Reglas personalizadas del skill
turndownService.addRule('removeScripts', {
  filter: ['script', 'style', 'noscript', 'iframe', 'svg', 'path'],
  replacement: () => ''
});

turndownService.addRule('removeHidden', {
  filter: (node) => {
    const style = node.getAttribute('style') || '';
    const classNames = node.className || '';
    return style.includes('display:none') || 
           style.includes('visibility:hidden') ||
           classNames.includes('hidden');
  },
  replacement: () => ''
});

turndownService.addRule('improveLinks', {
  filter: 'a',
  replacement: function(content, node) {
    const href = node.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href === '#') {
      return content;
    }
    
    // Hacer URLs relativas absolutas
    let absoluteHref = href;
    if (href.startsWith('/')) {
      absoluteHref = `https://lit.dev${href}`;
    }
    
    const title = node.getAttribute('title');
    const titlePart = title ? ` "${title}"` : '';
    return `[${content}](${absoluteHref}${titlePart})`;
  }
});

turndownService.addRule('improveImages', {
  filter: 'img',
  replacement: function(content, node) {
    const src = node.getAttribute('src');
    const alt = node.getAttribute('alt') || '';
    const title = node.getAttribute('title') || '';
    
    if (!src) return '';
    
    // Hacer URLs relativas absolutas
    let absoluteSrc = src;
    if (src.startsWith('/')) {
      absoluteSrc = `https://lit.dev${src}`;
    }
    
    const titlePart = title ? ` "${title}"` : '';
    return `![${alt}](${absoluteSrc}${titlePart})`;
  }
});

turndownService.addRule('cleanHeadings', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function(content, node) {
    const tagName = node.tagName.toLowerCase();
    const level = parseInt(tagName.charAt(1));
    const hashes = '#'.repeat(level);
    return `\n${hashes} ${content.trim()}\n\n`;
  }
});

turndownService.addRule('cleanCodeBlocks', {
  filter: ['pre', 'code'],
  replacement: function(content, node) {
    if (node.tagName.toLowerCase() === 'pre') {
      const language = node.querySelector('code')?.className?.match(/language-(\w+)/)?.[1] || '';
      return `\n\`\`\`${language}\n${content.trim()}\n\`\`\`\n\n`;
    }
    return `\`${content}\``;
  }
});

turndownService.addRule('cleanParagraphs', {
  filter: 'p',
  replacement: function(content) {
    const trimmed = content.trim();
    if (!trimmed) return '';
    return `${trimmed}\n\n`;
  }
});

// Paso 2: Convertir HTML a markdown
console.log('2. 🔄 Convirtiendo HTML a markdown...');
const markdown = turndownService.turndown(html);

// Paso 3: Calcular estadísticas
const htmlLength = html.length;
const markdownLength = markdown.length;
const compressionRatio = ((htmlLength - markdownLength) / htmlLength * 100).toFixed(1);

console.log('3. 📊 Calculando estadísticas...\n');

console.log('✅ CONVERSIÓN COMPLETADA');
console.log('========================');
console.log(`🌐 URL: https://lit.dev/`);
console.log(`🔧 Método: openclaw-browser (SPA con JavaScript)`);
console.log(`📏 HTML original: ${htmlLength} caracteres`);
console.log(`📝 Markdown resultante: ${markdownLength} caracteres`);
console.log(`📉 Compresión: ${compressionRatio}% reducción\n`);

// Paso 4: Guardar resultados
const outputDir = path.join(__dirname, 'exports', 'lit-dev-demo');
const outputPath = path.join(outputDir, 'lit-dev-converted.md');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Guardar markdown
fs.writeFileSync(outputPath, markdown);

// Guardar metadatos
const metadata = {
  url: 'https://lit.dev/',
  extractionMethod: 'openclaw-browser',
  htmlLength,
  markdownLength,
  compressionRatio: `${compressionRatio}%`,
  timestamp: new Date().toISOString(),
  outputPath
};

const metadataPath = path.join(outputDir, 'metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

console.log('📁 ARCHIVOS GUARDADOS:');
console.log(`   📄 Markdown: ${outputPath}`);
console.log(`   📋 Metadatos: ${metadataPath}\n`);

// Paso 5: Mostrar preview
console.log('📝 VISTA PREVIA DEL MARKDOWN:');
console.log('='.repeat(60));
const previewLines = markdown.split('\n').slice(0, 30).join('\n');
console.log(previewLines);
console.log('...\n');
console.log('='.repeat(60));

// Paso 6: Mostrar estructura del markdown
console.log('\n🏗️  ESTRUCTURA DEL MARKDOWN GENERADO:');
const lines = markdown.split('\n');
const headings = lines.filter(line => line.startsWith('#'));
const links = lines.filter(line => line.includes(']('));
const codeBlocks = lines.filter(line => line.startsWith('```'));

console.log(`   📑 Encabezados: ${headings.length}`);
console.log(`   🔗 Enlaces: ${links.length}`);
console.log(`   💻 Bloques de código: ${codeBlocks.length / 2}`);

// Paso 7: Mostrar ejemplo de uso del skill
console.log('\n🎯 CÓMO USAR EL SKILL EN PRODUCCIÓN:');
console.log('```javascript');
console.log('// Dentro de un agente OpenClaw:');
console.log('const skill = require("./skills/dom-to-markdown");');
console.log('');
console.log('const result = await skill.convertUrlToMarkdown("https://lit.dev/", {');
console.log('  useBrowserHeadless: true,  // Para SPAs con JavaScript');
console.log('  debug: true,               // Ver detalles del proceso');
console.log('  saveToFile: true,          // Guardar resultado en archivo');
console.log('  outputDir: "./exports"