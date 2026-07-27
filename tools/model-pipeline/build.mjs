#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const REQUIRED_NODE_NAMES = ['computer', 'screen'];
const OUTPUT_PATH = fileURLToPath(
  new URL('../../apps/web/public/models/new-cassette-system.gltf', import.meta.url),
);

function parseArgs(argv) {
  const inputIndex = argv.indexOf('--input');
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    console.error('Usage: node tools/model-pipeline/build.mjs --input <path-to-raw-export>');
    process.exit(1);
  }
  return { input: path.resolve(argv[inputIndex + 1]) };
}

function runOptimize(input, output) {
  execFileSync(
    'npx',
    [
      'gltf-transform',
      'optimize',
      input,
      output,
      '--compress',
      'draco',
      '--texture-compress',
      'webp',
      '--texture-size',
      '2048',
      '--join',
      'false',
      '--flatten',
      'false',
      '--instance',
      'false',
      '--simplify',
      'false',
    ],
    { stdio: 'inherit' },
  );
}

async function verifyNodeNames(output) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });
  const doc = await io.read(output);
  const names = doc
    .getRoot()
    .listNodes()
    .map((n) => n.getName());
  const missing = REQUIRED_NODE_NAMES.filter((name) => !names.includes(name));
  if (missing.length > 0) {
    console.error(
      `Regression: missing required node name(s) ${missing.join(', ')} in ${output}. ` +
        `Found: ${names.join(', ')}. This usually means --join/--flatten silently re-merged the meshes.`,
    );
    process.exit(1);
  }
  console.log(`Verified node names present: ${names.join(', ')}`);
}

const { input } = parseArgs(process.argv.slice(2));
console.log(`Optimizing ${input} -> ${OUTPUT_PATH}`);
runOptimize(input, OUTPUT_PATH);
await verifyNodeNames(OUTPUT_PATH);
console.log('Done.');
