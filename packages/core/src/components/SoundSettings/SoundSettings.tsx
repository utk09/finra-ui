import { VolumeIcon, VolumeOffIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import {
  type SoundIconState,
  SoundSettingsBase,
  type SoundSettingsBaseProps,
} from "../../unstyled/SoundSettings/SoundSettings";
import { Slider } from "../Slider/Slider";
import { Switch } from "../Switch/Switch";
import styles from "./SoundSettings.module.scss";

function defaultRenderIcon(state: SoundIconState): ReactNode {
  return state.silentReason ? <VolumeOffIcon /> : <VolumeIcon />;
}

/**
 * Props for the styled sound settings control.
 *
 * @remarks
 * Supplies the SCSS module, the `Switch` and `Slider` the base renders
 * through its render props, and the speaker icons. `soundLabel` and
 * `volumeLabel` render as visible text beside each control here, which the
 * unstyled base cannot do. Sizing is `data-density` on an ancestor plus a CSS
 * rule against `[data-finra-ui="sound-settings"]`.
 *
 * The root is a two-column grid: the icon takes the first column and the mute
 * switch the second, so the speaker glyph sits on the switch's line, and the
 * label, the slider and the status region each span both. Redeclare the grid
 * against `[data-finra-ui="sound-settings"]` and place the part ids yourself to
 * change it; consumer CSS wins over `@layer finra-ui`.
 */
export interface SoundSettingsProps
  extends Omit<
    SoundSettingsBaseProps,
    "classNames" | "renderMute" | "renderVolume" | "renderIcon"
  > {
  /**
   * Leading icon. Pass `() => null` to render none.
   *
   * @remarks
   * Takes the whole state rather than `muted` alone, so the icon can tell the
   * truth in every silent state: the default shows the crossed speaker
   * whenever `silentReason` is non-null, which covers muted, zero volume,
   * suspended and unsupported without inventing a threshold for "low".
   *
   * @defaultValue a speaker glyph, crossed out whenever `silentReason` is non-null
   */
  renderIcon?: (state: SoundIconState) => ReactNode;
  /** Additional CSS class for the root. */
  className?: string;
}

/**
 * A mute switch and a volume slider bound to the sound engine.
 *
 * @see {@link SoundSettingsProps}
 */
export const SoundSettings = forwardRef<HTMLDivElement, SoundSettingsProps>(
  ({ className, renderIcon = defaultRenderIcon, ...rest }, ref) => {
    return (
      <SoundSettingsBase
        ref={ref}
        className={clsx(styles.soundSettings, className)}
        classNames={{
          label: styles.label,
          icon: styles.icon,
          mute: styles.mute,
          volume: styles.volume,
          status: styles.status,
        }}
        renderIcon={renderIcon}
        // The name arrives as `aria-label`, which is all the unstyled bases can
        // carry. `Switch` and `Slider` each root on their own `<label>`, so here
        // it becomes visible text and the accessible name comes from that text -
        // one name, on screen and in the accessibility tree. Passing both would
        // leave `aria-label` silently overriding what the person can read.
        renderMute={({ "aria-label": name, ...props }) => <Switch {...props} label={name} />}
        renderVolume={({ "aria-label": name, ...props }) => <Slider {...props} label={name} />}
        {...rest}
      />
    );
  },
);

SoundSettings.displayName = "SoundSettings";
