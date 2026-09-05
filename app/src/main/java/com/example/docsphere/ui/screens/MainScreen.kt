package com.example.docsphere.ui.screens

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.docsphere.data.model.DocumentEntity
import com.example.docsphere.ui.components.DocSphereTopAppBar
import com.example.docsphere.ui.theme.TealPrimary
import com.example.docsphere.ui.viewmodel.DocSphereViewModel
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: DocSphereViewModel,
    onTriggerBiometric: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var activeTab by remember { mutableStateOf("dashboard") }

    val isVaultLocked by viewModel.isVaultLocked.collectAsState()
    val isPinSet by viewModel.isPinSet.collectAsState()
    val pinError by viewModel.pinError.collectAsState()
    val lockoutSeconds by viewModel.lockoutSeconds.collectAsState()
    val customMembers by viewModel.customMembers.collectAsState()

    // Modals state
    var selectedDocForDetail by remember { mutableStateOf<DocumentEntity?>(null) }
    var selectedDocForEdit by remember { mutableStateOf<DocumentEntity?>(null) }
    var selectedDocForQr by remember { mutableStateOf<DocumentEntity?>(null) }
    var showAddSheet by remember { mutableStateOf(false) }
    var showPinSetup by remember { mutableStateOf(false) }

    val detailSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val addEditSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val qrSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Voice recognition launcher
    val voiceLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.getOrNull(0)
            if (!spokenText.isNullOrBlank()) {
                viewModel.setSearchQuery(spokenText)
                activeTab = "documents"
                Toast.makeText(context, "Voice Search: \"$spokenText\"", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val startVoiceSearch = {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Say document name or holder...")
        }
        try {
            voiceLauncher.launch(intent)
        } catch (_: Exception) {
            Toast.makeText(context, "Voice input not available on this device", Toast.LENGTH_SHORT).show()
        }
    }

    // If Vault is locked, show Security PIN Screen first
    if (isVaultLocked) {
        SecurityPinScreen(
            title = "Unlock DocSphere Vault",
            subtitle = "Enter your security PIN to access documents",
            errorMessage = pinError,
            lockoutSeconds = lockoutSeconds,
            onPinEntered = { pin ->
                viewModel.verifyPin(pin)
            },
            onBiometricClick = onTriggerBiometric
        )
        return
    }

    // Pin Setup overlay
    if (showPinSetup) {
        var setupStep by remember { mutableStateOf("enter") }
        var firstPin by remember { mutableStateOf("") }
        var setupError by remember { mutableStateOf<String?>(null) }

        SecurityPinScreen(
            title = if (setupStep == "enter") "Create Security PIN" else "Confirm Your PIN",
            subtitle = if (setupStep == "enter") "Enter a 4-digit PIN for your vault" else "Re-enter the same 4-digit PIN",
            errorMessage = setupError,
            onPinEntered = { pin ->
                if (setupStep == "enter") {
                    firstPin = pin
                    setupStep = "confirm"
                    setupError = null
                } else {
                    if (pin == firstPin) {
                        viewModel.setupPin(pin)
                        showPinSetup = false
                        Toast.makeText(context, "PIN successfully configured!", Toast.LENGTH_SHORT).show()
                    } else {
                        setupError = "PINs do not match. Try again."
                        setupStep = "enter"
                        firstPin = ""
                    }
                }
            },
            onCancel = { showPinSetup = false }
        )
        return
    }

    Scaffold(
        topBar = {
            DocSphereTopAppBar(
                title = "DocSphere",
                isPinSet = isPinSet,
                onLockVault = { viewModel.lockVault() },
                onOpenSettings = { activeTab = "settings" }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = activeTab == "dashboard",
                    onClick = { activeTab = "dashboard" },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Home") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = TealPrimary),
                    modifier = Modifier.testTag("nav_dashboard")
                )
                NavigationBarItem(
                    selected = activeTab == "documents",
                    onClick = { activeTab = "documents" },
                    icon = { Icon(Icons.Default.Description, contentDescription = "Documents") },
                    label = { Text("Vault") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = TealPrimary),
                    modifier = Modifier.testTag("nav_documents")
                )
                NavigationBarItem(
                    selected = activeTab == "scan",
                    onClick = { activeTab = "scan" },
                    icon = { Icon(Icons.Default.CameraAlt, contentDescription = "Scan") },
                    label = { Text("Scan") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = TealPrimary),
                    modifier = Modifier.testTag("nav_scan")
                )
                NavigationBarItem(
                    selected = activeTab == "family",
                    onClick = { activeTab = "family" },
                    icon = { Icon(Icons.Default.People, contentDescription = "Family") },
                    label = { Text("Family") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = TealPrimary),
                    modifier = Modifier.testTag("nav_family")
                )
                NavigationBarItem(
                    selected = activeTab == "settings",
                    onClick = { activeTab = "settings" },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") },
                    colors = NavigationBarItemDefaults.colors(selectedIconColor = TealPrimary),
                    modifier = Modifier.testTag("nav_settings")
                )
            }
        },
        floatingActionButton = {
            if (activeTab == "dashboard" || activeTab == "documents") {
                FloatingActionButton(
                    onClick = { showAddSheet = true },
                    containerColor = TealPrimary,
                    contentColor = androidx.compose.ui.graphics.Color.White,
                    modifier = Modifier.testTag("main_add_document_fab")
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Add Document")
                }
            }
        },
        modifier = modifier
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (activeTab) {
                "dashboard" -> DashboardScreen(
                    viewModel = viewModel,
                    onNavigateToDocuments = { activeTab = "documents" },
                    onNavigateToScan = { activeTab = "scan" },
                    onSelectDocument = { doc -> selectedDocForDetail = doc },
                    onShowQr = { doc -> selectedDocForQr = doc },
                    onStartVoiceSearch = startVoiceSearch
                )
                "documents" -> DocumentsScreen(
                    viewModel = viewModel,
                    onSelectDocument = { doc -> selectedDocForDetail = doc },
                    onEditDocument = { doc -> selectedDocForEdit = doc },
                    onDeleteDocument = { doc -> viewModel.deleteDocument(doc) },
                    onShowQr = { doc -> selectedDocForQr = doc },
                    onAddNew = { showAddSheet = true }
                )
                "scan" -> ScannerScreen(
                    onSaveScannedDocument = { doc ->
                        viewModel.addDocument(doc) {
                            Toast.makeText(context, "Scanned document saved to vault!", Toast.LENGTH_SHORT).show()
                            activeTab = "documents"
                        }
                    }
                )
                "family" -> FamilyMembersScreen(
                    viewModel = viewModel,
                    onOpenFolder = { folderId ->
                        viewModel.setSelectedFolder(folderId)
                        activeTab = "documents"
                    }
                )
                "settings" -> SettingsScreen(
                    viewModel = viewModel,
                    onOpenPinSetup = { showPinSetup = true }
                )
            }
        }
    }

    // Detail Dialog Sheet
    selectedDocForDetail?.let { doc ->
        DocumentDetailDialog(
            document = doc,
            sheetState = detailSheetState,
            onDismiss = { selectedDocForDetail = null },
            onEdit = {
                selectedDocForEdit = doc
                selectedDocForDetail = null
            },
            onDelete = {
                viewModel.deleteDocument(doc)
                selectedDocForDetail = null
            },
            onShowQr = {
                selectedDocForQr = doc
                selectedDocForDetail = null
            }
        )
    }

    // Add / Edit Dialog Sheet
    if (showAddSheet || selectedDocForEdit != null) {
        val editingDoc = selectedDocForEdit
        AddEditDocumentSheet(
            document = editingDoc,
            sheetState = addEditSheetState,
            customFolders = customMembers,
            onDismiss = {
                showAddSheet = false
                selectedDocForEdit = null
            },
            onSave = { savedDoc ->
                if (editingDoc == null) {
                    viewModel.addDocument(savedDoc) {
                        Toast.makeText(context, "Document added to vault", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    viewModel.updateDocument(savedDoc) {
                        Toast.makeText(context, "Document updated", Toast.LENGTH_SHORT).show()
                    }
                }
                showAddSheet = false
                selectedDocForEdit = null
            }
        )
    }

    // QR Passcard Dialog Sheet
    selectedDocForQr?.let { doc ->
        QrPasscardDialog(
            document = doc,
            sheetState = qrSheetState,
            onDismiss = { selectedDocForQr = null }
        )
    }
}
