import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getCatalogBackend,
  mutateCatalogDocument,
  parseCatalogDocument,
  readCatalogDocument,
  type CatalogDocument,
} from "../lib/server/catalog-store";

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const [command, ...args] = process.argv.slice(2);
const positionalArguments = args.filter((argument) => !argument.startsWith("--"));
const flags = args.filter((argument) => argument.startsWith("--"));
const fileArgument = positionalArguments[0];
const confirmed = args.includes("--confirm");
const allowEmpty = args.includes("--allow-empty");

function usage(): never {
  throw new Error(
    "Usage: npm run catalog:export -- <backup.json> OR npm run catalog:import -- <backup.json> --confirm [--allow-empty]",
  );
}

function assertJsonBackend(): void {
  if (getCatalogBackend() === "postgres") {
    throw new Error("Catalog export/import supports only CATALOG_BACKEND=local-json or vercel-blob");
  }
}

async function exportCatalog(destinationArgument: string): Promise<void> {
  assertJsonBackend();
  const destination = path.resolve(destinationArgument);
  const document = await readCatalogDocument({ fresh: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  process.stdout.write(`Catalog revision ${document.revision} exported to ${destination}\n`);
}

async function readImport(sourceArgument: string): Promise<CatalogDocument> {
  const source = path.resolve(sourceArgument);
  const payload = await readFile(source);
  if (payload.byteLength > MAX_IMPORT_BYTES) throw new Error("Catalog import exceeds the 100 MiB safety limit");
  try {
    return parseCatalogDocument(JSON.parse(payload.toString("utf8")));
  } catch (error) {
    throw new Error(`Catalog import is invalid: ${error instanceof Error ? error.message : "unknown validation error"}`);
  }
}

async function importCatalog(sourceArgument: string): Promise<void> {
  assertJsonBackend();
  if (!confirmed) throw new Error("Catalog import replaces the configured catalog; pass --confirm after exporting a backup");
  const imported = await readImport(sourceArgument);
  if (imported.products.length === 0 && !allowEmpty) {
    throw new Error("Refusing to replace the catalog with an empty document; pass --allow-empty if this is intentional");
  }
  const { document } = await mutateCatalogDocument((draft) => {
    draft.categories = structuredClone(imported.categories);
    draft.products = structuredClone(imported.products);
    draft.productImages = structuredClone(imported.productImages);
    draft.productVariants = structuredClone(imported.productVariants);
    draft.usageSuggestions = structuredClone(imported.usageSuggestions);
    draft.reviews = structuredClone(imported.reviews);
    draft.settings = structuredClone(imported.settings);
  });
  process.stdout.write(`Catalog imported as revision ${document.revision}\n`);
}

if (!fileArgument || positionalArguments.length !== 1 || !["export", "import"].includes(command ?? "")) usage();
if (command === "export" && flags.length > 0) usage();
if (command === "import" && flags.some((flag) => !["--confirm", "--allow-empty"].includes(flag))) usage();
if (command === "export") await exportCatalog(fileArgument);
else await importCatalog(fileArgument);
