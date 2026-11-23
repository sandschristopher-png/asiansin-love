# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile


# --- Capacitor core ---
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}
-keep class com.getcapacitor.** { *; }

# --- WebView JavaScript interfaces ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Google Play Billing (@capgo/native-purchases) and AdMob (@capacitor-community/admob) ---
-keep class com.android.billingclient.api.** { *; }
-keep class ee.forgr.nativepurchases.** { *; }
-keep class com.google.android.gms.ads.** { *; }

# Quiet, harmless warnings from those dependencies
-dontwarn com.google.android.gms.**
-dontwarn okio.**
