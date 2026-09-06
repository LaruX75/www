function parseJsonPreview(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function queryParam(url, key) {
  try {
    return new URL(url).searchParams.get(key) || "";
  } catch {
    return "";
  }
}

function normalizeCourseUnitResponse(request, courseCode, studyGuideYear) {
  const expectedPath = `/api/lu/units/${courseCode}/COURSE_UNIT`;
  if (request?.status !== 200 || !String(request?.url || "").includes(expectedPath)) return null;
  if (queryParam(request.url, "period") !== studyGuideYear) return null;

  const unit = parseJsonPreview(request.bodyPreview)?.learningUnits?.[0];
  if (!unit || unit.code !== courseCode || !unit.learningUnitId) return null;

  return {
    courseUnitId: String(unit.learningUnitId),
    courseCode: unit.code,
    nameFi: unit.name?.valueFi || "",
    nameEn: unit.name?.valueEn || "",
    type: unit.type || ""
  };
}

function historicalCourseEvidence(requests, courseCode, studyGuideYear) {
  const courseUnit = (requests || [])
    .map((request) => normalizeCourseUnitResponse(request, courseCode, studyGuideYear))
    .find(Boolean) || null;

  if (!courseUnit) return null;

  const detailPath = `/api/course/${courseUnit.courseUnitId}`;
  const implementationDetailStatus = (requests || []).find((request) =>
    String(request?.url || "").includes(detailPath)
    && queryParam(request.url, "period") === studyGuideYear
  )?.status ?? null;

  return {
    ...courseUnit,
    implementationDetailStatus,
    implementationIdentity:
      implementationDetailStatus === 404 ? "DOES_NOT_PROVE" : "NO_DATA"
  };
}

function implementationSummaries(realizations = []) {
  const byCode = new Map();

  for (const realization of realizations || []) {
    const text = String(realization?.text || "").replace(/\s+/g, " ").trim();
    const code = text.match(/\b([0-9]{3,6}[A-Z]{1,2}-\d+)\b/)?.[1] || "";
    if (!code) continue;
    const dates = text.match(/\b(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})\b/);
    const row = {
      implementationCode: code,
      dateRange: dates ? `${dates[1]} - ${dates[2]}` : "",
      text
    };
    const existing = byCode.get(code);
    if (!existing || (!existing.dateRange && row.dateRange)) {
      byCode.set(code, row);
    }
  }

  return [...byCode.values()];
}

module.exports = {
  historicalCourseEvidence,
  implementationSummaries,
  normalizeCourseUnitResponse
};
