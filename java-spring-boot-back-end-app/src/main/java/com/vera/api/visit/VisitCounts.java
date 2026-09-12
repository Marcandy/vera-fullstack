package com.vera.api.visit;

import java.util.Map;

// The filter chips count the WHOLE collection while the list below them shows
// one slice of it, so the counts travel in their own response. Deriving them
// from the rows just returned would make every chip read the filtered total or
// zero, which is the bug that appears the moment filtering moves to the server.
//
// Jackson writes the enum keys by name, so this serializes as
// {"total": 14, "byStatus": {"SCHEDULED": 3, ...}}, which is the shape
// getVisitCounts already returns in the React service layer.
public record VisitCounts(long total, Map<VisitStatus, Long> byStatus) {
}
