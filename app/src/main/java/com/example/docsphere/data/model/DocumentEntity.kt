package com.example.docsphere.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class ExpiryStatus {
    EXPIRED,
    EXPIRING_SOON,
    VALID,
    NONE
}

@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val category: String,
    val description: String? = null,
    val issueDate: String? = null,
    val expiryDate: String? = null,
    val holderName: String? = null,
    val documentNumber: String? = null,
    val familyFolder: String = "my_vault",
    val pinLocked: Boolean = false,
    val fileData: String? = null, // base64 or file uri
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun getExpiryStatus(): ExpiryStatus {
        if (expiryDate.isNullOrBlank()) return ExpiryStatus.NONE
        val parsed = parseDate(expiryDate) ?: return ExpiryStatus.NONE
        val now = System.currentTimeMillis()
        val thirtyDaysMillis = 30L * 24L * 60L * 60L * 1000L
        return when {
            parsed.time < now -> ExpiryStatus.EXPIRED
            parsed.time <= now + thirtyDaysMillis -> ExpiryStatus.EXPIRING_SOON
            else -> ExpiryStatus.VALID
        }
    }

    fun getDaysUntilExpiry(): Long? {
        if (expiryDate.isNullOrBlank()) return null
        val parsed = parseDate(expiryDate) ?: return null
        val diff = parsed.time - System.currentTimeMillis()
        return diff / (24L * 60L * 60L * 1000L)
    }

    companion object {
        fun parseDate(dateStr: String): Date? {
            val formats = listOf("yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy")
            for (f in formats) {
                try {
                    val sdf = SimpleDateFormat(f, Locale.getDefault())
                    sdf.isLenient = false
                    val d = sdf.parse(dateStr)
                    if (d != null) return d
                } catch (_: Exception) {}
            }
            return null
        }
    }
}
