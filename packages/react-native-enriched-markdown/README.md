# @verahealth/react-native-enriched-markdown

An unofficial fork of [`react-native-enriched-markdown`](https://github.com/software-mansion/react-native-enriched-markdown) by [Software Mansion](https://swmansion.com), maintained by [Vera Health](https://verahealth.ai) for use in the Vera mobile app.

This package is not affiliated with or endorsed by Software Mansion. If you do not need what is listed below, use the original package. All documentation, installation steps, props and platform support are the original's, and live in the [upstream repository](https://github.com/software-mansion/react-native-enriched-markdown) and at [enriched.swmansion.com/markdown](https://enriched.swmansion.com/markdown).

## What this fork adds

Link variants (`linkVariants` in `markdownStyle`) accept chip geometry, so a link can render as an inline pill, such as a citation chip, instead of a plain colored link. Upstream's `linkVariants` supports color, underline, background color and font family only.

These extra fields are available on each variant:

| Field | Type | Meaning |
|-------|------|---------|
| `borderColor` | string | Border color of the pill |
| `borderWidth` | number | Border width of the pill |
| `borderRadius` | number | Corner radius, clamped to half the pill height, so a large value gives a capsule |
| `paddingHorizontal` | number | Space between the label and the left and right edges of the pill |
| `paddingVertical` | number | Space between the label and the top and bottom edges of the pill |
| `fontScale` | number | Label size relative to the surrounding text, where 1 inherits |

```tsx
<EnrichedMarkdownText
  markdown={markdown}
  markdownStyle={{
    linkVariants: {
      '^cite:': {
        color: '#B06000',
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 6,
        paddingVertical: 1,
        fontScale: 0.85,
      },
    },
  }}
/>
```

Behavior:
- Everything is off by default. A variant that sets none of the chip fields renders exactly like upstream, and a build with no `linkVariants` is intended to render identically to the original package.
- The pill is sized to the text's cap height, rather than the full line height used by a plain background highlight.
- Adjacent pills do not run into each other.
- Works on iOS and Android, including inside lists and tables.

## Install

```sh
npm install react-native-enriched-markdown@npm:@verahealth/react-native-enriched-markdown
```

The alias keeps the import path `react-native-enriched-markdown`, so the code does not change if you later move back to the original package.

## Versions

Versions follow the upstream release they are based on, with a `-vera.N` suffix, for example `1.1.1-vera.1` is upstream `1.1.1` plus this fork's changes. They are published under the `vera` dist-tag rather than `latest`.

Source: [vera-health/enriched-markdown](https://github.com/vera-health/enriched-markdown), branch `vera/link-variant-chips`.

## License

MIT, same as the original. Copyright belongs to the original authors and contributors; see the upstream repository.
