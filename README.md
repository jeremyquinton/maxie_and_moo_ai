<h1 align="center" style="position: relative;">
  <br>
    <img src="./assets/shoppy-x-ray.svg" alt="logo" width="200">
  <br>
  Shopify Skeleton Theme
</h1>

A minimal, carefully structured Shopify theme designed to help you quickly get started. Designed with modularity, maintainability, and Shopify's best practices in mind.

<p align="center">
  <a href="./LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"></a>
  <a href="./actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Shopify/skeleton-theme/actions/workflows/ci.yml/badge.svg"></a>
</p>

## Getting started

### Prerequisites

Before starting, ensure you have the latest Shopify CLI installed:

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) – helps you download, upload, preview themes, and streamline your workflows

If you use VS Code:

- [Shopify Liquid VS Code Extension](https://shopify.dev/docs/storefronts/themes/tools/shopify-liquid-vscode) – provides syntax highlighting, linting, inline documentation, and auto-completion specifically designed for Liquid templates

### Clone

Clone this repository using Git or Shopify CLI:

```bash
git clone git@github.com:Shopify/skeleton-theme.git
# or
shopify theme init
```

### Preview

Preview this theme using Shopify CLI:

```bash
shopify theme dev
```

### Deploy

From the theme directory, upload a new unpublished theme to Shopify:

```bash
shopify theme push --unpublished
```

Follow the prompts to connect to your store and name the theme. Use the returned preview link to review it before publishing.

To update an existing theme instead, run `shopify theme push` and select it. This overwrites its remote files; selecting the live theme affects your storefront.

To update an existing theme without uploading JSON files, run:

```bash
shopify theme push --ignore "**/*.json" --nodelete
```

Select the theme to update. This skips JSON templates, settings, and locale files, and preserves remote files that are absent locally. Changes to translations or other JSON files must be applied separately.

When you're ready to make an unpublished theme live, run `shopify theme publish` and select the theme. See the [Shopify CLI theme push documentation](https://shopify.dev/docs/api/shopify-cli/theme/theme-push) for more options.

### Section color schemes

In the theme editor, open **Theme settings > Colors** to edit or add reusable color schemes. Three starting schemes are included: white, pale green, and charcoal. Each scheme defines background, optional gradient, text, link, and button colors.

Select a section, enable **Use section color scheme**, and choose its **Color scheme**. The background spans the full section width while content keeps its existing layout. Disable the switch to retain the section's original colors. Image/video overlay text, product status colors, and app-provided styling retain their own controls.

### Section heading typography

Select a section and enable **Customize heading typography** to choose a font and set sizes for its main and secondary headings. Settings apply to the section's own headings and supported theme blocks, not headings in rich text or apps. Leave the switch off to keep the original styling.

### Wide flow selection

Add **Wide flow selection** in the theme editor and select a collection. It displays a full-width carousel on desktop and a two-column grid on mobile. Product cards link to their product pages; on hover, desktop cards show the second image when available.

Product galleries, collection product cards, and featured collection carousels use circular previous/next buttons.

### Product display names

Set the product metafield `custom.display_name` to replace the displayed product title on product pages and collection grids. If it is blank, the product title is used.

### Product color picker

In the product template, select a collection in the **Product color picker** block. The picker appears only when the current product belongs to that collection. Available products appear in the collection's order; set its sort order to **Manually** in Shopify to rearrange them. Each swatch uses the product's `custom.colour_swatch_image` metafield, falling back to its product image when unset. Sold-out products are omitted.

The selection applies to every product using that template. Add a picker block for each color collection or use separate product templates. Existing picker blocks need a collection selected after updating the theme.

### Product size chart

Size options appear as selectable boxes without prices, all visible on page load and arranged two per row on desktop. Selecting a box updates the product variant, main price, and availability.

Select a **Size chart page** in the product section settings. Its link appears right-aligned beside the size label, with a single underline and no arrow. Products without a size option keep a standalone link.

### FAQ page

The page at `/pages/frequently-asked-questions` has no content border, heading accent line, or horizontal rules. Other informational pages keep their existing styling.

FAQ accordion blocks have a subtle bottom divider on each item, without a top border.

## Theme architecture

```bash
.
├── assets          # Stores static assets (CSS, JS, images, fonts, etc.)
├── blocks          # Reusable, nestable, customizable UI components
├── config          # Global theme settings and customization options
├── layout          # Top-level wrappers for pages (layout templates)
├── locales         # Translation files for theme internationalization
├── sections        # Modular full-width page components
├── snippets        # Reusable Liquid code or HTML fragments
└── templates       # Templates combining sections to define page structures
```

To learn more, refer to the [theme architecture documentation](https://shopify.dev/docs/storefronts/themes/architecture).

### Templates

[Templates](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) control what's rendered on each type of page in a theme.

The Skeleton Theme scaffolds [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) to make it easy for merchants to customize their store.

None of the template types are required, and not all of them are included in the Skeleton Theme. Refer to the [template types reference](https://shopify.dev/docs/storefronts/themes/architecture/templates#template-types) for a full list.

### Sections

[Sections](https://shopify.dev/docs/storefronts/themes/architecture/sections) are Liquid files that allow you to create reusable modules of content that can be customized by merchants. They can also include blocks which allow merchants to add, remove, and reorder content within a section.

Sections are made customizable by including a `{% schema %}` in the body. For more information, refer to the [section schema documentation](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema).

### Blocks

[Blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks) let developers create flexible layouts by breaking down sections into smaller, reusable pieces of Liquid. Each block has its own set of settings, and can be added, removed, and reordered within a section.

Blocks are made customizable by including a `{% schema %}` in the body. For more information, refer to the [block schema documentation](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/schema).

## Schemas

When developing components defined by schema settings, we recommend these guidelines to simplify your code:

- **Single property settings**: For settings that correspond to a single CSS property, use CSS variables:

  ```liquid
  <div class="collection" style="--gap: {{ block.settings.gap }}px">
    ...
  </div>

  {% stylesheet %}
    .collection {
      gap: var(--gap);
    }
  {% endstylesheet %}

  {% schema %}
  {
    "settings": [{
      "type": "range",
      "label": "gap",
      "id": "gap",
      "min": 0,
      "max": 100,
      "unit": "px",
      "default": 0,
    }]
  }
  {% endschema %}
  ```

- **Multiple property settings**: For settings that control multiple CSS properties, use CSS classes:

  ```liquid
  <div class="collection {{ block.settings.layout }}">
    ...
  </div>

  {% stylesheet %}
    .collection--full-width {
      /* multiple styles */
    }
    .collection--narrow {
      /* multiple styles */
    }
  {% endstylesheet %}

  {% schema %}
  {
    "settings": [{
      "type": "select",
      "id": "layout",
      "label": "layout",
      "values": [
        { "value": "collection--full-width", "label": "t:options.full" },
        { "value": "collection--narrow", "label": "t:options.narrow" }
      ]
    }]
  }
  {% endschema %}
  ```

## CSS & JavaScript

For CSS and JavaScript, we recommend using the [`{% stylesheet %}`](https://shopify.dev/docs/api/liquid/tags#stylesheet) and [`{% javascript %}`](https://shopify.dev/docs/api/liquid/tags/javascript) tags. They can be included multiple times, but the code will only appear once.

### `critical.css`

The Skeleton Theme explicitly separates essential CSS necessary for every page into a dedicated `critical.css` file.

## Contributing

We're excited for your contributions to the Skeleton Theme! This repository aims to remain as lean, lightweight, and fundamental as possible, and we kindly ask your contributions to align with this intention.

Visit our [CONTRIBUTING.md](./CONTRIBUTING.md) for a detailed overview of our process, guidelines, and recommendations.

## License

Skeleton Theme is open-sourced under the [MIT](./LICENSE.md) License.

