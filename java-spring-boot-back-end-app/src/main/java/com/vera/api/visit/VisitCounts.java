package com.vera.api.visit;

import java.util.Map;

public record VisitCounts(long total, Map<VisitStatus, Long> byStatus) {
}
