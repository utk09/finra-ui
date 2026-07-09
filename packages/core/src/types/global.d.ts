declare module "*.scss";
declare module "*.css";

declare module "*.module.scss" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module "@utk09/finra-ui/styles";
declare module "@utk09/finra-ui-finance/styles";

// Minimal ambient for the dev-only NODE_ENV guard (avoids pulling @types/node
// into a browser library). Bundlers replace `process.env.NODE_ENV` at build.
declare const process: { env: { NODE_ENV?: string } };
