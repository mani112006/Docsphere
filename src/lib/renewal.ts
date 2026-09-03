const PORTALS: Record<string, { label: string; url: string }> = {
  aadhaar: { label: 'UIDAI My Aadhaar', url: 'https://myaadhaar.uidai.gov.in/' },
  pan: { label: 'Income Tax e-Filing', url: 'https://www.incometax.gov.in/' },
  driving_licence: { label: 'Sarathi Parivahan', url: 'https://sarathi.parivahan.gov.in/' },
  passport: { label: 'Passport Seva', url: 'https://www.passportindia.gov.in/' },
  voter_id: { label: 'NVSP Voter Portal', url: 'https://www.nvsp.in/' },
  ration: { label: 'NFSA / State PDS', url: 'https://nfsa.gov.in/' },
  insurance: { label: 'IRDAI / insurer portal', url: 'https://www.irdai.gov.in/' },
  bank: { label: 'Your bank / RBI', url: 'https://www.rbi.org.in/' },
  atm_card: { label: 'Your card issuer / bank', url: 'https://www.rbi.org.in/' },
  medical: { label: 'ABHA Health ID', url: 'https://abha.abdm.gov.in/' },
}

export function renewalPortal(category: string) {
  return PORTALS[category] ?? null
}
