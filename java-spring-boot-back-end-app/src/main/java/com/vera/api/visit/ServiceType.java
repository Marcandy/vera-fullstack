package com.vera.api.visit;

// What care was delivered, the EVV data element an assessment cannot stand in
// for. A controlled vocabulary so a typo fails here rather than at billing.
public enum ServiceType {
    PERSONAL_CARE,
    HOMEMAKER,
    COMPANION_CARE,
    RESPITE_CARE
}
