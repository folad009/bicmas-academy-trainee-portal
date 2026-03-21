import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bicmas.academy",
  appName: "BICMAS Academy",
  webDir: "dist",
  android: {
    javaVersion: "20"
  }
};

export default config;
