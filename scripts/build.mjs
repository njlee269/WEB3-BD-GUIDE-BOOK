import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(rootDir, "site", "assets");

const book = JSON.parse(await readFile(path.join(rootDir, "book.json"), "utf8"));

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");
}

function parseInline(value) {
  const escaped = escapeHtml(value);

  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const headings = [];

  let paragraph = [];
  let listType = null;
  let listItems = [];
  let quoteLines = [];
  let codeFence = null;
  let codeLines = [];

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }

    html.push(`<p>${parseInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!listType || !listItems.length) {
      return;
    }

    const tag = listType === "ol" ? "ol" : "ul";
    html.push(`<${tag}>${listItems.map((item) => `<li>${parseInline(item)}</li>`).join("")}</${tag}>`);
    listType = null;
    listItems = [];
  }

  function flushQuote() {
    if (!quoteLines.length) {
      return;
    }

    html.push(`<blockquote><p>${parseInline(quoteLines.join(" "))}</p></blockquote>`);
    quoteLines = [];
  }

  function flushCode() {
    if (!codeFence) {
      return;
    }

    const language = codeFence ? ` class="language-${escapeHtml(codeFence)}"` : "";
    html.push(`<pre><code${language}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeFence = null;
    codeLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (codeFence !== null) {
      if (line.startsWith("```")) {
        flushCode();
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    const unorderedMatch = line.match(/^-\s+(.*)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    const quoteMatch = line.match(/^>\s+(.*)$/);

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      flushQuote();
      codeFence = line.slice(3).trim();
      codeLines = [];
      continue;
    }

    if (!line) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      flushQuote();
      html.push("<hr />");
      continue;
    }

    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();

      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(stripMarkdown(text));

      headings.push({ level, text: stripMarkdown(text), id });
      html.push(`<h${level} id="${id}">${parseInline(text)}</h${level}>`);
      continue;
    }

    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(unorderedMatch[1].trim());
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1].trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushCode();

  return { html: html.join("\n"), headings };
}

function getSidebar(chapters, currentSlug) {
  return `
    <nav class="sidebar">
      <a class="brand" href="index.html">
        <span class="brand-mark">BD</span>
        <span>
          <strong>${escapeHtml(book.title)}</strong>
          <small>${escapeHtml(book.date)}</small>
        </span>
      </a>
      <div class="sidebar-copy">
        <p>${escapeHtml(book.subtitle)}</p>
      </div>
      <ol class="chapter-list">
        ${chapters
          .map((chapter, index) => {
            const href = chapter.slug === "cover" ? "index.html" : `${chapter.slug}.html`;
            const active = chapter.slug === currentSlug ? "chapter-link active" : "chapter-link";
            return `
              <li>
                <a class="${active}" href="${href}">
                  <span class="chapter-index">${String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>${escapeHtml(chapter.title)}</strong>
                    <small>${escapeHtml(chapter.description)}</small>
                  </span>
                </a>
              </li>
            `;
          })
          .join("")}
      </ol>
      <div class="sidebar-footer">
        <a href="print.html">Open printable full book</a>
      </div>
    </nav>
  `;
}

function getPageToc(headings) {
  const visible = headings.filter((heading) => heading.level <= 3);
  if (!visible.length) {
    return "";
  }

  return `
    <aside class="page-toc">
      <p class="eyebrow">On this page</p>
      <ul>
        ${visible
          .map((heading) => `<li class="toc-level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`)
          .join("")}
      </ul>
    </aside>
  `;
}

function getPageShell({ title, description, body, headings, currentSlug, previous, next }) {
  const sidebar = getSidebar(book.chapters, currentSlug);
  const toc = getPageToc(headings);

  const previousLink = previous
    ? `<a class="pager-link" href="${previous.slug === "cover" ? "index.html" : `${previous.slug}.html`}"><span>Previous</span><strong>${escapeHtml(previous.title)}</strong></a>`
    : `<span class="pager-link disabled"><span>Previous</span><strong>Start of book</strong></span>`;

  const nextLink = next
    ? `<a class="pager-link" href="${next.slug === "cover" ? "index.html" : `${next.slug}.html`}"><span>Next</span><strong>${escapeHtml(next.title)}</strong></a>`
    : `<span class="pager-link disabled"><span>Next</span><strong>End of book</strong></span>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | ${escapeHtml(book.title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body>
    <div class="site-shell">
      ${sidebar}
      <main class="content-shell">
        <header class="page-header">
          <p class="eyebrow">Private offline study guide</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="page-description">${escapeHtml(description)}</p>
        </header>
        <div class="page-grid">
          <article class="page-content">
            ${body}
            <div class="pager">
              ${previousLink}
              ${nextLink}
            </div>
          </article>
          ${toc}
        </div>
      </main>
    </div>
  </body>
</html>`;
}

function getIndexShell({ coverHtml, chapters }) {
  const sidebar = getSidebar(book.chapters, "cover");

  const cards = chapters
    .slice(1)
    .map(
      (chapter, index) => `
        <a class="chapter-card" href="${chapter.slug}.html">
          <span class="chapter-index">${String(index + 2).padStart(2, "0")}</span>
          <strong>${escapeHtml(chapter.title)}</strong>
          <p>${escapeHtml(chapter.description)}</p>
        </a>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(book.title)}</title>
    <meta name="description" content="${escapeHtml(book.subtitle)}" />
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body>
    <div class="site-shell">
      ${sidebar}
      <main class="content-shell">
        <section class="hero">
          <p class="eyebrow">${escapeHtml(book.builtFor)}</p>
          <h1>${escapeHtml(book.title)}</h1>
          <p class="hero-copy">${escapeHtml(book.subtitle)}</p>
          <div class="hero-actions">
            <a class="button primary" href="global-market-map.html">Start reading</a>
            <a class="button" href="print.html">Open full printable book</a>
          </div>
        </section>
        <section class="cover-content">
          ${coverHtml}
        </section>
        <section class="chapter-cards">
          <div class="section-heading">
            <p class="eyebrow">Contents</p>
            <h2>Reading map</h2>
          </div>
          <div class="card-grid">
            ${cards}
          </div>
        </section>
      </main>
    </div>
  </body>
</html>`;
}

function getPrintShell(chapters) {
  const sections = chapters
    .map(
      (chapter, index) => `
        <section class="print-section">
          <div class="print-heading">
            <p>Chapter ${String(index + 1).padStart(2, "0")}</p>
            <h1>${escapeHtml(chapter.title)}</h1>
            <p>${escapeHtml(chapter.description)}</p>
          </div>
          <article class="page-content">
            ${chapter.html}
          </article>
        </section>
      `
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(book.title)} | Printable Book</title>
    <meta name="description" content="${escapeHtml(book.subtitle)}" />
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body class="print-body">
    <main class="print-book">
      <section class="print-cover">
        <p class="eyebrow">${escapeHtml(book.builtFor)}</p>
        <h1>${escapeHtml(book.title)}</h1>
        <p>${escapeHtml(book.subtitle)}</p>
        <p>${escapeHtml(book.date)}</p>
      </section>
      ${sections}
    </main>
  </body>
</html>`;
}

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "assets"), { recursive: true });
await cp(path.join(assetsDir, "styles.css"), path.join(distDir, "assets", "styles.css"));

const builtChapters = [];

for (let index = 0; index < book.chapters.length; index += 1) {
  const chapter = book.chapters[index];
  const markdown = await readFile(path.join(rootDir, chapter.file), "utf8");
  const parsed = parseMarkdown(markdown);
  const previous = book.chapters[index - 1] ?? null;
  const next = book.chapters[index + 1] ?? null;

  builtChapters.push({
    ...chapter,
    html: parsed.html,
    headings: parsed.headings
  });

  if (chapter.slug === "cover") {
    continue;
  }

  const page = getPageShell({
    title: chapter.title,
    description: chapter.description,
    body: parsed.html,
    headings: parsed.headings,
    currentSlug: chapter.slug,
    previous,
    next
  });

  await writeFile(path.join(distDir, `${chapter.slug}.html`), page);
}

const coverChapter = builtChapters[0];
await writeFile(
  path.join(distDir, "index.html"),
  getIndexShell({
    coverHtml: coverChapter.html,
    chapters: builtChapters
  })
);

await writeFile(path.join(distDir, "print.html"), getPrintShell(builtChapters));

await writeFile(
  path.join(distDir, "manifest.json"),
  JSON.stringify(
    {
      title: book.title,
      date: book.date,
      chapters: builtChapters.map((chapter) => ({
        slug: chapter.slug,
        title: chapter.title,
        description: chapter.description
      }))
    },
    null,
    2
  )
);

console.log(`Built ${builtChapters.length} chapters into ${distDir}`);
