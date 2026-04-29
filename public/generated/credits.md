# Generated assets — credits

This directory holds AI-generated imagery used as Liquid Glass wallpapers,
onboarding heroes, and Patterns-tab pictograms. Source images are committed
so the build is fully reproducible without re-running the image model.

## Master prompt template

> "A minimalist abstract landscape at **{time}** in **{season}**, soft
> gradient sky, one small geometric element (moon / sun / wave), Apple
> Health app color palette, no text, no faces, no brand marks, suitable
> as a wallpaper behind frosted glass UI, **2048×2732**, matte finish,
> very low contrast, warm highlights on cool base."

Seasons: `spring`, `summer`, `autumn`, `winter` × Times: `dawn`, `dusk`.

## Heroes (`heroes/`)

Eight files, one per season × time combo. Suggested filenames:

| File                       | Season | Time | Use                                                |
| -------------------------- | ------ | ---- | -------------------------------------------------- |
| `spring-dawn.webp`         | Spring | Dawn | March — June 06:00–11:00 local on `/today`          |
| `spring-dusk.webp`         | Spring | Dusk | March — June 17:00–22:00 local on `/today`          |
| `summer-dawn.webp`         | Summer | Dawn | June — September morning hero                      |
| `summer-dusk.webp`         | Summer | Dusk | June — September evening hero                      |
| `autumn-dawn.webp`         | Autumn | Dawn | September — December morning hero                  |
| `autumn-dusk.webp`         | Autumn | Dusk | September — December evening hero                  |
| `winter-dawn.webp`         | Winter | Dawn | December — March morning hero                      |
| `winter-dusk.webp`         | Winter | Dusk | December — March evening hero                      |

**Placement:** rendered behind the home-card stack on `/today`, at 100% width
of the safe area, with 35–45% opacity so the Liquid Glass card on top reads
as the primary element.

## Onboarding hero (`heroes/onboarding.webp`)

> "A frosted glass card floating over a peach-to-indigo gradient sky,
> very soft bokeh, no text, no UI affordances visible, 2048×2732, matte
> finish, suitable as a hero on a sign-in screen."

**Placement:** background of `/login`, full-bleed, 60% opacity behind a
single Liquid Glass auth card.

## Pictograms (`pictograms/`)

Four glyphs at `24×24` and `48×48` (PNG with transparent background, single
color `#1C1C1E` for light theme, also exported as `#E8E8EA` for Midnight).

> "A flat, single-color line pictogram of a **{wave / mountain / candle / leaf}**,
> 2px stroke, rounded caps, centered in a square frame, transparent background,
> in the style of SF Symbols, no shadows, no fills, no extras."

| File                          | Subject  | Use on `/patterns`                     |
| ----------------------------- | -------- | -------------------------------------- |
| `wave-24.png` / `wave-48.png` | Wave     | Emotional weather marker — calm        |
| `mountain-{24,48}.png`        | Mountain | Theme cluster — challenge / endurance  |
| `candle-{24,48}.png`          | Candle   | Theme cluster — focus / inwardness     |
| `leaf-{24,48}.png`            | Leaf     | Theme cluster — growth / change        |

## Per-file actuals

_Append a row here each time you commit a generated image, with the
exact prompt you used and any seed / model details, so future-you can
regenerate variants from the same starting point._

| File | Date | Model | Prompt (verbatim) | Notes |
| ---- | ---- | ----- | ----------------- | ----- |
|      |      |       |                   |       |
