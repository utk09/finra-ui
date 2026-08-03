# @utk09/finra-ui-icons

## 0.4.0

### Minor Changes

- bugfix unstyled components, enhance storybook

## 0.3.0

### Minor Changes

- fix FileDropZone and PillInput discarding a consumer's `onClick`, `onKeyDown`, `onDragOver`, `onDragLeave` or `onDrop` instead of composing with their own - passing `onDrop` stopped the drop zone accepting files entirely. Consumer handlers now run first, and `preventDefault()` claims the gesture on click/keydown (never on dragover/drop, where it is the standard valid-drop-target idiom).
- fix PriceInput, TenorPicker, DateTenorPicker, DateInput and DateTenorInput showing a value a controlled parent had rejected - the display now re-derives from the value the field actually holds, and an uncontrolled field follows formatting-prop changes
- fix PriceInput stepping past a custom `validate`: arrow keys clamped `min`/`max` but skipped the check a typed value gets

## 0.2.0

### Minor Changes

- add AmountInput: human-notation amount entry (`1.23M`, `10m`, `2bn`, `1e5`) resolved to a canonical number, with currency-aware precision, lossless compact display and prop-driven stepping
- fix `useClickOutside` to listen for `pointerdown` instead of `mousedown`, so outside-dismiss works on iOS Safari
- disable sourcemaps to reduce published bundle size

## 0.1.0

### Minor Changes

- add CurrencyPairPicker, async currency pair search and selection combobox, bump to minor

## 0.0.15

### Patch Changes

- add icons

## 0.0.14

### Patch Changes

- add decimal arithmetic functions, cleanup tests

## 0.0.13

### Patch Changes

- APG a11y conformance and date i18n

## 0.0.12

### Patch Changes

- add tenor picker, deprecate tenor input

## 0.0.11

### Patch Changes

- add price input, improve date tenor picker, update documentation

## 0.0.9

### Patch Changes

- add dialogs and portals
