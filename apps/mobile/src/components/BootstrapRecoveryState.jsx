import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function BootstrapRecoveryState({
  title = 'Hemo is offline',
  message = 'Reconnect to continue. Your saved data is still on this device.',
  onRetry,
  isRetrying = false,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRetrying ? 'Reconnecting…' : title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onRetry}
        disabled={isRetrying || !onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (isRetrying || !onRetry) && styles.buttonDisabled]}
      >
        {isRetrying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Try again</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FAF8F6',
  },
  title: { color: '#1F1B19', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  message: { color: '#6B625E', fontSize: 16, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  button: { backgroundColor: '#B64926', borderRadius: 24, marginTop: 24, minWidth: 130, paddingHorizontal: 24, paddingVertical: 12 },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
