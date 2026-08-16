import type { Meta, StoryObj } from "@storybook/react-vite";
import { createSoundEngine, type SoundEngine } from "@utk09/finra-ui";
import { SoundSettingsBase } from "@utk09/finra-ui/unstyled";
import { useEffect, useState } from "react";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof SoundSettingsBase> = {
  title: "Unstyled/SoundSettingsBase",
  component: SoundSettingsBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("div") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A real, unstubbed engine, already unmuted - flip the switch off and back on
 * to hear it. Released on unmount: browsers cap how many audio contexts a page
 * may hold, and a story visited repeatedly would accumulate one per visit
 * until the engine could build no more and reported itself unsupported.
 */
function useDemoEngine(volume = 0.4): SoundEngine {
  const [engine] = useState(() => {
    const built = createSoundEngine({ volume });
    built.setMuted(false);
    return built;
  });
  useEffect(() => () => engine.dispose(), [engine]);
  return engine;
}

/**
 * The base carries the store subscription, the ARIA group and the always-on
 * status region. Everything else - the icon, the track, the thumb - is the
 * consumer's: this story attaches its own rules to the part ids to make the
 * controls visible.
 */
export const Default: Story = {
  render: function Render() {
    const engine = useDemoEngine();
    return (
      <>
        <style>{`
          .sound-settings-demo [data-finra-ui="sound-settings"] {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-inline-size: 20rem;
          }
          .sound-settings-demo [data-finra-ui="sound-settings-volume"] input {
            inline-size: 100%;
          }
        `}</style>
        <div className="sound-settings-demo">
          <SoundSettingsBase engine={engine} />
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Sound settings" })).toBeInTheDocument();
    await expect(canvas.getByRole("switch")).toBeChecked();
    await expect(canvas.getByRole("slider")).toHaveValue("40");
    // No icon: the unstyled layer ships none until renderIcon returns one.
    await expect(canvas.queryByTestId("sound-settings-icon")).not.toBeInTheDocument();
  },
};
