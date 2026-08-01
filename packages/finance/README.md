# @utk09/finra-ui-finance

The financial fields of [finra-ui](https://github.com/utk09/finra-ui): prices, amounts, tenors and dates, plus the parsers that make them work.

[![npm](https://img.shields.io/npm/v/@utk09/finra-ui-finance.svg)](https://www.npmjs.com/package/@utk09/finra-ui-finance) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**[Browse the components](https://finra-ui.netlify.app)**

## Install

```bash
npm install @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
```

Core and icons are peer dependencies. React 18 or later. ESM only.

## What you get

A handful of fields that already know their domain.

```tsx
import "@utk09/finra-ui-finance/styles";
import { AmountInput, PriceInput, TenorPicker } from "@utk09/finra-ui-finance";
```

Type `10m` into `AmountInput` and it commits `10000000`, resting as `$10M`. `2bn`, `1.5k` and `(2m)` for a negative all do the obvious thing. What you receive is a plain number, not an object to unpack before doing arithmetic; currency is a separate prop that selects precision and the symbol.

Arrow on a `PriceInput` and it moves by the instrument's tick, not by one. It reads decimal, FX big-figure and pips, bond 32nds (`101-16`, `101-16+`), percent and basis points, and it snaps an off-grid price onto the tick before stepping.

`3M`, `1y6m`, `90d` and `3 months` all normalise to the same canonical tenor in `TenorPicker`. `DateTenorPicker` goes further and accepts `SPOT+1W` or a literal date in the same field, then reports which of the two the user meant and whether the result is a broken date.

## The one thing to understand

This package has no opinion about your market conventions, because it cannot have a correct one. Holiday calendars, settlement lag and spot dates differ per desk and per currency, so they are injected.

```tsx
<DateTenorPicker
  referenceDate={today}
  calendar={{ isBusinessDay, adjust }}
  adjustmentConvention="following"
  settlementEngine={(date, parsed) => addSpotLag(date, parsed)}
/>
```

Omit them and you get plain calendar arithmetic, which is right for many screens and wrong for a trading desk. The components own the interaction and the accessibility. You own the conventions.

The same holds for instruments. `CurrencyPairPicker` takes an `InstrumentProvider` you implement, and hands back the whole pair on selection rather than just its id, so the pricing metadata it carries can seed the price field beside it.

## Entry points

| Import                             | Contains                                                   |
| ---------------------------------- | ---------------------------------------------------------- |
| `@utk09/finra-ui-finance`          | The styled components. Start here.                         |
| `@utk09/finra-ui-finance/unstyled` | The same components with behaviour and ARIA but no CSS.    |
| `@utk09/finra-ui-finance/utils`    | The engines on their own: parsers, formatters, tick maths. |
| `@utk09/finra-ui-finance/styles`   | The stylesheet. Import once, for side effects.             |

## Using the engines without the components

The parsing and formatting is pure and framework-free. It is useful in a grid cell, a server route, or a validation schema, anywhere a React component would be the wrong shape.

```ts
import { formatPrice, parseAmount, parseTenorInput } from "@utk09/finra-ui-finance/utils";

parseAmount("2.5bn").value; // 2500000000
formatPrice(101.5, { format: "bond32" }); // "101-16"
parseTenorInput("1 year 6 months").tenor; // "1Y6M"
```

## Documentation

Every exported type and prop carries editor documentation, so hovering usually beats reading. Beyond that, see [Storybook](https://finra-ui.netlify.app) and the [repository](https://github.com/utk09/finra-ui).

## License

[Apache-2.0](LICENSE). Keep the notices and pass on the [NOTICE](NOTICE) file when redistributing.
