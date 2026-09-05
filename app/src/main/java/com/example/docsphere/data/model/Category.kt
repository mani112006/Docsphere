package com.example.docsphere.data.model

data class Category(
    val id: String,
    val label: String,
    val renewalPortalName: String? = null,
    val renewalPortalUrl: String? = null
)

object Categories {
    val ALL = listOf(
        Category("aadhaar", "Aadhaar Card", "UIDAI My Aadhaar", "https://myaadhaar.uidai.gov.in/"),
        Category("pan", "PAN Card", "Income Tax e-Filing", "https://www.incometax.gov.in/"),
        Category("ration", "Ration Card", "NFSA / State PDS", "https://nfsa.gov.in/"),
        Category("driving_licence", "Driving Licence", "Sarathi Parivahan", "https://sarathi.parivahan.gov.in/"),
        Category("voter_id", "Voter ID", "NVSP Voter Portal", "https://www.nvsp.in/"),
        Category("passport", "Passport", "Passport Seva", "https://www.passportindia.gov.in/"),
        Category("education", "Education Certificates"),
        Category("atm_card", "ATM / Credit Card", "Card Issuer / Bank", "https://www.rbi.org.in/"),
        Category("bank", "Bank Documents", "RBI / Banking Portal", "https://www.rbi.org.in/"),
        Category("insurance", "Insurance", "IRDAI Portal", "https://www.irdai.gov.in/"),
        Category("medical", "Medical Documents", "ABHA Health ID", "https://abha.abdm.gov.in/"),
        Category("other", "Other Documents")
    )

    fun getCategory(id: String): Category {
        return ALL.find { it.id.equals(id, ignoreCase = true) || it.label.equals(id, ignoreCase = true) }
            ?: Category(id, id)
    }

    fun labelOf(id: String): String = getCategory(id).label
}
