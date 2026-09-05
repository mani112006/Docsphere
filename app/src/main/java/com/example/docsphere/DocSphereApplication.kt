package com.example.docsphere

import android.app.Application
import com.example.docsphere.data.db.DocSphereDatabase
import com.example.docsphere.data.preferences.SecurityPreferences
import com.example.docsphere.data.repository.DocumentRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class DocSphereApplication : Application() {
    val applicationScope = CoroutineScope(SupervisorJob())

    val database by lazy { DocSphereDatabase.getDatabase(this, applicationScope) }
    val repository by lazy { DocumentRepository(database.documentDao()) }
    val securityPreferences by lazy { SecurityPreferences(this) }
}
