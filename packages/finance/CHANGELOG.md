# @utk09/finra-ui-finance

## 0.5.0

### Minor Changes

- **Action required.** Month and year tenors clamp to the target month's length instead of overflowing. `1M` from 31 January was returning 3 March and now returns 28 February, 29 in a leap year. Tenor results are also normalised to midnight, so a reference date carrying a time of day now resolves to the start of the target day.
- **Action required.** `FileDropZone`'s `data-finra-ui="file-drop-zone-icon"` moved from the `<svg>` onto a wrapper `<span>`, so the icon slot keeps its selector when you replace the icon. A rule targeting that attribute now matches the slot; size the icon with `[data-finra-ui="file-drop-zone-icon"] > svg`.
- **Action required.** `IconData` declares `width` and `height`, which breaks any custom icon data you construct yourself. Both are `"1em"` across the set.
- Icons carry a `1em` default size. An `<svg>` with only a `viewBox` resolves to the CSS replaced-element default of around 300px, so an icon used outside a container that sized it came out enormous. Consumer props and CSS both still override it.
- Icons that render an icon now let you replace it: `renderCloseIcon` on `Toaster` and `ToastItem`, `renderPillRemoveIcon` on `PillInput`, `renderClearIcon` on `Input`, and `renderIcon` on `FileDropZone`. Each keeps its button's `aria-label`, so a replacement stays decorative. The styled toast also closes with a real icon rather than a `×` character.
- New `ErrorBoundary` in the `/unstyled` entry, so a render error in one subtree no longer takes the application down with it. Takes a node or a render-prop `fallback` receiving `{ error, reset }`, plus `onError` for reporting.
- `FocusScope` accepts `fallbackFocus`, used when the element that had focus is gone by the time the scope closes. A trigger often unmounts alongside the surface it opened, and restoring focus to a detached element silently drops it to the page body.
- `PillInput` is now one implementation rather than two. The unstyled base gained `classNames` and `renderPillRemoveIcon`, and it now renders the `pill-input-pill-text` span that previously existed only in the styled build, so that selector works in both.
- `Slot` chains only `on*` event handlers. Any other function prop the child also sets is left to the child, because chaining discarded its return value.

### Patch Changes

- Updated dependencies
  - @utk09/finra-ui@0.5.0
  - @utk09/finra-ui-icons@0.5.0

## 0.4.0

### Minor Changes

- **Action required.** A required `FormField` renders its asterisk as real text, so the label now reads `Full Name *`. Generated content never reaches `textContent` and is missed by some screen readers, so the old CSS-only marker was seen by sighted Chromium users and nobody else. Update `getByLabelText("Full Name")` to `"Full Name *"` or a regex.
- Relicensed from MIT to Apache-2.0. `LICENSE` and `NOTICE` now ship inside each package.
- Styling is overridable by contract. All shipped CSS lives in `@layer finra-ui`, so any ordinary rule you write beats it without `!important`, and every rendered element carries a stable `data-finra-ui` id exported as `componentIds` alongside `FINRA_UI_ATTR`. Parts rendered inside portals are covered too.
- 16 new design tokens, mainly the container, disabled and `--finra-z-*` families. Nothing was renamed or removed.
- Fixed invisible text in dark mode. Secondary variants across 11 components read a colour that never flipped, leaving typed text the same colour as the field behind it. Placeholders separately failed AA contrast in the light theme.
- The `Switch` off-state knob is now dark in light mode. It failed WCAG 1.4.11 in both themes and now clears 3:1 in all four state and theme combinations.
- `DateTenorPicker` set `aria-selected` from the highlighted option rather than the chosen one, so it never marked the current tenor and announced un-chosen options as selected.
- `DialogContent` accepts `overlayClassName`, the only way to reach the backdrop. `ToastControls` is now importable from the package root, and a custom `renderToast` result is no longer wrapped in an extra `div`.
- Importing one component no longer pulls in the whole library. A lone `Button` cost 56 kB of the 64 kB library and now costs 4.3 kB. `clsx` and `class-variance-authority` are external rather than inlined into both packages.
- The unstyled entry ships no CSS. Three styled stylesheets used global `[data-finra-ui]` selectors that also matched the unstyled layer, so unstyled Dialog got a scrim, Select options got padding, and toasts got a white panel.

### Patch Changes

- Updated dependencies
  - @utk09/finra-ui@0.4.0
  - @utk09/finra-ui-icons@0.4.0

## 0.3.0

### Minor Changes

- fix FileDropZone and PillInput discarding a consumer's `onClick`, `onKeyDown`, `onDragOver`, `onDragLeave` or `onDrop` instead of composing with their own - passing `onDrop` stopped the drop zone accepting files entirely. Consumer handlers now run first, and `preventDefault()` claims the gesture on click/keydown (never on dragover/drop, where it is the standard valid-drop-target idiom).
- fix PriceInput, TenorPicker, DateTenorPicker, DateInput and DateTenorInput showing a value a controlled parent had rejected - the display now re-derives from the value the field actually holds, and an uncontrolled field follows formatting-prop changes
- fix PriceInput stepping past a custom `validate`: arrow keys clamped `min`/`max` but skipped the check a typed value gets

### Patch Changes

- Updated dependencies
  - @utk09/finra-ui@0.3.0
  - @utk09/finra-ui-icons@0.3.0

## 0.2.0

### Minor Changes

- add AmountInput: human-notation amount entry (`1.23M`, `10m`, `2bn`, `1e5`) resolved to a canonical number, with currency-aware precision, lossless compact display and prop-driven stepping
- fix `useClickOutside` to listen for `pointerdown` instead of `mousedown`, so outside-dismiss works on iOS Safari
- disable sourcemaps to reduce published bundle size

### Patch Changes

- Updated dependencies
  - @utk09/finra-ui@0.2.0
  - @utk09/finra-ui-icons@0.2.0

## 0.1.0

### Minor Changes

- add CurrencyPairPicker, async currency pair search and selection combobox, bump to minor

### Patch Changes

- Updated dependencies
  - @utk09/finra-ui@0.1.0
  - @utk09/finra-ui-icons@0.1.0

## 0.0.15

### Patch Changes

- add icons
- Updated dependencies
  - @utk09/finra-ui@0.0.15
  - @utk09/finra-ui-icons@0.0.15

## 0.0.14

### Patch Changes

- add decimal arithmetic functions, cleanup tests
- Updated dependencies
  - @utk09/finra-ui@0.0.14
  - @utk09/finra-ui-icons@0.0.14

## 0.0.13

### Patch Changes

- APG a11y conformance and date i18n
- Updated dependencies
  - @utk09/finra-ui@0.0.13
  - @utk09/finra-ui-icons@0.0.13

## 0.0.12

### Patch Changes

- add tenor picker, deprecate tenor input
- Updated dependencies
  - @utk09/finra-ui@0.0.12
  - @utk09/finra-ui-icons@0.0.12

## 0.0.11

### Patch Changes

- add price input, improve date tenor picker, update documentation

## 0.0.9

### Patch Changes

- add dialogs and portals
