#!/usr/bin/env node
// ============================================
// Sound Manifest Generator
// ============================================
// Scans src/assets/sounds/ and generates sounds.manifest.json

const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '../src/assets/sounds');
const OUTPUT_FILE = path.join(SOUNDS_DIR, 'sounds.manifest.json');

// Sound class defaults (tuned for natural soundscapes)
const CLASS_DEFAULTS = {
  ambience: {
    baseGain: 0.4,
    gainJitter: 0.1,
    pitchJitter: [0.98, 1.02],
    panPolicy: 'random',
    reverbSend: 0.3,
    cooldown: 20
  },
  birds: {
    baseGain: 0.7,
    gainJitter: 0.15,
    pitchJitter: [0.95, 1.05],
    panPolicy: 'random',
    reverbSend: 0.2,
    cooldown: 15
  },
  foley: {
    baseGain: 0.6,
    gainJitter: 0.2,
    pitchJitter: [0.9, 1.1],
    panPolicy: 'random',
    reverbSend: 0.25,
    cooldown: 5
  },
  insects: {
    baseGain: 0.5,
    gainJitter: 0.1,
    pitchJitter: [0.98, 1.02],
    panPolicy: 'random',
    reverbSend: 0.15,
    cooldown: 10
  },
  mammals: {
    baseGain: 0.8,
    gainJitter: 0.15,
    pitchJitter: [0.95, 1.05],
    panPolicy: 'random',
    reverbSend: 0.3,
    cooldown: 30
  },
  water: {
    baseGain: 0.5,
    gainJitter: 0.1,
    pitchJitter: [0.98, 1.02],
    panPolicy: 'random',
    reverbSend: 0.35,
    cooldown: 15
  },
  weather: {
    baseGain: 0.6,
    gainJitter: 0.15,
    pitchJitter: [0.95, 1.05],
    panPolicy: 'random',
    reverbSend: 0.4,
    cooldown: 20
  }
};

function scanDirectory(dir, className) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const variants = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse into subdirectory
      const subVariants = scanVariantFolder(fullPath, className);
      variants.push(...subVariants);
    }
  }

  return variants;
}

function scanVariantFolder(folder, className) {
  const entries = fs.readdirSync(folder);
  const variants = [];

  // Find all .wav files
  const wavFiles = entries.filter(f => f.endsWith('.wav'));
  
  for (const wavFile of wavFiles) {
    const baseName = wavFile.replace('.wav', '');
    const metaFile = path.join(folder, `${baseName}_meta.json`);
    
    let metadata = {};
    if (fs.existsSync(metaFile)) {
      try {
        const metaContent = fs.readFileSync(metaFile, 'utf8');
        metadata = JSON.parse(metaContent);
      } catch (err) {
        console.warn(`Warning: Could not parse ${metaFile}:`, err.message);
      }
    }

    // Extract tags from folder name and metadata
    const folderName = path.basename(folder);
    const tags = [
      folderName.replace(/_/g, ' '),
      className
    ];
    
    // Add prompt-derived tags if available
    if (metadata.prompt) {
      const promptWords = metadata.prompt
        .toLowerCase()
        .match(/\b\w+\b/g) || [];
      tags.push(...promptWords.slice(0, 5)); // First 5 keywords
    }

    // Use duration from metadata or estimate
    const duration = metadata.metadata?.duration || 5.0;

    const defaults = CLASS_DEFAULTS[className] || CLASS_DEFAULTS.ambience;

    const variant = {
      id: baseName,
      class: className,
      tags: [...new Set(tags)], // Remove duplicates
      path: `/sounds/${className}/${folderName}/${wavFile}`,
      duration,
      weight: 1.0,
      ...defaults
    };

    variants.push(variant);
  }

  return variants;
}

function generateManifest() {
  console.log('🔍 Scanning sound directory:', SOUNDS_DIR);
  
  const allVariants = [];
  
  // Scan each class directory
  const classEntries = fs.readdirSync(SOUNDS_DIR, { withFileTypes: true });
  
  for (const entry of classEntries) {
    if (!entry.isDirectory()) continue;
    
    const className = entry.name;
    if (!CLASS_DEFAULTS[className]) {
      console.warn(`Warning: Unknown sound class "${className}" - skipping`);
      continue;
    }

    const classPath = path.join(SOUNDS_DIR, className);
    const variants = scanDirectory(classPath, className);
    
    console.log(`  ✓ ${className}: ${variants.length} variants`);
    allVariants.push(...variants);
  }

  const manifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sounds: allVariants.sort((a, b) => {
      // Sort by class, then by id
      if (a.class !== b.class) {
        return a.class.localeCompare(b.class);
      }
      return a.id.localeCompare(b.id);
    })
  };

  // Write manifest
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Generated manifest with ${allVariants.length} sound variants`);
  console.log(`📝 Written to: ${OUTPUT_FILE}`);
  
  // Print summary by class
  console.log('\n📊 Summary by class:');
  const summary = {};
  allVariants.forEach(v => {
    summary[v.class] = (summary[v.class] || 0) + 1;
  });
  Object.entries(summary).forEach(([cls, count]) => {
    console.log(`   ${cls}: ${count}`);
  });
}

// Run generator
try {
  generateManifest();
} catch (err) {
  console.error('❌ Error generating manifest:', err);
  process.exit(1);
}
