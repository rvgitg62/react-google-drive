# **React Google Drive Example**

This example demonstrates how to integrate Google Drive API into a React application using the `useGoogleDrive` hook.

---

## **🚀 Installation**

You need to install the `react-google-drive` package before using this code.

```
npm install react-google-drive
```
or
```
yarn add react-google-drive
```

## 📌 Usage
### **1️⃣ Import and Setup the Hook**

The following example demonstrates how to use the `useGoogleDrive` hook to:

- ✅ Authenticate with Google Drive
- 📂 Pick a file from Google Drive
- 📁 Create a folder in Google Drive
- ⬆️ Upload a file to Google Drive
- 🔑 Change file permissions

```tsx
const {
    getToken,
    pickFile,
    createFolder,
    uploadFile,
    changePermission
} = useGoogleDrive({
    clientId: 'CLIENT_ID',
    apiKey: 'API_KEY',
    appId: 'APP_ID',
    scope: 'SCOPES'
});
```
