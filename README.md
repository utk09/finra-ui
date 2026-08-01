# finra-ui

A React component library for financial interfaces, and for the ordinary forms and overlays that surround them.

[![CI](https://github.com/utk09/finra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/utk09/finra-ui/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/@utk09/finra-ui.svg)](https://www.npmjs.com/package/@utk09/finra-ui) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**[Browse the components](https://finra-ui.netlify.app)**

## Why this exists

Trading and back-office screens keep re-implementing the same handful of awkward fields. A price input that steps by a tick rather than by one. An amount field where typing `10m` means ten million. A date field that also accepts `3M` or `SPOT+1W`. Each is small, each is easy to get subtly wrong, and each tends to get rewritten per project.

`finra-ui` ships those, plus the ordinary components they sit next to, so a form is one library rather than two.

## What it does not do

It has no opinion about your market conventions. Holiday calendars, settlement lag, spot dates and tick grids differ per desk and per currency, so they are injected rather than assumed. The components own the interaction and the accessibility; you own the conventions.

## Packages

| Package | What it is |
| --- | --- |
| [`@utk09/finra-ui`](https://www.npmjs.com/package/@utk09/finra-ui) ([docs](packages/core/README.md)) | Buttons, inputs, forms, overlays, tabs, toasts. 24 components. |
| [`@utk09/finra-ui-finance`](https://www.npmjs.com/package/@utk09/finra-ui-finance) ([docs](packages/finance/README.md)) | Price, amount, tenor and date-tenor fields, plus the parsers behind them. |
| [`@utk09/finra-ui-icons`](https://www.npmjs.com/package/@utk09/finra-ui-icons) ([docs](packages/icons/README.md)) | 127 icons as plain data, with React wrappers. |

## Install

```bash
npm install @utk09/finra-ui

# finance components peer-depend on core and icons
npm install @utk09/finra-ui-finance @utk09/finra-ui @utk09/finra-ui-icons
```

Requires React 18 or later. The packages are ESM only.

## Use

Import the stylesheet once at your app root, then the components anywhere.

```tsx
import "@utk09/finra-ui/styles";
import { Button, FormField } from "@utk09/finra-ui";
import { AmountInput, PriceInput } from "@utk09/finra-ui-finance";

function Ticket() {
  return (
    <form>
      <FormField label="Notional">
        <AmountInput currency="USD" onChange={setNotional} />
      </FormField>

      <FormField label="Rate">
        <PriceInput
          format="decimal"
          precision={{ primaryPrecision: 4, precisionDigits: 1 }}
          tickSize={0.00005}
        />
      </FormField>

      <Button variant="primary">Send</Button>
    </form>
  );
}
```

Typing `10m` into that amount field commits `10000000` and rests as `$10M`. Arrowing on the rate moves it by half a pip, not by one.

## How it is put together

**Two layers.** Every component has an unstyled base under the `/unstyled` entry point that carries the behaviour, keyboard handling and ARIA but no CSS. The default export adds the styling. If your design system disagrees with ours, take the base and skip the rest.

**No provider.** Theme and density are CSS, set with `data-theme` and `data-density` on any ancestor. Nothing to wrap your tree in, and nothing that breaks under SSR.

**Stable selectors.** Each component renders `data-finra-ui="{name}"`. That attribute is public API you can style against. The hashed class names are not.

**Typed.** Every exported type, prop and function carries documentation, so your editor explains the API without a round trip to these docs.

## Documentation

- [Storybook](https://finra-ui.netlify.app) for every component, its props and live examples
- [Core](packages/core/README.md), [finance](packages/finance/README.md) and [icons](packages/icons/README.md) package guides
- [CONTRIBUTING.md](CONTRIBUTING.md) to set up the repo and send a change
- [SECURITY.md](SECURITY.md) to report a vulnerability

## License

[Apache-2.0](LICENSE). You may use finra-ui in commercial and closed-source work. You must keep the copyright and license notices, and pass on the [NOTICE](NOTICE) file, when you redistribute the code or a derivative of it. `finra-ui` is an independent project with no affiliation to the Financial Industry Regulatory Authority (FINRA).
