import { Text as PaperText, TextProps } from "react-native-paper";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function Title(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleLarge" {...props} />;
}

export function TurnOnDiceHelp() {
  return (
    <>
      <Text>
        Pixels Dice are shipped with a pre-programmed user Profile and partial
        battery charge. They are ready to use right out of the box but for the
        best experience, charge for at least 1 hour before first use.
      </Text>
      <Title>To wake</Title>
      <Text>
        Open the charger by separating lid from base. The die inside will turn
        on within 5 seconds and play the rainbow "Hello World" greeting
        animation.
      </Text>
      <Title>To reboot</Title>
      <Text>
        Place die inside charger with charging coil face down/highest face up
        and close lid. Remove the lid after a few seconds and the die will wake,
        playing the "Hello World" greeting animation.
      </Text>
      <Title>To put to sleep</Title>
      <Text>
        Place die inside charger with charging coil face down/highest face up
        and close lid. As the lid's magnet remains in place over the die, it
        enters a sleep state.
      </Text>
      <Title>Note</Title>
      <Text>
        In place of a power button, Pixels Dice utilize a Hall Effect Sensor
        which is activated by magnets. Inside the lid of all charging cases, a
        small magnet is present to keep the dice in sleep mode when closed.
        Magnets such as those found in third party dice trays, game pieces, or
        otherwise may activate the sensor and cause Pixels Dice to reboot or go
        to sleep mid-roll. This will result in a broken connection between the
        dice and any connected device.
      </Text>
    </>
  );
}
