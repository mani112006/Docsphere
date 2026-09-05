package com.example.docsphere.data.model

data class FamilyFolder(
    val id: String,
    val label: String
)

object FamilyFolders {
    val DEFAULTS = listOf(
        FamilyFolder("my_vault", "My Vault"),
        FamilyFolder("father", "Father's Documents"),
        FamilyFolder("mother", "Mother's Documents"),
        FamilyFolder("spouse", "Spouse"),
        FamilyFolder("kids", "Kids")
    )

    fun labelOf(id: String): String {
        return DEFAULTS.find { it.id.equals(id, ignoreCase = true) }?.label ?: id
    }
}
