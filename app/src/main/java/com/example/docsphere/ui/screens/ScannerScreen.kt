package com.example.docsphere.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.docsphere.data.model.DocumentEntity
import com.example.docsphere.ui.theme.GoldAccent
import com.example.docsphere.ui.theme.SuccessGreen
import com.example.docsphere.ui.theme.SuccessSoft
import com.example.docsphere.ui.theme.TealPrimary
import com.example.docsphere.ui.theme.TealSoft
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ScannerScreen(
    onSaveScannedDocument: (DocumentEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    var scanStep by remember { mutableStateOf("viewfinder") } // "viewfinder", "extracting", "review"
    var selectedPreset by remember { mutableStateOf("aadhaar") }

    // Extracted Fields State
    var docName by remember { mutableStateOf("Aadhaar Card") }
    var categoryId by remember { mutableStateOf("aadhaar") }
    var holderName by remember { mutableStateOf("S. MANIKANDAN") }
    var documentNumber by remember { mutableStateOf("8492 4819 0284") }
    var issueDate by remember { mutableStateOf("2020-03-15") }
    var expiryDate by remember { mutableStateOf("") }
    var familyFolder by remember { mutableStateOf("my_vault") }

    val coroutineScope = rememberCoroutineScope()

    val presets = listOf(
        Triple("aadhaar", "Aadhaar Card", "8492 4819 0284"),
        Triple("driving_licence", "Driving License", "TN61 20250001671"),
        Triple("pan", "PAN Card", "ABCDE1234F"),
        Triple("passport", "Passport", "V8920194"),
        Triple("ration", "Ration Card", "TN-PDS-84729104")
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Mode Header
        Text(
            text = "Smart Document Scanner",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = "Align document inside viewfinder to auto-extract fields",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (scanStep == "viewfinder" || scanStep == "extracting") {
            // Preset Selector Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                presets.take(3).forEach { (id, label, _) ->
                    FilterChip(
                        selected = selectedPreset == id,
                        onClick = {
                            selectedPreset = id
                            categoryId = id
                            docName = label
                        },
                        label = { Text(label, fontSize = 12.sp) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Viewfinder Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(340.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF0F1A1F))
                    .border(2.dp, if (scanStep == "extracting") GoldAccent else TealPrimary, RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                // Viewfinder Corner Guidelines
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .height(220.dp)
                        .border(2.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    if (scanStep == "extracting") {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = GoldAccent, modifier = Modifier.size(48.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Extracting details via Smart OCR...",
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.6f),
                                modifier = Modifier.size(44.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Position $docName here",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                // Flash & Grid controls overlay
                Row(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                ) {
                    IconButton(onClick = {}) {
                        Icon(imageVector = Icons.Default.FlashOn, contentDescription = "Flash", tint = Color.White)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Capture Button
            Button(
                onClick = {
                    scanStep = "extracting"
                    coroutineScope.launch {
                        delay(1200) // Simulated smart OCR analysis
                        val match = presets.find { it.first == selectedPreset }
                        if (match != null) {
                            docName = match.second
                            categoryId = match.first
                            documentNumber = match.third
                            when (selectedPreset) {
                                "driving_licence" -> {
                                    issueDate = "2025-04-21"
                                    expiryDate = "2046-12-10"
                                }
                                "passport" -> {
                                    issueDate = "2022-06-10"
                                    expiryDate = "2032-06-09"
                                }
                                else -> {
                                    issueDate = "2021-01-15"
                                    expiryDate = ""
                                }
                            }
                        }
                        scanStep = "review"
                    }
                },
                enabled = scanStep != "extracting",
                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("scan_capture_button")
            ) {
                Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Scan & Smart Extract", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        } else {
            // Review Extracted Details Step
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SuccessSoft),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = SuccessGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Fields Extracted Successfully! Review below:",
                        color = SuccessGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = docName,
                onValueChange = { docName = it },
                label = { Text("Document Name") },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("extracted_doc_name")
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = holderName,
                onValueChange = { holderName = it },
                label = { Text("Holder Name") },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("extracted_holder_name")
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = documentNumber,
                onValueChange = { documentNumber = it },
                label = { Text("Document Number / ID") },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("extracted_doc_number")
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = issueDate,
                    onValueChange = { issueDate = it },
                    label = { Text("Issue Date") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = expiryDate,
                    onValueChange = { expiryDate = it },
                    label = { Text("Expiry Date") },
                    placeholder = { Text("Optional") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = { scanStep = "viewfinder" },
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp)
                ) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Scan Again")
                }

                Button(
                    onClick = {
                        val doc = DocumentEntity(
                            name = docName.trim(),
                            category = categoryId,
                            holderName = holderName.trim(),
                            documentNumber = documentNumber.trim(),
                            issueDate = issueDate.trim().takeIf { it.isNotBlank() },
                            expiryDate = expiryDate.trim().takeIf { it.isNotBlank() },
                            familyFolder = familyFolder,
                            description = "Scanned using DocSphere Smart Scanner"
                        )
                        onSaveScannedDocument(doc)
                        scanStep = "viewfinder"
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .weight(1.5f)
                        .height(50.dp)
                        .testTag("save_scanned_doc_btn")
                ) {
                    Text("Save to Vault", fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
