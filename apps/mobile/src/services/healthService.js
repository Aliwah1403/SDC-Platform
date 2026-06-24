import { Platform } from "react-native";
import * as healthKit from "./healthKitService";
import * as healthConnect from "./healthConnectService";

const svc = Platform.OS === "ios" ? healthKit : healthConnect;

export const isHKAvailable = (...args) => svc.isHKAvailable(...args);
export const checkExistingHKAuthorization = (...args) => svc.checkExistingHKAuthorization(...args);
export const requestHKAuthorization = (...args) => svc.requestHKAuthorization(...args);
export const fetchHealthKitRange = (...args) => svc.fetchHealthKitRange(...args);
export const writeDailyLog = (...args) => svc.writeDailyLog(...args);
export const writeBodyStats = (...args) => svc.writeBodyStats(...args);
export const fetchWorkoutsForDate = (...args) => svc.fetchWorkoutsForDate(...args);
export const setupBackgroundDelivery = (...args) => svc.setupBackgroundDelivery(...args);
export const checkAlerts = (...args) => svc.checkAlerts(...args);
