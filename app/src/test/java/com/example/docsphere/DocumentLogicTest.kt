package com.example.docsphere

import com.example.docsphere.data.model.Categories
import com.example.docsphere.data.model.DocumentEntity
import com.example.docsphere.data.model.ExpiryStatus
import com.example.docsphere.data.model.FamilyFolders
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DocumentLogicTest {

    @Test
    fun testCategoryLookup() {
        val dl = Categories.getCategory("driving_licence")
        assertEquals("Driving Licence", dl.label)
        assertNotNull(dl.renewalPortalUrl)
        assertTrue(dl.renewalPortalUrl!!.contains("sarathi.parivahan.gov.in"))

        val aadhaar = Categories.getCategory("aadhaar")
        assertEquals("Aadhaar Card", aadhaar.label)
        assertTrue(aadhaar.renewalPortalUrl!!.contains("uidai"))
    }

    @Test
    fun testFamilyFoldersLabel() {
        assertEquals("My Vault", FamilyFolders.labelOf("my_vault"))
        assertEquals("Father's Documents", FamilyFolders.labelOf("father"))
        assertEquals("Mother's Documents", FamilyFolders.labelOf("mother"))
    }

    @Test
    fun testExpiryStatusExpired() {
        val pastDate = "2020-01-01"
        val doc = DocumentEntity(
            name = "Old Passport",
            category = "passport",
            expiryDate = pastDate
        )
        assertEquals(ExpiryStatus.EXPIRED, doc.getExpiryStatus())
        assertTrue((doc.getDaysUntilExpiry() ?: 0) < 0)
    }

    @Test
    fun testExpiryStatusNone() {
        val doc = DocumentEntity(
            name = "Aadhaar Card",
            category = "aadhaar",
            expiryDate = null
        )
        assertEquals(ExpiryStatus.NONE, doc.getExpiryStatus())
        assertEquals(null, doc.getDaysUntilExpiry())
    }

    @Test
    fun testExpiryStatusValidFuture() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val futureTime = System.currentTimeMillis() + (365L * 24L * 60L * 60L * 1000L)
        val futureDateStr = sdf.format(Date(futureTime))

        val doc = DocumentEntity(
            name = "Future License",
            category = "driving_licence",
            expiryDate = futureDateStr
        )
        assertEquals(ExpiryStatus.VALID, doc.getExpiryStatus())
        assertTrue((doc.getDaysUntilExpiry() ?: 0) > 30)
    }
}
