package com.example.docsphere

import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.example.docsphere.ui.screens.MainScreen
import com.example.docsphere.ui.theme.DocSphereTheme
import com.example.docsphere.ui.viewmodel.DocSphereViewModel
import java.util.concurrent.Executor

class MainActivity : FragmentActivity() {

    private val viewModel: DocSphereViewModel by viewModels {
        DocSphereViewModel.factory(application)
    }

    private lateinit var executor: Executor
    private lateinit var biometricPrompt: BiometricPrompt
    private lateinit var promptInfo: BiometricPrompt.PromptInfo

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setupBiometrics()

        setContent {
            val isDarkTheme by viewModel.isDarkTheme.collectAsState()
            val systemDark = isSystemInDarkTheme()

            DocSphereTheme(darkTheme = isDarkTheme || systemDark) {
                MainScreen(
                    viewModel = viewModel,
                    onTriggerBiometric = { showBiometricPrompt() }
                )
            }
        }
    }

    private fun setupBiometrics() {
        executor = ContextCompat.getMainExecutor(this)
        biometricPrompt = BiometricPrompt(
            this,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    viewModel.unlockWithBiometric()
                    Toast.makeText(this@MainActivity, "Vault Unlocked via Biometric", Toast.LENGTH_SHORT).show()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    // Informational or cancelled by user
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(this@MainActivity, "Biometric authentication failed", Toast.LENGTH_SHORT).show()
                }
            }
        )

        promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock DocSphere Vault")
            .setSubtitle("Use your fingerprint or biometric credential")
            .setNegativeButtonText("Use PIN")
            .build()
    }

    private fun showBiometricPrompt() {
        val biometricManager = BiometricManager.from(this)
        when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                biometricPrompt.authenticate(promptInfo)
            }
            else -> {
                Toast.makeText(this, "Biometric not available or enrolled on this device", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
