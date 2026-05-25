/**
 * MedTruth Guard — Python Backend API Client
 *
 * Centralised API layer that communicates with the FastAPI backend.
 * Base URL is read from the NEXT_PUBLIC_PYTHON_API_URL env variable
 * (defaults to http://localhost:8000).
 *
 * All functions return parsed JSON or throw an ApiError.
 */

const BASE_URL =
    typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"
        : process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000";

// ─── Custom error class ───────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(status, body) {
        // Handle common FastAPI/Python backend error structures
        let message = "An unexpected error occurred.";
        
        if (body?.detail) {
            if (typeof body.detail === "string") {
                message = body.detail;
            } else if (body.detail.error) {
                // Handle structure: { detail: { error: "...", raw_output: "..." } }
                message = body.detail.error;
            } else if (body.detail.message) {
                message = body.detail.message;
            } else {
                message = JSON.stringify(body.detail);
            }
        } else if (body?.message) {
            message = body.message;
        } else {
            message = `API Error ${status}`;
        }

        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
async function request(method, path, body = null) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);

    let json;
    try {
        json = await res.json();
    } catch {
        json = null;
    }

    if (!res.ok) {
        // Handle rate limiting
        if (res.status === 429) {
            const retryAfter = res.headers.get("Retry-After") || "30";
            throw new ApiError(429, {
                detail: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
                retryAfter: parseInt(retryAfter, 10),
            });
        }
        throw new ApiError(res.status, json);
    }

    return json;
}

async function multipartRequest(method, path, formData) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        body: formData,
        // Browser sets Content-Type to multipart/form-data with boundary automatically
    });

    let json;
    try {
        json = await res.json();
    } catch {
        json = null;
    }

    if (!res.ok) {
        throw new ApiError(res.status, json);
    }

    return json;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1) CITIZEN APIs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a medical query (chat).
 *
 * POST /medical/query
 *
 * @param {string}  query          – The user's medical question.
 * @param {string}  citizenId      – Citizen's unique id (from session).
 * @param {object}  patientContext  – Patient health profile.
 *   { medication, isPregnant, gender, currentDisease, allergies, age, history, symptoms }
 *
 * @returns {{ message, query_id, ai_response, doctor_suggestions }}
 */
export async function createMedicalQuery(query, citizenId, patientContext = {}) {
    // Map frontend patientContext shape → backend payload shape
    const payload = {
        query,
        citizen_id: citizenId,
        patientContext: {
            medication:
                (patientContext.medications || []).join(", ") || "none",
            isPregnant: !!patientContext.isPregnant,
            gender: (patientContext.gender || "").toLowerCase(),
            currentDisease:
                (patientContext.conditions || []).join(", ") || "none",
            allergies: patientContext.allergies || "none",
            age: Number(patientContext.age) || 0,
            history: patientContext.history || "no chronic conditions",
            symptoms: patientContext.symptoms || query, // use the query text as symptoms fallback
        },
    };

    return request("POST", "/medical/query", payload);
}

/**
 * Consult one or more doctors for a specific query.
 *
 * POST /medical/consult
 *
 * @param {string}          queryId    – The query_id returned from createMedicalQuery.
 * @param {string|string[]} doctorIds  – Single doctor id or array of doctor ids.
 * @param {string}          citizenId  – Citizen id.
 * @param {string|null}     citizenMobile – Citizen mobile number.
 *
 * @returns {{ message, query_id, requested_doctor_ids, newly_added_doctor_ids }}
 */
export async function consultDoctor(queryId, doctorIds, citizenId, citizenMobile = null) {
    const ids = Array.isArray(doctorIds) ? doctorIds : [doctorIds];

    return request("POST", "/medical/consult", {
        query_id: queryId,
        doctor_ids: ids,
        citizen_id: citizenId,
        citizen_mobile: citizenMobile,
    });
}

/**
 * Get a single query by its id.
 *
 * GET /medical/query/{query_id}
 */
export async function getQuery(queryId) {
    return request("GET", `/medical/query/${queryId}`);
}

/**
 * Get all queries for a citizen.
 *
 * GET /medical/queries/citizen/{citizen_id}
 */
export async function getCitizenQueries(citizenId) {
    return request("GET", `/medical/queries/citizen/${citizenId}`);
}

/**
 * Delete a single query from DB.
 *
 * DELETE /medical/query/{query_id}?citizen_id={citizen_id}
 */
export async function deleteQuery(queryId, citizenId) {
    return request("DELETE", `/medical/query/${queryId}?citizen_id=${citizenId}`);
}

/**
 * Delete all queries of citizen (clear history).
 *
 * DELETE /medical/queries/citizen/{citizen_id}
 */
export async function deleteCitizenHistory(citizenId) {
    return request("DELETE", `/medical/queries/citizen/${citizenId}`);
}


// ─── Medical Image Analysis ───

/**
 * Analyze ECG image.
 * POST /medical-image/analyze/ecg
 */
export async function analyzeEcg(formData) {
    return multipartRequest("POST", "/medical-image/analyze/ecg", formData);
}

/**
 * Analyze X-ray image.
 * POST /medical-image/analyze/xray
 */
export async function analyzeXray(formData) {
    return multipartRequest("POST", "/medical-image/analyze/xray", formData);
}

/**
 * Get a single image analysis.
 * GET /medical-image/analysis/{analysis_id}
 */
export async function getImageAnalysis(analysisId) {
    return request("GET", `/medical-image/analysis/${analysisId}`);
}

/**
 * Get all image analyses for a citizen.
 * GET /medical-image/analyses/citizen/{citizen_id}
 */
export async function getCitizenImageAnalyses(citizenId, type = null) {
    const path = `/medical-image/analyses/citizen/${citizenId}${type ? `?analysis_type=${type}` : ""}`;
    return request("GET", path);
}

/**
 * Health check for medical image analysis service.
 * GET /medical-image/health
 */
export async function getImageAnalysisHealth() {
    return request("GET", "/medical-image/health");
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2) DOCTOR APIs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all queries assigned to a doctor.
 *
 * GET /doctor/assigned/{doctor_id}
 */
export async function getDoctorAssignedQueries(doctorId) {
    return request("GET", `/doctor/assigned/${doctorId}`);
}

/**
 * Submit a doctor review for a query.
 *
 * POST /doctor/review/{query_id}
 *
 * @param {string} queryId
 * @param {object} review
 *   { doctor_id, status, recommendation, doctor_view, modified_response? }
 */
export async function submitDoctorReview(queryId, review) {
    // Ensure backward compatibility: include both `status` and `decision`
    const payload = {
        ...review,
        decision: review.decision || review.status,
    };
    return request("POST", `/doctor/review/${queryId}`, payload);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3) HELPERS — Response parsing utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize the AI response field from GET query responses.
 * Backend stores it as `ai_draft_response` but POST returns it as `ai_response`.
 */
export function getAiResponse(queryDoc) {
    return queryDoc?.ai_response || queryDoc?.ai_draft_response || null;
}

/**
 * Map the backend ai_response object to the shape consumed by the ChatMessage
 * component in the citizen chat.
 */
export function mapAiResponseToChat(backendResponse) {
    const ai = backendResponse.ai_response || {};
    const rawDoctors = backendResponse.doctor_suggestions || [];

    // Handle both LLM-ranked shape and rule-based fallback shape
    const doctors = rawDoctors.map((doc) => {
        // Build display name: prefer `name`, fallback to first_name + last_name
        const displayName =
            doc.name ||
            [doc.first_name, doc.last_name].filter(Boolean).join(" ") ||
            "Doctor";

        return {
            id: doc.id,
            name: displayName,
            specialty: doc.specialization || doc.specialisation,
            suitability_score: doc.suitability_score ?? null,
            reason: doc.reason || null,
            experience: doc.experience || null,
            status: doc.status || null,
        };
    });

    // Build verification object from the ai_response
    const riskLevel = (ai.risk_level || "low").toLowerCase();
    const verificationStatus =
        riskLevel === "high" ? "unsafe" : riskLevel === "medium" ? "caution" : "safe";

    // Built-in disclaimer overrides custom safeLabels UI
    const safeLabelText = ai.disclaimer || "This is not a substitute for professional medical advice.";

    // confidence_score from backend is 0-100
    const confidenceScore = ai.confidence_score != null ? ai.confidence_score : null;

    return {
        queryId: backendResponse.query_id,
        response: ai.recommendation || ai.medical_analysis || "",
        medicalAnalysis: ai.medical_analysis || "",
        verification: {
            status: verificationStatus,
            safeLabel: safeLabelText,
            justification: ai.medical_analysis || "",
            sources: (ai.citations || []).map((c) =>
                typeof c === "string" ? c : c.title || JSON.stringify(c)
            ),
            verification_sources: ai.verification_sources || null,
            patientContextStr: null, // filled in by caller
            confidenceScore,
            requiredSpecialization: ai.required_specialization,
        },
        // Full AI response for display on doctor-responses page
        aiResponse: {
            recommendation: ai.recommendation || "",
            medical_analysis: ai.medical_analysis || "",
            risk_level: ai.risk_level || "low",
            confidence_score: confidenceScore,
            required_specialization: ai.required_specialization || "",
            citations: ai.citations || [],
            disclaimer: ai.disclaimer || "",
        },
        doctors,
        disclaimer: ai.disclaimer || "This is not a substitute for professional medical advice.",
    };
}

/**
 * Map a single consult_request entry (from GET query response) to a display-
 * friendly shape for the Doctor Responses page.
 */
export function mapConsultRequestToItem(consultReq, queryData) {
    const aiResp = getAiResponse(queryData);
    return {
        doctor_id: consultReq.doctor_id,
        consult_status: consultReq.consult_status,
        doctor_recommendation: consultReq.doctor_recommendation,
        doctor_view: consultReq.doctor_view,
        modified_response: consultReq.modified_response,
        consult_requested_at: consultReq.consult_requested_at,
        reviewed_at: consultReq.reviewed_at,
        query: queryData?.query,
        query_id: queryData?._id || queryData?.query_id,
        ai_response: aiResp,
    };
}
