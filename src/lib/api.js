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
        const message =
            body?.detail?.message || body?.detail || body?.message || `API Error ${status}`;
        super(typeof message === "string" ? message : JSON.stringify(message));
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

// ─── Internal helper ──────────────────────────────────────────────────────────
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
 *
 * @returns {{ message, query_id, requested_doctor_ids, newly_added_doctor_ids }}
 */
export async function consultDoctor(queryId, doctorIds, citizenId) {
    const ids = Array.isArray(doctorIds) ? doctorIds : [doctorIds];

    return request("POST", "/medical/consult", {
        query_id: queryId,
        doctor_ids: ids,
        citizen_id: citizenId,
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

    const safeLabels = {
        safe: "Safe for this patient",
        caution: "Use with caution",
        unsafe: "Not recommended",
    };

    // confidence_score from backend is 0-100
    const confidenceScore = ai.confidence_score != null ? ai.confidence_score : null;

    return {
        queryId: backendResponse.query_id,
        response: ai.recommendation || ai.medical_analysis || "",
        medicalAnalysis: ai.medical_analysis || "",
        verification: {
            status: verificationStatus,
            safeLabel: safeLabels[verificationStatus],
            justification: ai.medical_analysis || "",
            sources: (ai.citations || []).map((c) =>
                typeof c === "string" ? c : c.title || JSON.stringify(c)
            ),
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
