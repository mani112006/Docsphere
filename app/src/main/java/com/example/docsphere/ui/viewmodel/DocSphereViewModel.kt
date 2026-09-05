package com.example.docsphere.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.docsphere.DocSphereApplication
import com.example.docsphere.data.model.Categories
import com.example.docsphere.data.model.DocumentEntity
import com.example.docsphere.data.model.ExpiryStatus
import com.example.docsphere.data.preferences.SecurityPreferences
import com.example.docsphere.data.repository.DocumentRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

data class DashboardStats(
    val total: Int = 0,
    val expiringSoon: Int = 0,
    val expired: Int = 0,
    val valid: Int = 0
)

class DocSphereViewModel(
    application: Application,
    private val repository: DocumentRepository,
    private val securityPreferences: SecurityPreferences
) : AndroidViewModel(application) {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _selectedFolder = MutableStateFlow("all")
    val selectedFolder = _selectedFolder.asStateFlow()

    private val _selectedCategory = MutableStateFlow<String?>(null)
    val selectedCategory = _selectedCategory.asStateFlow()

    private val _isPinSet = MutableStateFlow(securityPreferences.isPinSet())
    val isPinSet = _isPinSet.asStateFlow()

    private val _isVaultLocked = MutableStateFlow(securityPreferences.isPinSet())
    val isVaultLocked = _isVaultLocked.asStateFlow()

    private val _pinError = MutableStateFlow<String?>(null)
    val pinError = _pinError.asStateFlow()

    private val _lockoutSeconds = MutableStateFlow(securityPreferences.getLockoutRemainingSeconds())
    val lockoutSeconds = _lockoutSeconds.asStateFlow()

    private val _customMembers = MutableStateFlow(securityPreferences.getCustomFamilyMembers())
    val customMembers = _customMembers.asStateFlow()

    private val _isDarkTheme = MutableStateFlow(securityPreferences.isDarkTheme())
    val isDarkTheme = _isDarkTheme.asStateFlow()

    // All raw documents from Room
    val allDocuments = repository.allDocuments.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Filtered documents by search query, folder, and category
    val filteredDocuments: StateFlow<List<DocumentEntity>> = combine(
        allDocuments,
        _searchQuery,
        _selectedFolder,
        _selectedCategory
    ) { docs, query, folder, cat ->
        docs.filter { doc ->
            val matchesFolder = folder == "all" || doc.familyFolder.equals(folder, ignoreCase = true)
            val matchesCategory = cat == null || doc.category.equals(cat, ignoreCase = true)
            val matchesQuery = query.isBlank() ||
                    doc.name.contains(query, ignoreCase = true) ||
                    (doc.holderName?.contains(query, ignoreCase = true) == true) ||
                    (doc.documentNumber?.contains(query, ignoreCase = true) == true) ||
                    Categories.labelOf(doc.category).contains(query, ignoreCase = true)
            matchesFolder && matchesCategory && matchesQuery
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Dashboard Statistics
    val dashboardStats: StateFlow<DashboardStats> = allDocuments.combine(_searchQuery) { docs, _ ->
        var total = 0
        var expiringSoon = 0
        var expired = 0
        var valid = 0
        for (d in docs) {
            total++
            when (d.getExpiryStatus()) {
                ExpiryStatus.EXPIRED -> expired++
                ExpiryStatus.EXPIRING_SOON -> expiringSoon++
                ExpiryStatus.VALID -> valid++
                ExpiryStatus.NONE -> {}
            }
        }
        DashboardStats(total, expiringSoon, expired, valid)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DashboardStats()
    )

    // Documents needing renewal attention
    val expiringDocuments: StateFlow<List<DocumentEntity>> = allDocuments.combine(_searchQuery) { docs, _ ->
        docs.filter {
            val s = it.getExpiryStatus()
            s == ExpiryStatus.EXPIRED || s == ExpiryStatus.EXPIRING_SOON
        }.sortedBy { it.getDaysUntilExpiry() ?: Long.MAX_VALUE }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedFolder(folderId: String) {
        _selectedFolder.value = folderId
    }

    fun setSelectedCategory(catId: String?) {
        _selectedCategory.value = catId
    }

    fun setDarkTheme(dark: Boolean) {
        _isDarkTheme.value = dark
        securityPreferences.setDarkTheme(dark)
    }

    // PIN & Security Methods
    fun verifyPin(pin: String): Boolean {
        val remaining = securityPreferences.getLockoutRemainingSeconds()
        if (remaining > 0) {
            _lockoutSeconds.value = remaining
            _pinError.value = "Too many failed attempts. Locked for ${remaining}s."
            return false
        }
        val valid = securityPreferences.verifyPin(pin)
        if (valid) {
            _isVaultLocked.value = false
            _pinError.value = null
        } else {
            val newRemaining = securityPreferences.getLockoutRemainingSeconds()
            if (newRemaining > 0) {
                _lockoutSeconds.value = newRemaining
                _pinError.value = "Too many failed attempts. Locked for ${newRemaining}s."
            } else {
                _pinError.value = "Incorrect PIN. Please try again."
            }
        }
        return valid
    }

    fun unlockWithBiometric() {
        _isVaultLocked.value = false
        _pinError.value = null
    }

    fun lockVault() {
        if (_isPinSet.value) {
            _isVaultLocked.value = true
        }
    }

    fun setupPin(pin: String) {
        securityPreferences.setPin(pin)
        _isPinSet.value = true
        _isVaultLocked.value = false
        _pinError.value = null
    }

    fun removePin() {
        securityPreferences.removePin()
        _isPinSet.value = false
        _isVaultLocked.value = false
        _pinError.value = null
    }

    fun clearPinError() {
        _pinError.value = null
    }

    // CRUD
    fun addDocument(document: DocumentEntity, onComplete: () -> Unit = {}) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertDocument(document)
            launch(Dispatchers.Main) { onComplete() }
        }
    }

    fun updateDocument(document: DocumentEntity, onComplete: () -> Unit = {}) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateDocument(document.copy(updatedAt = System.currentTimeMillis()))
            launch(Dispatchers.Main) { onComplete() }
        }
    }

    fun deleteDocument(document: DocumentEntity, onComplete: () -> Unit = {}) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteDocument(document)
            launch(Dispatchers.Main) { onComplete() }
        }
    }

    // Family Members
    fun addFamilyMember(name: String) {
        if (name.isNotBlank()) {
            securityPreferences.addCustomFamilyMember(name.trim())
            _customMembers.value = securityPreferences.getCustomFamilyMembers()
        }
    }

    fun removeFamilyMember(name: String) {
        securityPreferences.removeCustomFamilyMember(name)
        _customMembers.value = securityPreferences.getCustomFamilyMembers()
    }

    // Backup & Restore
    fun exportBackupJson(): String {
        val docs = allDocuments.value
        val array = JSONArray()
        for (d in docs) {
            val obj = JSONObject()
            obj.put("id", d.id)
            obj.put("name", d.name)
            obj.put("category", d.category)
            obj.put("holderName", d.holderName ?: "")
            obj.put("documentNumber", d.documentNumber ?: "")
            obj.put("issueDate", d.issueDate ?: "")
            obj.put("expiryDate", d.expiryDate ?: "")
            obj.put("familyFolder", d.familyFolder)
            obj.put("pinLocked", d.pinLocked)
            obj.put("description", d.description ?: "")
            obj.put("createdAt", d.createdAt)
            array.put(obj)
        }
        return array.toString(2)
    }

    fun importBackupJson(jsonString: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val array = JSONArray(jsonString)
                val list = mutableListOf<DocumentEntity>()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    list.add(
                        DocumentEntity(
                            name = obj.optString("name", "Document"),
                            category = obj.optString("category", "other"),
                            holderName = obj.optString("holderName").takeIf { it.isNotBlank() },
                            documentNumber = obj.optString("documentNumber").takeIf { it.isNotBlank() },
                            issueDate = obj.optString("issueDate").takeIf { it.isNotBlank() },
                            expiryDate = obj.optString("expiryDate").takeIf { it.isNotBlank() },
                            familyFolder = obj.optString("familyFolder", "my_vault"),
                            pinLocked = obj.optBoolean("pinLocked", false),
                            description = obj.optString("description").takeIf { it.isNotBlank() }
                        )
                    )
                }
                repository.insertAll(list)
                launch(Dispatchers.Main) {
                    onResult(true, "Successfully restored ${list.size} documents from backup!")
                }
            } catch (e: Exception) {
                launch(Dispatchers.Main) {
                    onResult(false, "Failed to parse backup JSON: ${e.localizedMessage}")
                }
            }
        }
    }

    companion object {
        fun factory(application: Application): ViewModelProvider.Factory {
            return object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    val app = application as DocSphereApplication
                    return DocSphereViewModel(
                        application,
                        app.repository,
                        app.securityPreferences
                    ) as T
                }
            }
        }
    }
}
