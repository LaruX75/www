/**
 * AUTHORING-PIPELINE-03 — safe canonical write for Presentation drafts.
 *
 * Reuses existing infrastructure — does not invent a new content model,
 * schema, identity system, or renderer:
 *
 *   - draft shape                  from ./presentationDraft.js
 *   - frontmatter serializer       from ./eleventyPreview.js (same serializer
 *                                   that feeds the preview → guarantees
 *                                   round-trip parity by construction)
 *   - validation                   from src/_utils/canonicalContentValidation
 *   - Presentation storage root    the existing src/presentations/ directory
 *   - slug/permalink authority     existing src/_data/presentationSources.js
 *                                   convention (pageUrl = /presentations/{slug}/)
 *
 * This module ONLY adds the write boundary. It does not:
 *   - infer contexts
 *   - overwrite existing files
 *   - accept arbitrary paths
 *   - persist authoring diagnostics into canonical frontmatter
 *   - support Publication writes (Publication authority is Research.fi)
 */
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const {
  validateCollectionItem
} = require("../../../src/_utils/canonicalContentValidation");
const { toFrontMatterMarkdown } = require("./eleventyPreview");

const DEFAULT_PRESENTATIONS_DIR = path.join(process.cwd(), "src", "presentations");

/**
 * Reject the entire Publication write path.
 * Publication canonical authority is Research.fi + researchfiContent per
 * AUTHORING-PIPELINE-02. There is no local Markdown write path for scientific
 * Publications. AP-03 must not invent one.
 */
function assertPublicationWriteUnsupported({ domain }) {
  if (String(domain || "").toLowerCase() === "publications" ||
      String(domain || "").toLowerCase() === "publication" ||
      String(domain || "").toLowerCase() === "doi") {
    throw new Error(
      "Publication canonical write is not supported: scientific Publication " +
      "authority remains Research.fi + researchfiContent. AP-03 does not " +
      "invent a parallel Publication storage."
    );
  }
}

/**
 * Validate a slug against filesystem safety rules.
 * Must be a plain slug component — no separators, no dots, no traversal,
 * no absolute path fragments, no reserved characters.
 */
function assertSafeSlug(slug) {
  const raw = String(slug || "").trim();
  if (!raw) {
    throw new Error("Canonical write blocked: slug is empty");
  }
  if (raw.includes("/") || raw.includes("\\") || raw.includes("..") ||
      raw.startsWith(".") || raw.startsWith("-") ||
      /[\x00-\x1f\x7f<>:"|?*]/.test(raw)) {
    throw new Error(`Canonical write blocked: unsafe slug "${raw}"`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(raw)) {
    throw new Error(`Canonical write blocked: slug "${raw}" must match /^[a-z0-9][a-z0-9-]*$/i`);
  }
}

/**
 * Resolve the canonical destination for a Presentation slug.
 * Asserts the destination stays inside the approved Presentations root
 * even after path resolution.
 */
function resolvePresentationDestination({ slug, root }) {
  const presentationsRoot = path.resolve(root || DEFAULT_PRESENTATIONS_DIR);
  assertSafeSlug(slug);
  const filename = `${slug}.md`;
  const destination = path.resolve(presentationsRoot, filename);
  if (path.dirname(destination) !== presentationsRoot) {
    throw new Error(
      `Canonical write blocked: destination "${destination}" would escape ` +
      `Presentations root "${presentationsRoot}"`
    );
  }
  return {
    destination,
    presentationsRoot,
    exists: fs.existsSync(destination)
  };
}

/**
 * Canonical field allowlist for Presentation writes.
 * Any field not in this list is dropped before serialization so authoring
 * diagnostics (provider name, raw fetch payload, preview path, timings,
 * evidence blobs) cannot leak into canonical Markdown.
 */
const PRESENTATION_CANONICAL_FIELDS = new Set([
  "title",
  "description",
  "date",
  "url",
  "sourceUrl",
  "thumbnail",
  "source",
  "type",
  "contexts",
  "categories",
  "keywords",
  "topics",
  "event",
  "audience",
  "permalink",
  "layout",
  "templateEngineOverride"
]);

function pickCanonicalFrontMatter(frontMatter) {
  const out = {};
  for (const key of Object.keys(frontMatter || {})) {
    if (PRESENTATION_CANONICAL_FIELDS.has(key) && frontMatter[key] !== undefined && frontMatter[key] !== "") {
      out[key] = frontMatter[key];
    }
  }
  return out;
}

/**
 * Serialize a draft into the exact byte shape a canonical Presentation MD
 * expects. Delegates to the same `toFrontMatterMarkdown` helper the preview
 * uses, so the written file is bit-for-bit the shape the preview validated.
 */
function serializePresentationDraft(draft) {
  const canonicalFrontMatter = pickCanonicalFrontMatter(draft.frontMatter);
  return toFrontMatterMarkdown(canonicalFrontMatter, draft.body);
}

/**
 * Atomically write serialized canonical bytes to `destination`.
 * Refuses overwrite by default. On any failure, removes temp file and leaves
 * the destination untouched.
 */
function writeAtomic({ destination, bytes, allowOverwrite = false }) {
  if (!allowOverwrite && fs.existsSync(destination)) {
    throw new Error(
      `Canonical write blocked: destination already exists (${destination}). ` +
      `AP-03 does not overwrite existing canonical content.`
    );
  }

  const tempName = `.${path.basename(destination)}.tmp-${process.pid}-${Date.now()}`;
  const tempPath = path.join(path.dirname(destination), tempName);

  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(tempPath, bytes, "utf8");
    // Second-chance overwrite check between temp write and rename — narrows
    // the TOCTOU window but does not attempt full locking.
    if (!allowOverwrite && fs.existsSync(destination)) {
      throw new Error(
        `Canonical write blocked: destination appeared between validation ` +
        `and rename (${destination}).`
      );
    }
    fs.renameSync(tempPath, destination);
  } catch (err) {
    // Clean the temp on failure. Ignore secondary unlink errors.
    try { fs.unlinkSync(tempPath); } catch (_) { /* noop */ }
    throw err;
  }
}

/**
 * Read the just-written file and run the shared canonical validation against
 * the on-disk representation — NOT against the in-memory draft. This proves
 * serializer parity: whatever went to disk still satisfies the same rules the
 * production build enforces.
 *
 * Returns the parsed result and validation output. Throws if validation
 * produces errors (strict).
 */
function roundTripValidatePresentation({
  destination,
  useResolvedContexts = false
}) {
  const raw = fs.readFileSync(destination, "utf8");
  const parsed = matter(raw);
  const data = parsed.data || {};
  const { errors, warnings } = validateCollectionItem({
    collectionName: "presentations",
    data,
    filePath: destination,
    rootDir: process.cwd(),
    useResolvedContexts,
    strictSemanticChecks: true
  });
  return { data, body: String(parsed.content || ""), errors, warnings };
}

/**
 * Public entry: given a validated draft, resolve the destination, refuse
 * overwrite, write atomically, and prove the on-disk representation still
 * validates. Throws on any failure; on success returns metadata about the
 * write.
 */
function writePresentationCanonical({
  draft,
  root,
  allowOverwrite = false
}) {
  if (!draft || !draft.slug || !draft.frontMatter) {
    throw new Error("Canonical write blocked: draft is missing required fields");
  }

  const { destination, presentationsRoot, exists } = resolvePresentationDestination({
    slug: draft.slug,
    root
  });

  if (exists && !allowOverwrite) {
    throw new Error(
      `Canonical write blocked: destination already exists (${destination}). ` +
      `AP-03 does not overwrite existing canonical content.`
    );
  }

  // Pre-write validation on the in-memory draft as it will be serialized.
  const serialized = serializePresentationDraft(draft);
  const preParsed = matter(serialized);
  const preValidation = validateCollectionItem({
    collectionName: "presentations",
    data: preParsed.data || {},
    filePath: destination,
    rootDir: process.cwd(),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });
  if (preValidation.errors.length) {
    throw new Error(
      "Canonical write blocked: pre-write validation failed:\n" +
      preValidation.errors.map((e) => `  - ${e.field || "?"}: ${e.message}`).join("\n")
    );
  }

  // Contexts are explicit editorial input. Reject write if missing.
  const explicitContexts = preParsed.data && Array.isArray(preParsed.data.contexts)
    ? preParsed.data.contexts.filter(Boolean)
    : [];
  if (!explicitContexts.length) {
    throw new Error(
      "Canonical write blocked: explicit contexts required. AP-03 does not " +
      "infer contexts. Supply --contexts with editorial values."
    );
  }

  writeAtomic({ destination, bytes: serialized, allowOverwrite });

  const roundTrip = roundTripValidatePresentation({
    destination,
    useResolvedContexts: false
  });
  if (roundTrip.errors.length) {
    // Serializer parity failure. Leave the file in place for inspection but
    // signal loudly so the caller can decide (test path will clean up).
    throw new Error(
      "Canonical write round-trip failed: on-disk file did not re-validate:\n" +
      roundTrip.errors.map((e) => `  - ${e.field || "?"}: ${e.message}`).join("\n")
    );
  }

  return {
    destination,
    presentationsRoot,
    bytesWritten: Buffer.byteLength(serialized, "utf8"),
    roundTrip
  };
}

module.exports = {
  assertPublicationWriteUnsupported,
  assertSafeSlug,
  pickCanonicalFrontMatter,
  resolvePresentationDestination,
  roundTripValidatePresentation,
  serializePresentationDraft,
  writePresentationCanonical,
  PRESENTATION_CANONICAL_FIELDS
};
