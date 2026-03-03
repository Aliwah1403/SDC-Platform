import 'react-native-url-polyfill/auto';
import './src/__create/polyfills';
global.Buffer = require('buffer').Buffer;

import '@expo/metro-runtime';
import { AppRegistry } from 'react-native';
import { DeviceErrorBoundaryWrapper } from './__create/DeviceErrorBoundary';
import AnythingMenu from './src/__create/anything-menu';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import App from './entrypoint'


if (__DEV__ || process.env.EXPO_PUBLIC_CREATE_ENV === 'DEVELOPMENT') {
  AppRegistry.setWrapperComponentProvider(() => ({ children }) => {
    return (
      <>
        <DeviceErrorBoundaryWrapper>
          {children}
        </DeviceErrorBoundaryWrapper>
        <AnythingMenu />
      </>
    );
  });
}
renderRootComponent(App);
