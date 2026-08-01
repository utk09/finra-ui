# @utk09/finra-ui-finance

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
