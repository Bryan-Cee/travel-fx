import { spawn } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const nativeAccess = '--enable-native-access=ALL-UNNAMED';
const existingJavaOptions = process.env.JAVA_TOOL_OPTIONS?.trim();
const javaToolOptions = existingJavaOptions?.includes(nativeAccess)
  ? existingJavaOptions
  : [existingJavaOptions, nativeAccess].filter(Boolean).join(' ');

const child = spawn(
  npx,
  ['expo', 'run:android', '--variant', 'debug', ...process.argv.slice(2)],
  {
    env: { ...process.env, JAVA_TOOL_OPTIONS: javaToolOptions },
    stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error(`Could not start the Android build: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
