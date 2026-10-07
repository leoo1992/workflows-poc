import { existsSync } from 'node:fs';
import { expect, test } from 'vitest';

const projectMarkers = [
  'package.json',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'manage.py',
  'pyproject.toml',
  'requirements.txt',
  'src',
  'app',
];

test('repository exposes an application manifest or source boundary', () => {
  expect(projectMarkers.some((path) => existsSync(path))).toBe(true);
});
