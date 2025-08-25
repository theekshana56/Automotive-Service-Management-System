import React, { useEffect, useRef, useState } from "react";

/**
 * AttendanceFaceRecognition.jsx (React)
 * --------------------------------------------------------------
 * ✅ Fixes for the reported build/runtime errors
 *  - Removed direct NPM import of `face-api.js` which can cause bundlers to fail
 *    in sandboxed previews ("Build failed with 2 errors").
 *  - Now loads the UMD build of face-api.js at runtime via a <script> tag.
 *  - Adds preflight checks for model & encodings paths and graceful fallbacks.
 *  - Works even if /data/encodings.json is missing (detection-only mode).
 *  - Clear status messages for HTTPS/camera permissions issues.
 *  - Small built-in tests for helper functions (since there were no tests).
 *
 * 🚀 How to use in your own app
 *   1) Place models in:   /public/models
 *      - tiny_face_detector_model-weights_manifest.json (+ shards)
 *      - face_landmark_68_model-weights_manifest.json (+ shards)
 *      - face_recognition_model-weights_manifest.json (+ shards)
 *   2) Optional: Create   /public/data/encodings.json  (see schema below)
 *   3) Route this component at /attendance (or wherever you like)
 *
 * encodings.json schema example:
 * [
 *   {
 *     "label": "EMP001 | Jane Doe",
 *     "descriptors": [ [0.12, -0.03, ... 128 floats ...], [ ... ], ... ]
 *   },
 *   { "label": "EMP002 | John Lee", "descriptors": [ [ ...128... ] ] }
 * ]
 * --------------------------------------------------------------
 */

// Paths served from your app's public/ directory
const MODEL_URL = "/models"; // e.g., public/models
const ENCODINGS_URL = "/data/encodings.json"; // e.g., public/data/encodings.json

// UMD build of face-api.js (runtime script load avoids bundler issues)
const FACEAPI_UMD =
  "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";

// UI helper
const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-100 border border-slate-200">
    {children}
  </span>
);

export default function AttendanceFaceRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Keep faceapi and matcher in refs so re-renders don't reset them
  const faceApiRef = useRef(null); // window.faceapi once loaded
  const matcherRef = useRef(null); // new faceapi.FaceMatcher(...)

  const [status, setStatus] = useState("Initializing…");
  const [modelsReady, setModelsReady] = useState(false);
  const [encodingsReady, setEncodingsReady] = useState(false); // true if encodings loaded
  const [cameraReady, setCameraReady] = useState(false);
  const [detected, setDetected] = useState(false);
  const [match, setMatch] = useState(null); // { label, distance }
  const [attendance, setAttendance] = useState([]);
  const [cooldownMap, setCooldownMap] = useState({}); // empId -> timestamp

  // ========== UTIL: Load script once ==========
  async function loadScriptOnce(src) {
    // If already present, resolve immediately
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  // ========== UTIL: Tiny tests (since none existed) ==========
  function runSelfTests() {
    // parseLabel tests
    console.assert(
      JSON.stringify(parseLabel("EMP001 | Jane Doe")) ===
        JSON.stringify({ id: "EMP001", name: "Jane Doe" }),
      "parseLabel failed on 'EMP001 | Jane Doe'"
    );
    console.assert(
      JSON.stringify(parseLabel("OnlyName")) ===
        JSON.stringify({ id: "OnlyName", name: "OnlyName" }),
      "parseLabel failed on 'OnlyName'"
    );

    // canMarkNow tests
    const now = Date.now();
    const cm = { EMP001: now - 6 * 60 * 1000 }; // >5min ago
    const cm2 = { EMP001: now - 2 * 60 * 1000 }; // <5min ago
    console.assert(canMarkNow("EMP001", cm) === true, "canMarkNow should be true when >5min");
    console.assert(canMarkNow("EMP001", cm2) === false, "canMarkNow should be false when <5min");

    // Basic invariant
    console.assert(typeof MODEL_URL === "string" && MODEL_URL.length > 0, "MODEL_URL invalid");
  }

  useEffect(() => {
    runSelfTests();
  }, []);

  // ========== Stage 1: Load face-api.js UMD & preflight models/encodings ==========
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setStatus("Loading face-api library…");
        await loadScriptOnce(FACEAPI_UMD);
        const faceapi = window.faceapi;
        if (!faceapi) throw new Error("faceapi not available on window");
        faceApiRef.current = faceapi;

        // Preflight: make sure at least one model manifest is reachable
        setStatus("Checking model files…");
        const tinyManifest = await fetch(
          `${MODEL_URL}/tiny_face_detector_model-weights_manifest.json`,
          { cache: "no-store" }
        );
        if (!tinyManifest.ok) {
          throw new Error(
            "Models not found at /models. Place model files under public/models."
          );
        }

        // Load required nets
        setStatus("Loading models…");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (canceled) return;
        setModelsReady(true);

        // Try to load encodings; if missing, we'll run in detection-only mode
        setStatus("Loading staff encodings…");
        try {
          const res = await fetch(ENCODINGS_URL, { cache: "no-store" });
          if (res.ok) {
            const labeled = await res.json();
            const labeledDescriptors = labeled.map((e) =>
              new faceapi.LabeledFaceDescriptors(
                e.label,
                e.descriptors.map((arr) => new Float32Array(arr))
              )
            );
            if (labeledDescriptors.length > 0) {
              matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
              setEncodingsReady(true);
            } else {
              setEncodingsReady(false);
              console.warn("encodings.json loaded but empty – running in detection-only mode");
            }
          } else {
            setEncodingsReady(false);
            console.warn("encodings.json not found – running in detection-only mode");
          }
        } catch (e) {
          setEncodingsReady(false);
          console.warn("Failed to load encodings.json – running in detection-only mode", e);
        }

        setStatus("Opening camera…");
      } catch (err) {
        console.error(err);
        setStatus(err.message || "Failed to initialize face recognition");
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  // ========== Stage 2: Start camera ==========
  useEffect(() => {
    if (!modelsReady) return;

    let active = true;
    (async () => {
      try {
        if (!window.isSecureContext && location.hostname !== "localhost") {
          setStatus(
            "Camera requires HTTPS or localhost. Please serve the app over HTTPS."
          );
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!active) return;
        setCameraReady(true);
        setStatus(encodingsReady ? "Ready – looking for faces…" : "Ready – detection only (no encodings.json)");
      } catch (err) {
        console.error("Camera error", err);
        setStatus(
          "Unable to access camera. Check permissions and that you're on HTTPS/localhost."
        );
      }
    })();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [modelsReady, encodingsReady]);

  // ========== Stage 3: Detection & recognition loop ==========
  useEffect(() => {
    if (!cameraReady || !modelsReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    let rafId;
    const loop = async () => {
      try {
        if (!video || video.readyState !== 4) {
          rafId = requestAnimationFrame(loop);
          return;
        }

        const faceapi = faceApiRef.current;
        const dispSize = {
          width: video.videoWidth || 640,
          height: video.videoHeight || 480,
        };
        canvas.width = dispSize.width;
        canvas.height = dispSize.height;

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const result = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result) {
          setDetected(true);
          const resized = faceapi.resizeResults(result, dispSize);
          faceapi.draw.drawDetections(canvas, resized);
          faceapi.draw.drawFaceLandmarks(canvas, resized);

          // Recognition if we have a matcher
          if (matcherRef.current) {
            const best = matcherRef.current.findBestMatch(result.descriptor);
            const text = `${best.label} (${best.distance.toFixed(2)})`;
            const drawBox = new faceapi.draw.DrawBox(resized.detection.box, {
              label: text,
            });
            drawBox.draw(canvas);

            if (best.label && !String(best.label).toLowerCase().includes("unknown")) {
              setMatch({ label: best.label, distance: best.distance });
              setStatus("Face recognized. You can mark attendance.");
            } else {
              setMatch(null);
              setStatus("Face detected, but not recognized.");
            }
          } else {
            // Detection only
            const drawBox = new faceapi.draw.DrawBox(resized.detection.box, {
              label: "Detected",
            });
            drawBox.draw(canvas);
            setMatch(null);
            setStatus("Face detected. Load encodings.json to enable recognition.");
          }
        } else {
          setDetected(false);
          setMatch(null);
          setStatus(encodingsReady ? "Ready – looking for faces…" : "Ready – detection only (no encodings.json)");
        }
      } catch (e) {
        console.error("Detection error", e);
        setStatus("Detection error. See console.");
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [cameraReady, modelsReady, encodingsReady]);

  // ========== Helpers ==========
  function parseLabel(label) {
    // Expected format: "EMP001 | Jane Doe"; fallback: use whole string for both
    const parts = String(label).split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return { id: parts[0], name: parts.slice(1).join(" | ") };
    return { id: parts[0] || String(label), name: parts[0] || String(label) };
  }

  function canMarkNow(empId, map = cooldownMap) {
    const last = map[empId];
    const now = Date.now();
    // 5-minute cooldown to avoid duplicates
    return !last || now - last > 5 * 60 * 1000;
  }

  function handleMarkAttendance() {
    if (!match) return;
    const { id, name } = parseLabel(match.label);
    if (!canMarkNow(id)) {
      setStatus("Already marked recently. Try again later.");
      return;
    }

    const entry = {
      id,
      name,
      time: new Date().toLocaleString(),
      method: "Face",
      similarity: (1 - Math.min(1, match.distance)).toFixed(2),
    };
    setAttendance((prev) => [entry, ...prev]);
    setCooldownMap((m) => ({ ...m, [id]: Date.now() }));
    setStatus(`✅ Attendance marked for ${name}.`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Staff Attendance — Face Recognition
          </h1>
          <div className="flex items-center gap-2">
            <Pill>{modelsReady ? "Models: Ready" : "Models: Loading"}</Pill>
            <Pill>{encodingsReady ? "Encodings: Loaded" : "Encodings: —"}</Pill>
            <Pill>{cameraReady ? "Camera: On" : "Camera: Off"}</Pill>
            <Pill>{detected ? "Face: Detected" : "Face: —"}</Pill>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera & status */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Live Camera</h2>
            <span className="text-sm text-slate-500">{status}</span>
          </div>

          <div className="relative rounded-xl overflow-hidden border bg-black aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0" />
            {/* frame */}
            <div className="pointer-events-none absolute inset-4 rounded-2xl border-4 border-emerald-400/70" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleMarkAttendance}
              disabled={!match}
              className={`px-4 py-2 rounded-xl font-semibold text-white shadow transition ${
                match ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Mark Attendance
            </button>
            {match ? (
              <div className="text-sm text-slate-600">
                Recognized: <span className="font-medium">{parseLabel(match.label).name}</span> ({
                  parseLabel(match.label).id
                }) · Confidence ~ <span className="font-mono">{(1 - match.distance).toFixed(2)}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                {encodingsReady
                  ? "Detected faces will be recognized against your staff gallery."
                  : "Detection-only mode. Add /data/encodings.json for recognition."}
              </div>
            )}
          </div>
        </section>

        {/* Right: Attendance list */}
        <section className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Today'" + "s Attendance</h2>
            <div className="text-sm text-slate-500">{new Date().toLocaleDateString()}</div>
          </div>

          <div className="overflow-auto max-h-[60vh] border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 border-b">Employee</th>
                  <th className="text-left p-3 border-b">ID</th>
                  <th className="text-left p-3 border-b">Method</th>
                  <th className="text-left p-3 border-b">Time</th>
                  <th className="text-left p-3 border-b">Similarity</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  attendance.map((a, idx) => (
                    <tr key={idx} className="odd:bg-white even:bg-slate-50">
                      <td className="p-3">{a.name}</td>
                      <td className="p-3 font-mono">{a.id}</td>
                      <td className="p-3">{a.method}</td>
                      <td className="p-3">{a.time}</td>
                      <td className="p-3 font-mono">{a.similarity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Helper: How to add staff encodings */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow p-4">
          <h3 className="text-base font-semibold mb-2">Add / Update Staff Encodings</h3>
          <ol className="text-sm text-slate-600 list-decimal ml-5 space-y-1">
            <li>Collect 3–5 clear front-facing photos per employee.</li>
            <li>
              Run an offline script (Node or Python) to compute 128-d embeddings and export to
              <code> /public/data/encodings.json </code> following the schema above.
            </li>
            <li>
              Label format tip: <code>EMP001 | Jane Doe</code> (ID, pipe, full name).
            </li>
            <li>Restart the app or refresh after updating encodings.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
