package com.example.docsphere.data.preferences

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest

class SecurityPreferences(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("docsphere_security_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
        private const val KEY_FAILED_ATTEMPTS = "failed_attempts"
        private const val KEY_LOCKOUT_UNTIL = "lockout_until"
        private const val KEY_CUSTOM_MEMBERS = "custom_members"
        private const val KEY_DARK_THEME = "dark_theme"
    }

    fun isPinSet(): Boolean {
        return prefs.getString(KEY_PIN_HASH, null) != null
    }

    fun setPin(pin: String) {
        val hash = hashPin(pin)
        prefs.edit().putString(KEY_PIN_HASH, hash).apply()
        resetFailedAttempts()
    }

    fun removePin() {
        prefs.edit().remove(KEY_PIN_HASH).apply()
        resetFailedAttempts()
    }

    fun verifyPin(pin: String): Boolean {
        val storedHash = prefs.getString(KEY_PIN_HASH, null) ?: return true
        val inputHash = hashPin(pin)
        val matches = storedHash == inputHash
        if (matches) {
            resetFailedAttempts()
        } else {
            incrementFailedAttempts()
        }
        return matches
    }

    fun isBiometricEnabled(): Boolean {
        return prefs.getBoolean(KEY_BIOMETRIC_ENABLED, true)
    }

    fun setBiometricEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_BIOMETRIC_ENABLED, enabled).apply()
    }

    fun getFailedAttempts(): Int {
        return prefs.getInt(KEY_FAILED_ATTEMPTS, 0)
    }

    private fun incrementFailedAttempts() {
        val attempts = getFailedAttempts() + 1
        val editor = prefs.edit().putInt(KEY_FAILED_ATTEMPTS, attempts)
        if (attempts >= 5) {
            // Lock out for 30 seconds
            val lockout = System.currentTimeMillis() + 30_000L
            editor.putLong(KEY_LOCKOUT_UNTIL, lockout)
        }
        editor.apply()
    }

    private fun resetFailedAttempts() {
        prefs.edit().putInt(KEY_FAILED_ATTEMPTS, 0).remove(KEY_LOCKOUT_UNTIL).apply()
    }

    fun getLockoutRemainingSeconds(): Long {
        val until = prefs.getLong(KEY_LOCKOUT_UNTIL, 0L)
        val now = System.currentTimeMillis()
        return if (until > now) (until - now) / 1000L else 0L
    }

    fun getCustomFamilyMembers(): List<String> {
        val str = prefs.getString(KEY_CUSTOM_MEMBERS, "") ?: ""
        if (str.isBlank()) return emptyList()
        return str.split("::").filter { it.isNotBlank() }
    }

    fun addCustomFamilyMember(name: String) {
        val current = getCustomFamilyMembers().toMutableList()
        if (!current.contains(name)) {
            current.add(name)
            prefs.edit().putString(KEY_CUSTOM_MEMBERS, current.joinToString("::")).apply()
        }
    }

    fun removeCustomFamilyMember(name: String) {
        val current = getCustomFamilyMembers().toMutableList()
        current.remove(name)
        prefs.edit().putString(KEY_CUSTOM_MEMBERS, current.joinToString("::")).apply()
    }

    fun isDarkTheme(): Boolean {
        return prefs.getBoolean(KEY_DARK_THEME, false)
    }

    fun setDarkTheme(dark: Boolean) {
        prefs.edit().putBoolean(KEY_DARK_THEME, dark).apply()
    }

    private fun hashPin(pin: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val bytes = md.digest("DocSphereSalt_$pin".toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
