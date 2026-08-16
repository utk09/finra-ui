import {
  type ChangeEventHandler,
  type FocusEventHandler,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type PointerEventHandler,
  type ReactNode,
  useId,
  useRef,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { useStore } from "../../hooks/useStore";
import {
  soundEngine as defaultSoundEngine,
  type SoundCue,
  type SoundEngine,
  type SoundSilentReason,
  soundSilentReason,
} from "../../logic/sound";
import {
  defaultSoundStatusMessages,
  percentToVolume,
  volumeToPercent,
} from "../../logic/soundSettings";
import { SliderBase } from "../Slider/Slider";
import { SwitchBase } from "../Switch/Switch";

const VOLUME_STEP = 1;

/** CSS class overrides injected by the styled layer. */
export interface SoundSettingsClassNames {
  label?: string;
  icon?: string;
  mute?: string;
  volume?: string;
  status?: string;
}

/**
 * Props for the mute control, shaped to spread onto `Switch` or `SwitchBase`.
 *
 * @remarks
 * `checked` is `true` when sound plays, so the switch announces "Sound, on"
 * and "Sound, off" through its native state rather than inverting its own
 * label. The inversion against `SoundState.muted` happens once, here, so no
 * consumer repeats it.
 */
export interface SoundMuteControlProps {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  /** Resolved {@link SoundSettingsBaseProps.soundLabel}. */
  "aria-label": string;
}

/**
 * Props for the volume control, shaped to spread onto `Slider` or
 * `SliderBase`.
 *
 * @remarks
 * The scale is whole percent, not the engine's 0..1 float: a range input's
 * value is a string, and percent is what the person reads and what
 * `aria-valuetext` announces. The conversion is `logic/soundSettings.ts` and
 * happens nowhere else.
 *
 * `onChange` commits every intermediate value to the engine, so the level is
 * live during a drag. `onPointerUp`, `onKeyUp` and `onBlur` are the commit
 * boundary and are the only things that preview. Spread all of them or
 * preview stops working.
 */
export interface SoundVolumeControlProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onPointerUp: PointerEventHandler<HTMLInputElement>;
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
  /** Resolved {@link SoundSettingsBaseProps.volumeLabel}. */
  "aria-label": string;
  /** {@link SoundSettingsBaseProps.formatVolume} applied to the current volume. */
  "aria-valuetext": string;
}

/** Engine state the icon reflects. */
export interface SoundIconState {
  muted: boolean;
  volume: number;
  silentReason: SoundSilentReason | null;
}

function defaultFormatVolume(volume: number): string {
  return `${volumeToPercent(volume)}%`;
}

function defaultRenderMute(props: SoundMuteControlProps): ReactNode {
  return <SwitchBase {...props} />;
}

function defaultRenderVolume(props: SoundVolumeControlProps): ReactNode {
  return <SliderBase {...props} />;
}

/**
 * Props for the unstyled sound settings control.
 *
 * @remarks
 * A mute switch and a volume slider bound to a {@link SoundEngine}. The engine
 * owns the state, so there is no `value`/`onChange` pair and no
 * `defaultValue`: a second source of truth for a process-wide setting is a
 * bug, not a feature. Read the same state anywhere else with
 * `useStore(engine.store, …)`.
 *
 * Ships no CSS and no icons. Supply `classNames` and `renderIcon`, or use the
 * styled `SoundSettings`, which supplies both.
 */
export interface SoundSettingsBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onVolumeChange"> {
  /**
   * Engine this control reflects and changes.
   *
   * @remarks
   * Injected so a test, a story, or an application that already owns an
   * engine can bind to its own rather than the process-wide one. Two controls
   * bound to the same engine stay in step, because the engine's store is the
   * only state.
   *
   * @defaultValue the shared `soundEngine`
   */
  engine?: SoundEngine;
  /**
   * Group label, rendered above the controls and wired as the group's
   * accessible name.
   *
   * @remarks
   * Pass `null` to render no label element, in which case supply an
   * `aria-label` if surrounding text does not already name the group.
   *
   * @defaultValue `"Sound settings"`
   */
  label?: string | null;
  /**
   * Name for the sound switch. Reaches `renderMute` as `aria-label`; the
   * styled `SoundSettings` renders it as the switch's visible text instead.
   *
   * @remarks
   * Names the thing being switched, not the action, so `role="switch"`
   * supplies the state and the control announces "Sound, on" or "Sound,
   * off". A label phrased as an instruction would announce "Play sounds,
   * off", which reads as an instruction that has been declined rather than
   * as a state.
   *
   * @defaultValue `"Sound"`
   */
  soundLabel?: string;
  /**
   * Name for the volume slider. Reaches `renderVolume` as `aria-label`; the
   * styled `SoundSettings` renders it as the slider's visible text instead.
   *
   * @defaultValue `"Volume"`
   */
  volumeLabel?: string;
  /**
   * Format the volume for assistive technology, as `aria-valuetext`.
   *
   * @remarks
   * A prop because percent formatting is locale-dependent. `aria-valuenow` is
   * untouched and always present, because some assistive technology ignores
   * `aria-valuetext` and reports the raw number.
   *
   * @defaultValue `` (volume) => `${Math.round(volume * 100)}%` ``
   */
  formatVolume?: (volume: number) => string;
  /**
   * Messages explaining why nothing would be heard, keyed by the engine's own
   * reason.
   *
   * @remarks
   * Merged over the defaults, so a partial record replaces only the keys it
   * names and `null` for a key renders nothing for that state. There is no
   * default for `"muted"` or `"volume"`, because the switch and the slider
   * already say it.
   *
   * Rendered into an always-mounted polite live region. Always mounted on
   * purpose: a live region added to the DOM at the same moment as its content
   * is unreliably announced.
   *
   * @defaultValue see `defaultSoundStatusMessages`
   */
  statusMessages?: Partial<Record<SoundSilentReason, ReactNode>>;
  /**
   * Cue played to preview the level being set.
   *
   * @remarks
   * Plays on commit, never on input: React's `onChange` for a range input is
   * the DOM `input` event and fires per pixel of a drag, which would be a
   * stream of cues against an engine that caps concurrency at three. Commit
   * is pointer release, key release, or blur, plus the moment the switch is
   * flipped to audible.
   *
   * The unmute preview is also the gesture that resumes a suspended audio
   * context, which is what clears the `"suspended"` message.
   *
   * Pass `null` for a silent control.
   *
   * @defaultValue `"beep"`
   */
  previewCue?: SoundCue | null;
  /**
   * Disable both controls.
   *
   * @remarks
   * The volume slider stays enabled while muted. Setting a level before
   * unmuting is a normal thing to want, and a disabled control is harder to
   * reach with assistive technology.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
  /** Fired after this control changes mute. This control only. */
  onMutedChange?: (muted: boolean) => void;
  /** Fired after this control changes volume, with the engine's 0..1 float. This control only. */
  onVolumeChange?: (volume: number) => void;
  /**
   * Leading icon. The unstyled layer ships none, so nothing renders until
   * this returns a node; the styled layer injects a speaker glyph.
   *
   * @remarks
   * Takes the whole state rather than `muted` alone, so the icon can tell the
   * truth in every silent state: the styled default shows the crossed
   * speaker whenever `silentReason` is non-null, which covers muted, zero
   * volume, suspended and unsupported without inventing a threshold for
   * "low".
   */
  renderIcon?: (state: SoundIconState) => ReactNode;
  /** Render the mute control. Defaults to `SwitchBase`. */
  renderMute?: (props: SoundMuteControlProps) => ReactNode;
  /** Render the volume control. Defaults to `SliderBase`. */
  renderVolume?: (props: SoundVolumeControlProps) => ReactNode;
  /** CSS class overrides injected by the styled layer. */
  classNames?: SoundSettingsClassNames;
}

/**
 * Unstyled sound settings control - a mute switch and a volume slider bound
 * to a {@link SoundEngine}.
 *
 * @see {@link SoundSettingsBaseProps}
 */
export const SoundSettingsBase = forwardRef<HTMLDivElement, SoundSettingsBaseProps>(
  (
    {
      engine = defaultSoundEngine,
      label = "Sound settings",
      soundLabel = "Sound",
      volumeLabel = "Volume",
      formatVolume = defaultFormatVolume,
      statusMessages,
      previewCue = "beep",
      disabled = false,
      onMutedChange,
      onVolumeChange,
      renderIcon,
      renderMute = defaultRenderMute,
      renderVolume = defaultRenderVolume,
      classNames: cn,
      ...props
    },
    ref,
  ) => {
    const labelId = useId();
    const state = useStore(engine.store);
    const percent = volumeToPercent(state.volume);
    // Bookkeeping only, never rendered: records whether this control changed
    // the volume since its last commit, so releasing a slider that never moved
    // stays silent. Tracking the interaction rather than the value is what
    // keeps a change made elsewhere in the application out of it - comparing
    // percentages would preview a level this control never set.
    const changedSinceCommitRef = useRef(false);

    const handleMuteChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      const muted = !event.target.checked;
      engine.setMuted(muted);
      onMutedChange?.(muted);
      // Muting is not an occasion for a noise; only unmuting previews. The
      // engine already updated before this runs, so a throwing `play` cannot
      // affect the interaction - only the preview is lost.
      if (!muted && previewCue) {
        try {
          engine.play(previewCue);
        } catch {
          // Swallowed on purpose.
        }
      }
    };

    const handleVolumeChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      const volume = percentToVolume(Number(event.target.value));
      changedSinceCommitRef.current = true;
      engine.setVolume(volume);
      onVolumeChange?.(volume);
    };

    const commitVolumePreview = () => {
      if (previewCue && changedSinceCommitRef.current) {
        try {
          engine.play(previewCue);
        } catch {
          // Swallowed on purpose.
        }
      }
      changedSinceCommitRef.current = false;
    };

    const reason = soundSilentReason(state);
    const messages = { ...defaultSoundStatusMessages, ...statusMessages };
    const statusContent = reason ? messages[reason] : null;
    const icon = renderIcon?.({ muted: state.muted, volume: state.volume, silentReason: reason });

    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={label === null ? undefined : labelId}
        {...{ [FINRA_UI_ATTR]: componentIds.soundSettings }}
        {...props}>
        {label === null ? null : (
          <span
            id={labelId}
            {...{ [FINRA_UI_ATTR]: componentIds.soundSettingsLabel }}
            className={cn?.label}>
            {label}
          </span>
        )}
        {icon === undefined || icon === null ? null : (
          <span
            {...{ [FINRA_UI_ATTR]: componentIds.soundSettingsIcon }}
            className={cn?.icon}
            aria-hidden="true">
            {icon}
          </span>
        )}
        <div {...{ [FINRA_UI_ATTR]: componentIds.soundSettingsMute }} className={cn?.mute}>
          {renderMute({
            checked: !state.muted,
            onChange: handleMuteChange,
            disabled,
            "aria-label": soundLabel,
          })}
        </div>
        <div {...{ [FINRA_UI_ATTR]: componentIds.soundSettingsVolume }} className={cn?.volume}>
          {renderVolume({
            value: percent,
            min: 0,
            max: 100,
            step: VOLUME_STEP,
            onChange: handleVolumeChange,
            onPointerUp: commitVolumePreview,
            onKeyUp: commitVolumePreview,
            onBlur: commitVolumePreview,
            disabled,
            "aria-label": volumeLabel,
            "aria-valuetext": formatVolume(state.volume),
          })}
        </div>
        <div
          role="status"
          aria-live="polite"
          {...{ [FINRA_UI_ATTR]: componentIds.soundSettingsStatus }}
          className={cn?.status}>
          {statusContent}
        </div>
      </div>
    );
  },
);

SoundSettingsBase.displayName = "SoundSettingsBase";
