const fs = require("fs");
const path = require("path");

const gradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");
let content = fs.readFileSync(gradlePath, "utf8");

// Signing-Config direkt nach "android {" einfügen
const signingBlock = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`;

content = content.replace(/android\s*{/, (match) => `${match}\n${signingBlock}`);

// Release-Build auf den neuen Signing-Key umbiegen (Standard-Template signiert
// Release sonst mit dem Debug-Key)
content = content.replace(/signingConfig signingConfigs\.debug/, "signingConfig signingConfigs.release");

fs.writeFileSync(gradlePath, content);
console.log("build.gradle erfolgreich für Release-Signing gepatcht.");
