import { describe } from "vitest";

import { describeRefForwarding } from "../../test/refForwarding";
import { Badge } from "./Badge/Badge";
import { Banner } from "./Banner/Banner";
import { Button } from "./Button/Button";
import { ButtonGroup } from "./ButtonGroup/ButtonGroup";
import { Checkbox } from "./Checkbox/Checkbox";
import { Divider } from "./Divider/Divider";
import { FileDropZone } from "./FileDropZone/FileDropZone";
import { FormField } from "./FormField/FormField";
import { IconButton } from "./IconButton/IconButton";
import { Input } from "./Input/Input";
import { NumberInput } from "./NumberInput/NumberInput";
import { PillInput } from "./PillInput/PillInput";
import { Progress } from "./Progress/Progress";
import { RadioButton } from "./RadioButton/RadioButton";
import { Skeleton } from "./Skeleton/Skeleton";
import { Slider } from "./Slider/Slider";
import { Spinner } from "./Spinner/Spinner";
import { Switch } from "./Switch/Switch";
import { Textarea } from "./Textarea/Textarea";

/**
 * Components whose ref goes straight to their own root. The compound families
 * (Dialog, Menu, Popover, Select, Tabs, Tooltip) each need their provider
 * ancestor mounted, so they are covered in their own suites instead.
 */
describe("ref forwarding", () => {
  describeRefForwarding([
    { name: "Badge", render: (ref) => <Badge ref={ref}>badge</Badge>, expected: HTMLSpanElement },
    {
      name: "Banner",
      render: (ref) => <Banner ref={ref}>notice</Banner>,
      expected: HTMLDivElement,
    },
    {
      name: "Button",
      render: (ref) => <Button ref={ref}>press</Button>,
      expected: HTMLButtonElement,
    },
    { name: "ButtonGroup", render: (ref) => <ButtonGroup ref={ref} />, expected: HTMLDivElement },
    { name: "Checkbox", render: (ref) => <Checkbox ref={ref} />, expected: HTMLInputElement },
    { name: "Divider", render: (ref) => <Divider ref={ref} />, expected: HTMLHRElement },
    {
      name: "FileDropZone",
      render: (ref) => <FileDropZone ref={ref} />,
      expected: HTMLInputElement,
    },
    {
      name: "FormField",
      render: (ref) => (
        <FormField ref={ref} label="Quantity">
          <Input />
        </FormField>
      ),
      expected: HTMLDivElement,
    },
    {
      name: "IconButton",
      render: (ref) => <IconButton ref={ref} aria-label="close" icon={<svg />} />,
      expected: HTMLButtonElement,
    },
    { name: "Input", render: (ref) => <Input ref={ref} />, expected: HTMLInputElement },
    { name: "NumberInput", render: (ref) => <NumberInput ref={ref} />, expected: HTMLInputElement },
    { name: "PillInput", render: (ref) => <PillInput ref={ref} />, expected: HTMLInputElement },
    {
      name: "Progress",
      render: (ref) => <Progress ref={ref} value={50} label="Uploading" />,
      expected: HTMLDivElement,
    },
    { name: "RadioButton", render: (ref) => <RadioButton ref={ref} />, expected: HTMLInputElement },
    { name: "Skeleton", render: (ref) => <Skeleton ref={ref} />, expected: HTMLDivElement },
    { name: "Slider", render: (ref) => <Slider ref={ref} />, expected: HTMLInputElement },
    {
      name: "Spinner",
      render: (ref) => <Spinner ref={ref} label="Loading" />,
      expected: HTMLSpanElement,
    },
    { name: "Switch", render: (ref) => <Switch ref={ref} />, expected: HTMLInputElement },
    { name: "Textarea", render: (ref) => <Textarea ref={ref} />, expected: HTMLTextAreaElement },
  ]);
});
