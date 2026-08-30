# OWLS Design System

> **Мудрая аналитика в движении.** — Wise analytics in motion.

OWLS is a SaaS platform for marketplace sellers in the Russian e‑commerce ecosystem. It connects to **Ozon, Wildberries, Yandex Market, AliExpress, and MegaMarket** and gives small/mid-size sellers a single dashboard for products, warehouse, sales, finance, tasks, and buyer conversations.

The brand combines two symbols: an **owl** (wisdom, observation, the "night view" of data) and an **ascending bar chart** (growth, measurable progress, a confident course forward).

## Sources used to build this system

- `uploads/OWLS_BrandBook_v1.0.pdf` — official brand guidelines, 12 pages, v1.0 APR 2026 (in Russian). All color codes, type pairing, logo rules, and minimum sizes are lifted directly from this file.
- `screenshots/*.png` — five real product screenshots of `space.sellertech.ru` (the OWLS web app) covering: Marketplace, Website, Settings, Tasks, Finance. Component-level fidelity is built from these.
- The attached `Cloud Dis/` folder was empty when this system was built — **no source codebase was available**. UI components in `ui_kits/` are visual recreations from screenshots, not lifts from real code. If a codebase is available, re-attach it and the components can be re-grounded.

## Index

```
README.md              ← you are here
colors_and_type.css    ← single source of truth for color + type tokens
SKILL.md               ← Agent-Skills frontmatter (also works in Claude Code)

assets/                ← logo, owl mark, brand imagery
screenshots/           ← reference product screenshots
preview/               ← Design System tab cards (one HTML per swatch/specimen)
ui_kits/
  dashboard/           ← the OWLS web app — components + index.html demo
fonts/                 ← (Unbounded + Manrope are pulled from Google Fonts —
                          no TTFs shipped. See "Typography substitutions" below.)
```

---

## CONTENT FUNDAMENTALS

OWLS speaks in the brand's two native voices — **Russian first** (its primary market) and a clean technical English used for system labels and section headers in the brand book. The tone is **measured, professional, faintly poetic**. It is not a startup-y "Hey 👋" voice; it is the voice of a calm analyst.

**Pronouns & address.** Russian uses formal **«вы»** by default ("На карточке товара можно задать свою ставку." — "You can set your own rate on the product card."). The product never uses informal **«ты»**. In English fragments, OWLS is referred to in third person ("OWLS — Аналитика и рост для маркетплейсов") rather than first-person plural.

**Casing.** Two distinct treatments coexist:
- **Body & UI labels** — sentence case ("Только непрочитанные", "Поиск товара").
- **Display & section headers** — `S P A C E D   C A P S` with wide letter-spacing, often broken by a numeric prefix and a forward slash: `0 1 · О Б Р Е Н Д Е`, `B R A N D G U I D E L I N E S · V 1 . 0`. This treatment is the brand's signature; use it sparingly for chapter starts, page footers, and OG previews.

**Sentence rhythm.** Short, declarative, with periods that close on a thought. The brand book leans on two-beat lines:
- "Смотрим вперёд. Считаем точнее."  *(Looking forward. Counting more precisely.)*
- "Сдержанный фундамент и яркая, направленная вверх фокусная точка."  *(A restrained foundation and a bright, upward-focused point of attention.)*

**Numbers & punctuation.** Russian decimal comma (`7 931,47 ₽`), non-breaking thin-space thousands grouping, and the Cyrillic em‑dash with hair spaces around it ("Покупатель — продавец"). Currency symbol follows the amount with a thin space. Dates use either `DD.MM.YYYY` for tables or ISO `YYYY-MM-DDTHH:MM:SS.sssZ` for raw IDs.

**No emoji, no exclamation points.** Locked icons, success states, errors — all carry their information through small lucide-style line icons in the brand colors, never an emoji. There are no `!` in any UI string sampled from the product. Even the "you are locked out of this feature" message stays flat: «Ваш тариф не предусматривает доступ к этому функционалу.»

**Vocabulary anchors** (use these terms verbatim):

| Russian            | English                | When                                  |
| ------------------ | ---------------------- | ------------------------------------- |
| Маркетплейс        | Marketplace            | The integrations hub                  |
| Склад              | Warehouse              | Inventory section                     |
| Товары             | Products               | SKU list                              |
| Касса · Бухгалтерия | Cash desk · Accounting | Two tabs inside Finance               |
| Покупатель — продавец | Buyer — seller       | Chat type label                       |
| На проверке        | In review              | Task status (amber)                   |
| В работе           | In progress            | Task status (purple)                  |
| Завершена          | Completed              | Task status (green)                   |
| Сообщения · Отзывы · Возвраты · Сборочные задания | Messages · Reviews · Returns · Picking tasks | Marketplace tabs |

---

## VISUAL FOUNDATIONS

**Two colors and a quiet floor.** Every OWLS surface lives on the warm **Paper** neutral `#F6F4EF` or on **Pure White**. **Deep Navy `#0B1E35`** carries text and structure; **Signal Orange `#F26336`** is the *single* accent and is rationed — the brand book caps it at ≤20% of any composition. The product follows this religiously: the only orange surfaces in the app are the logo mark, the active tab underline, the primary CTA, and the notification badges. Everything else is navy, graphite, or paper.

**Type.** **Unbounded** (display, 400/700/800/900) for the logo, page headlines, and the `S P A C E D · C A P S` chapter rules. **Manrope** (text/UI, 400/500/600/700/800) for everything else — buttons, table rows, body, fine print. Cyrillic and Latin both supported. No third typeface anywhere in the book.

**Backgrounds.** Flat, never gradients. The default page is solid `#F6F4EF`; cards lift to `#FFFFFF`. The brand book itself uses a single hairline `#E1DCD0` rule between header and content. **No hand-drawn illustrations, no repeating patterns, no photography in chrome.** Marketing OG previews can carry a navy-on-paper composition with the owl mark, but there is no library of stock imagery.

**Layout.** The app uses a fixed left rail (~220px), an inset top bar, and a single content column with generous outer gutters. The brand book grid leaves at least `1X` (= the height of the letter "O" in the wordmark) of safe space around the logo — recommended `2X` in marketing. Translate to product: leave a 32px outer breathing margin on every card; never crowd the logo with chrome.

**Cards.** Rounded `--radius-lg` (14px), `#FFFFFF` fill, `1px` `#E1DCD0` border, **no shadow at rest**. On hover or focus, a near-flat `0 2px 8px rgba(11,30,53,0.06)` lifts the card just enough to feel pickable. Cards never stack — there is a single elevation level in the entire system.

**Borders.** 1px, hairline. `--owls-line #E1DCD0` for table rules and card edges; `--owls-stone #E9E5DC` for input rests. Never doubled, never dashed.

**Corner radius.** Three sizes only — `6px` for chips and small inputs, `10px` for buttons and standard inputs, `14px` for cards and panels. Pills (status, badges) are fully rounded.

**Hover.** Text links and tertiary buttons darken to navy `#0F2742`. Primary orange buttons go to `#D94B1F`. Card hovers add the level-2 shadow. **No opacity-based hovers** — every state is a real color shift.

**Active / pressed.** Buttons compress imperceptibly (`scale(0.99)`) and shift to a darker fill. Tabs flip from `Graphite` to `Ink` and gain the 2px orange underline that is one of the brand's three signature moves. Sidebar items get a `Stone` background fill plus the orange left rule.

**Animation.** Sparing. `--dur-fast 120ms` for state changes, `--dur-med 200ms` for entries and dropdowns, `--ease-out` curve. **No bounces, no parallax, no springs.** The owl in the logo never animates. Page transitions are crossfades, not slides.

**Transparency / blur.** Used only for two things: the lock-state overlay on tariff-gated pages (white tile, `0.96` alpha on a navy backdrop), and the modal scrim. Never decorative.

**Imagery.** Cool, neutral, never warm. When photography appears in marketing OG previews, it is desaturated and grayscale-leaning. No filters, no grain, no duotone effects.

**Iconography & dividers.** Thin, geometric, navy on paper. See the **ICONOGRAPHY** section below.

**Color of brand voice in motion.** Quiet base, single bright point. If a screen ever looks "too orange", it is. Pull one orange element back.

---

## ICONOGRAPHY

The OWLS product uses a **line icon system at ~1.5px stroke**, geometric and rounded, in `currentColor` — they pick up whatever foreground color their parent has. From the product screenshots, the set covers analytics (bar chart), warehouse (house), sales (bag), products (box), finance (₽ ruble), tasks (checklist), settings (gear), website (globe), marketplace (storefront), chat (speech bubble), notifications (bell), profile (user circle), sun/moon (theme toggle), search (magnifier), barcode scan (vertical lines), plus (`+` outlined circle), and a small owl glyph for the AI assistant entry.

**The closest CDN match is [Lucide](https://lucide.dev/) — 1.5px line, rounded caps, identical visual language.** This system uses Lucide as the de‑facto icon set (loaded from `https://unpkg.com/lucide@latest`). This is a substitution from the real product set — flagged below.

**Owl mark** is treated as a *symbol*, not an icon. It only ever appears in:
1. The sidebar logo block (mark + wordmark).
2. The assistant entry-point in the top bar (mark alone, ~20px, never the wordmark).
3. Favicons and avatars at small sizes (mark alone, brand book minimum is 32px on screen, 8mm in print).

**No emoji** are used anywhere. No unicode geometric chars (`✓ ✕ →`) are used in product chrome — only the brand book's section headers use a center-dot `·` to break tracked caps.

**Logo files** live in `assets/`:
- `owls_logo.png` — wordmark + mark, navy on paper.
- `owls_mark.png` — owl mark only, navy + orange.
- The brand book also defines a `MONO · BLACK` (all-navy print) and `MONO · WHITE` (knockout on dark) variant — these are not extracted here; render from the source PDF if needed.

---

## Typography substitutions & known gaps

- **Fonts are loaded from Google Fonts** (Unbounded + Manrope are both open-source and on the official Google Fonts CDN). No local TTFs are shipped. The brand book itself confirms both as Google Fonts.
- **Icon set is substituted to Lucide.** The real product appears to use a custom 1.5px line set with identical metrics — visually the substitution is indistinguishable, but if the original SVGs are available they should drop in to replace Lucide.
- **No fonts/ folder ships TTFs.** If you need to self-host (offline use, PPTX export), grab the .woff2 files from Google Fonts and drop them in `fonts/`.

## Iterate

This system is a v1 built from the brand book + 5 product screenshots. Re-attach the real codebase or Figma file and the UI kit components can be re-derived against the actual implementation. Specifically the **table density, status pill exact hues, sidebar collapse animation, and modal chrome** would benefit from real-source verification.
