import React from 'react';
import { Keyboard } from 'react-native';
import RNTextInput from 'react-native/Libraries/Components/TextInput/TextInput';

const TextInput = React.forwardRef((props, ref) => {
  const {
    multiline = false,
    onSubmitEditing,
    placeholderTextColor = 'black',
    returnKeyType,
    ...inputProps
  } = props;

  const handleSubmitEditing = React.useCallback(
    (event) => {
      // Some keyboards do not reliably blur a controlled input after submit.
      // Dismiss first so save/search handlers cannot leave it stranded onscreen.
      Keyboard.dismiss();
      onSubmitEditing?.(event);
    },
    [onSubmitEditing]
  );

  return (
    <RNTextInput
      ref={ref}
      {...inputProps}
      multiline={multiline}
      onSubmitEditing={handleSubmitEditing}
      placeholderTextColor={placeholderTextColor}
      returnKeyType={returnKeyType ?? (multiline ? undefined : 'done')}
    />
  );
});

TextInput.displayName = 'TextInput';
// Preserve the React Native static API for callers that need the focused host.
TextInput.State = RNTextInput.State;

export default TextInput;
