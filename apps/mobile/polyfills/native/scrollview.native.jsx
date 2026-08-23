import React from 'react';
import RNScrollView from 'react-native/Libraries/Components/ScrollView/ScrollView';

const ScrollView = React.forwardRef((props, ref) => {
  const {
    keyboardDismissMode = 'on-drag',
    keyboardShouldPersistTaps = 'handled',
    ...scrollViewProps
  } = props;

  return (
    <RNScrollView
      ref={ref}
      {...scrollViewProps}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    />
  );
});

ScrollView.displayName = 'ScrollView';
// Modal resets this context so nested scroll views do not inherit an outer one.
ScrollView.Context = RNScrollView.Context;

export default ScrollView;
