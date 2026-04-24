import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function CommunityNotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/notifications");
  }, []);

  return null;
}
