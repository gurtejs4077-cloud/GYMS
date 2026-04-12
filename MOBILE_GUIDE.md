# 📱 GymFlow Mobile Build Guide (APK)

This project is now pre-configured with **Capacitor** to turn your Next.js SaaS into a fully working Android APK.

## 🛠️ Prerequisites
1.  **Android Studio** installed on your machine.
2.  **Java JDK 17+** installed.

## 🚀 How to Build your APK

### 1. Prepare the Web Assets
Since Next.js with Server Actions requires a running server, the easiest way to package this as an APK is to point it to your hosted URL. 
If you want to test it locally:
1.  Open `capacitor.config.ts`.
2.  Add a server block pointing to your computer's IP:
    ```ts
    server: {
      url: 'http://192.168.1.XX:3000', // Your local IP
      cleartext: true
    }
    ```

### 2. Sync with Android
Run the following command in your terminal:
```bash
npx cap sync android
```

### 3. Open in Android Studio
Launch Android Studio and open the `android` folder located in your project root.

### 4. Generate APK
1.  Wait for Gradle to finish syncing.
2.  Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Android Studio will generate the `.apk` file. A notification will appear with a "Locate" link once it's done.

## 🌐 Production Strategy
For a professional SaaS APK:
1.  Deploy your Next.js app to a platform like **Vercel** or **AWS**.
2.  Update `capacitor.config.ts` to point the `server.url` to your production domain (e.g., `https://gymflow-saas.com/portal`).
3.  Re-run `npx cap sync android`.
4.  Re-build the APK.

This turns your app into a "Web Wrapper" APK which is perfectly optimized for both Trainer and Member views!
