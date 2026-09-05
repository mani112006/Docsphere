package com.example.docsphere.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SheetState
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.docsphere.data.model.Categories
import com.example.docsphere.data.model.DocumentEntity
import com.example.docsphere.data.model.FamilyFolder
import com.example.docsphere.data.model.FamilyFolders
import com.example.docsphere.ui.theme.TealPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditDocumentSheet(
    document: DocumentEntity? = null,
    sheetState: SheetState,
    customFolders: List<String> = emptyList(),
    onDismiss: () -> Unit,
    onSave: (DocumentEntity) -> Unit
) {
    var name by remember(document) { mutableStateOf(document?.name ?: "") }
    var categoryId by remember(document) { mutableStateOf(document?.category ?: "aadhaar") }
    var holderName by remember(document) { mutableStateOf(document?.holderName ?: "") }
    var documentNumber by remember(document) { mutableStateOf(document?.documentNumber ?: "") }
    var issueDate by remember(document) { mutableStateOf(document?.issueDate ?: "") }
    var expiryDate by remember(document) { mutableStateOf(document?.expiryDate ?: "") }
    var familyFolder by remember(document) { mutableStateOf(document?.familyFolder ?: "my_vault") }
    var pinLocked by remember(document) { mutableStateOf(document?.pinLocked ?: false) }
    var description by remember(document) { mutableStateOf(document?.description ?: "") }

    var categoryExpanded by remember { mutableStateOf(false) }
    var folderExpanded by remember { mutableStateOf(false) }

    var nameError by remember { mutableStateOf(false) }

    val allFolders = listOf(
        FamilyFolder("my_vault", "My Vault"),
        FamilyFolder("father", "Father"),
        FamilyFolder("mother", "Mother"),
        FamilyFolder("spouse", "Spouse"),
        FamilyFolder("kids", "Kids")
    ) + customFolders.map { FamilyFolder(it.lowercase().replace(" ", "_"), it) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (document == null) "Add New Document" else "Edit Document",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                IconButton(onClick = onDismiss) {
                    Icon(imageVector = Icons.Default.Close, contentDescription = "Close")
                }
            }

            // Name Field
            OutlinedTextField(
                value = name,
                onValueChange = {
                    name = it
                    nameError = false
                },
                label = { Text("Document Name *") },
                placeholder = { Text("e.g. Aadhaar Card, Driving License") },
                isError = nameError,
                supportingText = if (nameError) {
                    { Text("Document name is required") }
                } else null,
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("doc_name_input")
            )

            // Category Dropdown
            ExposedDropdownMenuBox(
                expanded = categoryExpanded,
                onExpandedChange = { categoryExpanded = !categoryExpanded }
            ) {
                OutlinedTextField(
                    value = Categories.labelOf(categoryId),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Category") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                        .testTag("doc_category_dropdown")
                )
                ExposedDropdownMenu(
                    expanded = categoryExpanded,
                    onDismissRequest = { categoryExpanded = false }
                ) {
                    Categories.ALL.forEach { cat ->
                        DropdownMenuItem(
                            text = { Text(cat.label) },
                            onClick = {
                                categoryId = cat.id
                                categoryExpanded = false
                            }
                        )
                    }
                }
            }

            // Holder Name
            OutlinedTextField(
                value = holderName,
                onValueChange = { holderName = it },
                label = { Text("Holder Name") },
                placeholder = { Text("e.g. Full Name on Document") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("doc_holder_name_input")
            )

            // Document Number
            OutlinedTextField(
                value = documentNumber,
                onValueChange = { documentNumber = it },
                label = { Text("Document Number / ID") },
                placeholder = { Text("e.g. TN61 20250001671 or XXXX-XXXX-1234") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("doc_number_input")
            )

            // Family Folder Dropdown
            ExposedDropdownMenuBox(
                expanded = folderExpanded,
                onExpandedChange = { folderExpanded = !folderExpanded }
            ) {
                OutlinedTextField(
                    value = FamilyFolders.labelOf(familyFolder),
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Family Folder") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = folderExpanded) },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                        .testTag("doc_folder_dropdown")
                )
                ExposedDropdownMenu(
                    expanded = folderExpanded,
                    onDismissRequest = { folderExpanded = false }
                ) {
                    allFolders.forEach { f ->
                        DropdownMenuItem(
                            text = { Text(f.label) },
                            onClick = {
                                familyFolder = f.id
                                folderExpanded = false
                            }
                        )
                    }
                }
            }

            // Issue Date & Expiry Date Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = issueDate,
                    onValueChange = { issueDate = it },
                    label = { Text("Issue Date") },
                    placeholder = { Text("YYYY-MM-DD") },
                    singleLine = true,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("doc_issue_date_input")
                )
                OutlinedTextField(
                    value = expiryDate,
                    onValueChange = { expiryDate = it },
                    label = { Text("Expiry Date") },
                    placeholder = { Text("YYYY-MM-DD") },
                    singleLine = true,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("doc_expiry_date_input")
                )
            }

            // PIN Lock Protection Toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Require PIN to View",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "Lock this document specifically inside your vault",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Switch(
                    checked = pinLocked,
                    onCheckedChange = { pinLocked = it },
                    colors = SwitchDefaults.colors(checkedThumbColor = TealPrimary),
                    modifier = Modifier.testTag("doc_pin_lock_switch")
                )
            }

            // Notes / Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Notes / Extra Details") },
                placeholder = { Text("e.g. Registered address, renewal notes") },
                minLines = 2,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("doc_notes_input")
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Save Button
            Button(
                onClick = {
                    if (name.isBlank()) {
                        nameError = true
                        return@Button
                    }
                    val entity = (document ?: DocumentEntity(name = name, category = categoryId)).copy(
                        name = name.trim(),
                        category = categoryId,
                        holderName = holderName.trim().takeIf { it.isNotBlank() },
                        documentNumber = documentNumber.trim().takeIf { it.isNotBlank() },
                        issueDate = issueDate.trim().takeIf { it.isNotBlank() },
                        expiryDate = expiryDate.trim().takeIf { it.isNotBlank() },
                        familyFolder = familyFolder,
                        pinLocked = pinLocked,
                        description = description.trim().takeIf { it.isNotBlank() }
                    )
                    onSave(entity)
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("save_document_submit_btn")
            ) {
                Text(
                    text = if (document == null) "Save to Vault" else "Save Changes",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }
        }
    }
}
