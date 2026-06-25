import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";


export async function POST(request) {
    const body = await request.json();

    const eventType = body.type;

    if (eventType !== "call.transcription_ready" && eventType !== "call.recording_ready") {
        return Response.json({ ok: true });
    }

    // call_cid arrives as "default:mock_123_abc" - we stored just "mock_123_abc"
    const callCid = body.callCid ?? "";
    const streamCallId = callCid.includes(":") ? callCid.split(":")[1] : callCid;

    if (!streamCallId) {
        return Response.json({ ok: true });
    }

    try {
        const booking = await db.booking.findOne({
            where: { streamCallId },
            include: {
                interviewer: {
                    select: { id: true, clerkUserId: true, name: true, categories: true }
                },
                interviewee: {
                    select: { id: true, clerkUserId: true, name: true }
                },
                feedback: {
                    select: { id: true }
                }
            }
        });

        if (!booking) {
            return Response.json({ ok: true });
        }

        // ----- Recording Ready Event -----
        if (eventType === "call.recording_ready") {
            const recordingUrl = body.call_recording?.url;
            if (!recordingUrl) {
                return Response.json({ ok: true });
            }

            await db.booking.update({
                where: { id: booking.id },
                data: { recordingUrl }
            });

            return Response.json({ ok: true });
        }

        // ----- Transcription Ready Event -----
        if (eventType === "call.transcription_ready") {
            if (!booking.feedback) {
                return Response.json({ ok: true });
            }

            const transcriptionUrl = body.call_transcription?.url;
            if (!transcriptionUrl) {
                return Response.json({ ok: true });
            }

            // 1. Download the JSONL from stream cdn
            const transcriptionResponse = await fetch(transcriptionUrl);
            const transcriptionText = await transcriptionResponse.text();

            // 2. Parse the JSONL into readable conversation
            const lines = transcriptionText
                .trim()
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                    try {
                        return JSON.parse(line);
                    } catch (error) {
                        return null;
                    }
                })
                .filter((entry) => entry?.type === "speech");

            if (!lines.length) {
                return Response.json({ ok: true });
            }

            const speakerMap = {
                [booking.interviewer.clerkUserId]: booking.interviewer.name ?? "interviewer",
                [booking.interviewee.clerkUserId]: booking.interviewee.name ?? "interviewee"
            }

            const transcript = lines.map((l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`).join("\n");

            // 3. Generate feedback using the transcript via Gemini
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash-lite",
            });

            const categories = booking.interviewer.categories?.join(", ") ?? "General";

            const prompt = `You are an expert technical interviewer evaluating a mock interview.

                Interview categories: ${categories}
                Interviewer: ${booking.interviewer.name}
                Candidate: ${booking.interviewee.name}

                TRANSCRIPT: ${transcript}

                Analyze the candidate's performance. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
                {
                    "summary": "2-3 sentence overall summary of the session",
                    "technical": "Assessment of technical knowledge and accuracy",
                    "communication": "Assessment of clarity, structure, and communication style",
                    "problemSolving": "Assessment of problem-solving approach and thought process",
                    "recommendation": "HIRE / CONSIDER / NO_HIRE with a one-sentence reason",
                    "strengths": ["strength 1", "strength 2", "strength 3"],
                    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
                    "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT"
                }
            `;

            const result = await model.generateContent(prompt);
            const raw = result.response.text().trim().replace(/^```json|^```$/gm, "").trim();

            const feedbackData = JSON.parse(raw);
            
            // 4. Update the feedback in the database
            await db.$transaction([
                db.feedback.upsert({
                    where: { id: booking.feedback.id },
                    create: {
                        bookingId: booking.id,
                        summary: feedbackData.summary,
                        technical: feedbackData.technical,
                        communication: feedbackData.communication,
                        problemSolving: feedbackData.problemSolving,
                        recommendation: feedbackData.recommendation,
                        strengths: feedbackData.strengths,
                        improvements: feedbackData.improvements,
                        overallRating: feedbackData.overallRating
                    },
                    update: {}          // already exists, so no update needed
                }),

                db.booking.update({
                    where: { id: booking.id },
                    data: {status: "COMPLETED"}
                }),

                db.creditTransaction.upsert({
                    where: { bookingId: booking.id, type: "BOOKING_EARNING" },
                    create: {
                        bookingId: booking.id,
                        userId: booking.interviewer.id,
                        amount: booking.creditsCharged,
                        type: "BOOKING_EARNING"
                    },
                    update: {}
                })
            ]);

            return Response.json({ ok: true });
        }
    } catch (error) {
        console.error(`[stream-webhook] x ${eventType} error:`, error);
        // Always 200 - non-2xx trigger stream retries, making the race worse
        return Response.json({ ok: true });
    }
}