// 純 JVM 單元測試：只編譯 src/android/core（不依賴 Android SDK）。
// 執行：cd iGoHealth/native/cordova-plugin-igh-ble/test/android-jvm && gradle test
plugins {
    kotlin("jvm") version "2.0.21"
}

repositories { mavenCentral() }



sourceSets {
    main { kotlin.srcDir("../../src/android/core") }
}

dependencies {
    testImplementation(kotlin("test"))
}

tasks.test { useJUnitPlatform() }
