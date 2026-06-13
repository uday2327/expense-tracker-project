import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ignoredDirectories = new Set([".git", ".next", "node_modules"]);
const forbiddenExtensions = [".ts", ".tsx"];
const forbiddenFiles = new Set(["tsconfig.json"]);
const directDependencyPatterns = [
  /"typescript"\s*:/,
  /"tsx"\s*:/,
  /"@types\//
];

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      walk(path, files);
      continue;
    }

    files.push(path);
  }

  return files;
}

const files = walk(process.cwd());
const badFiles = files.filter((file) => {
  return forbiddenExtensions.some((extension) => file.endsWith(extension)) ||
    forbiddenFiles.has(file.split(/[\\/]/).at(-1));
});

const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const badDependencies = directDependencyPatterns.filter((pattern) => pattern.test(packageJson));

if (badFiles.length || badDependencies.length) {
  console.error("TypeScript artifacts found:");
  for (const file of badFiles) console.error(`- ${file}`);
  if (badDependencies.length) console.error("- package.json contains a TypeScript dependency");
  process.exit(1);
}

console.log("No TypeScript source files, configs, or direct dependencies found.");

