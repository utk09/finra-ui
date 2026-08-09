/** Options for {@link parseClipboardMatrix}. */
export interface ClipboardMatrixOptions {
  /**
   * Field delimiter, as a single character.
   *
   * @remarks
   * Omit to detect: a tab anywhere outside a quoted field selects tab,
   * otherwise comma. Detection only ever chooses between those two, so a
   * semicolon-separated export has to say so. Those are common wherever the
   * comma is the decimal mark, which is exactly where guessing would be worst.
   *
   * A value that cannot work as a delimiter is ignored rather than thrown:
   * anything other than a single character, and the quote and line-ending
   * characters the grammar already reserves. The delimiter that was actually
   * used comes back on the result, so a caller passing a value from a settings
   * field can see that it was rejected.
   */
  delimiter?: string;
  /**
   * Treat the first row as headers.
   *
   * @defaultValue `false`
   */
  header?: boolean;
}

/** A clipboard payload read as a rectangle of cells. */
export interface ClipboardMatrix {
  /** One entry per row, each of equal length, padded with `""` where a row was short. */
  rows: readonly (readonly string[])[];
  /** Present only when `header` was set. */
  headers?: readonly string[];
  /** The delimiter actually used, whether supplied, rejected and replaced, or detected. */
  delimiter: string;
  /**
   * Rows whose raw field count differed from the widest row, indexed into
   * {@link ClipboardMatrix.rows}.
   *
   * @remarks
   * Reported rather than corrected. Padding makes the matrix usable, and the
   * caller still needs to know a row was short, because a row that lost its last
   * column silently is a row that pastes a blank over real data.
   */
  raggedRows: readonly number[];
}

const QUOTE = '"';

/** Characters the grammar reserves, so none of them can also be a delimiter. */
const RESERVED = new Set([QUOTE, "\n", "\r"]);

/**
 * The caller's delimiter, or `null` when it cannot be used.
 *
 * @remarks
 * Rejected rather than accepted-and-corrupting. A multi-character value would
 * silently match nothing and return every row as one cell, which looks like a
 * parser bug rather than a configuration one.
 */
function usableDelimiter(candidate: string | undefined): string | null {
  if (candidate === undefined) return null;
  // One UTF-16 code unit, because that is what the scanner compares against.
  // An astral character is two units and would never match, so it is rejected
  // here rather than silently ignored there.
  if (candidate.length !== 1) return null;
  return RESERVED.has(candidate) ? null : candidate;
}

/**
 * Whether a tab appears outside a quoted field.
 *
 * @remarks
 * Quote-aware because the alternative reads a delimiter out of a cell's
 * contents: `"a\tb",c` is one comma-separated row whose first cell contains a
 * tab, not a tab-separated row.
 */
function hasUnquotedTab(text: string): boolean {
  let inQuotes = false;
  let atFieldStart = true;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === QUOTE) {
        // A doubled quote inside a quoted field is an escaped quote, not the
        // end of the field, so it must not flip the state.
        if (text[index + 1] === QUOTE) index += 1;
        else inQuotes = false;
      }
      continue;
    }

    if (character === QUOTE && atFieldStart) {
      inQuotes = true;
      atFieldStart = false;
      continue;
    }

    if (character === "\t") return true;
    // Only the two characters detection chooses between can begin a field here,
    // since the delimiter is what this is deciding.
    atFieldStart = character === "," || character === "\n";
  }

  return false;
}

/**
 * Split normalised text into rows of raw fields.
 *
 * @remarks
 * A hand-rolled state machine rather than `split`, because both delimiters and
 * record separators are legal inside a quoted field. Excel and Google Sheets
 * both quote such cells, so `split("\t")` passes every single-line test and
 * fails on the first cell containing a line break.
 */
function splitRecords(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let atFieldStart = true;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === QUOTE) {
        if (text[index + 1] === QUOTE) {
          field += QUOTE;
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    // Only a quote that opens a field is syntax. Elsewhere it is content: a
    // cell reading `5" pipe` is a measurement, and treating that quote as an
    // opening one swallows every delimiter after it to the end of the paste.
    if (character === QUOTE && atFieldStart) {
      inQuotes = true;
      atFieldStart = false;
    } else if (character === delimiter) {
      row.push(field);
      field = "";
      atFieldStart = true;
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      atFieldStart = true;
    } else {
      field += character;
      atFieldStart = false;
    }
  }

  // An unterminated quote is malformed rather than fatal: whatever was
  // accumulated is still the caller's data, and dropping it would lose more
  // than it protects.
  row.push(field);
  rows.push(row);

  return rows;
}

/**
 * Read clipboard text as a rectangle of cells.
 *
 * @remarks
 * Carries no domain knowledge: every cell comes back as the string it was.
 * Turning those strings into numbers is a separate decision, because it depends
 * on conventions this layer has no business knowing about.
 *
 * Never throws. Malformed input is reported through
 * {@link ClipboardMatrix.raggedRows} or simply parsed as best it can be.
 *
 * @example
 * ```ts
 * parseClipboardMatrix('"Acme, Inc."\t100\nBeta\t250');
 * // rows: [["Acme, Inc.", "100"], ["Beta", "250"]], delimiter: "\t"
 *
 * parseClipboardMatrix("Acme;1.000,50", { delimiter: ";" });
 * // rows: [["Acme", "1.000,50"]], delimiter: ";"
 * ```
 */
export function parseClipboardMatrix(
  text: string,
  options: ClipboardMatrixOptions = {},
): ClipboardMatrix {
  const { delimiter: requested, header = false } = options;

  // Windows and old Mac line endings both reach the clipboard. Normalising up
  // front keeps the state machine to one record separator.
  const normalised = text.replace(/\r\n?/g, "\n");
  const delimiter = usableDelimiter(requested) ?? (hasUnquotedTab(normalised) ? "\t" : ",");

  const parsed = splitRecords(normalised, delimiter);

  // A trailing newline terminates the last record, it does not begin an empty
  // one. Only the final row is dropped, so a genuinely blank line in the middle
  // of a paste survives as a blank row.
  const last = parsed[parsed.length - 1];
  if (last.length === 1 && last[0] === "") parsed.pop();

  const width = parsed.reduce((widest, row) => Math.max(widest, row.length), 0);
  const padded = parsed.map((row) => [...row, ...Array<string>(width - row.length).fill("")]);

  // Empty input with `header` set has no header row to take. An empty list
  // still answers "was there a header?" the way the flag promises.
  const headers = header ? (padded.shift() ?? []) : undefined;
  const offset = header ? 1 : 0;

  const raggedRows = padded.flatMap((_, index) =>
    parsed[index + offset].length === width ? [] : [index],
  );

  return {
    rows: padded,
    ...(headers ? { headers } : {}),
    delimiter,
    raggedRows,
  };
}
