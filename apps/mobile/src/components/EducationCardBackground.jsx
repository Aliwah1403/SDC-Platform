import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

// Photo background for education cards, backed by Supabase Storage
// (bucket: education-images, uploaded via the dashboard — see
// utils/educationTopicImages.js). If a topic has no file uploaded yet, or
// the request fails for any reason, this silently falls back to a solid
// color rather than showing a broken image.
export function EducationCardBackground({ imageUrl, fallbackColor = "#781D11", style, children }) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl && !failed;

  return (
    <View style={[{ backgroundColor: fallbackColor }, style]}>
      {showImage && (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </View>
  );
}
