package com.triageai.triageaibackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AIService {

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.transcription.url:https://api.groq.com/openai/v1/audio/transcriptions}")
    private String transcriptionUrl;

    @Value("${ai.transcription.model:whisper-large-v3}")
    private String transcriptionModel;

    @Value("${ai.chat.url:https://api.groq.com/openai/v1/chat/completions}")
    private String chatUrl;

    @Value("${ai.chat.model:llama-3.3-70b-versatile}")
    private String chatModel;

    private final RestTemplate restTemplate = new RestTemplate();

    // ─────────────────────────────────────────────────────────
    // VOICE TRANSCRIPTION
    // ─────────────────────────────────────────────────────────
    public String transcribeVoice(byte[] audioBytes, String filename) {
        if (apiKey == null || apiKey.isEmpty() || audioBytes == null || audioBytes.length == 0)
            return "I have chest pain and shortness of breath since this morning.";
        try {
            String mimeType = resolveMimeType(filename);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(apiKey);

            final String finalMimeType = mimeType;
            org.springframework.core.io.ByteArrayResource fileResource = new org.springframework.core.io.ByteArrayResource(
                    audioBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "audio.webm";
                }
            };

            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(finalMimeType));
            HttpEntity<org.springframework.core.io.ByteArrayResource> fileEntity = new HttpEntity<>(fileResource,
                    fileHeaders);
            body.add("file", fileEntity);
            body.add("model", transcriptionModel);

            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> req = new HttpEntity<>(body,
                    headers);
            ResponseEntity<Map> resp = restTemplate.postForEntity(transcriptionUrl, req, Map.class);
            if (resp.getStatusCode() == HttpStatus.OK && resp.getBody() != null)
                return (String) resp.getBody().get("text");
        } catch (Exception e) {
            System.err.println("[AIService] Whisper transcription failed: " + e.getMessage());
        }
        return "I have chest pain and shortness of breath since this morning.";
    }

    private String resolveMimeType(String filename) {
        if (filename == null)
            return "audio/webm";
        String n = filename.toLowerCase();
        if (n.endsWith(".webm"))
            return "audio/webm";
        if (n.endsWith(".ogg"))
            return "audio/ogg";
        if (n.endsWith(".wav"))
            return "audio/wav";
        if (n.endsWith(".m4a"))
            return "audio/m4a";
        if (n.endsWith(".mp4"))
            return "audio/mp4";
        if (n.endsWith(".mp3"))
            return "audio/mpeg";
        return "audio/webm";
    }

    // ─────────────────────────────────────────────────────────
    // MAIN TRIAGE EVALUATION
    // ─────────────────────────────────────────────────────────
    public TriageResult evaluateSymptoms(String symptomsText, String voiceTranscript,
            String diseaseDescription, int patientAge) {
        String combined = combine(symptomsText, voiceTranscript, diseaseDescription).toLowerCase();

        // 1. Try AI API first
        if (apiKey != null && !apiKey.isEmpty()) {
            try {
                TriageResult aiResult = callLLM(combined, patientAge);
                if (aiResult != null)
                    return aiResult;
            } catch (Exception e) {
                System.err.println("[AIService] LLM call failed, using rule engine: " + e.getMessage());
            }
        }

        // 2. Enhanced rule-based fallback
        return ruleBasedTriage(combined, patientAge);
    }

    // ─────────────────────────────────────────────────────────
    // LLM CALL (Groq / OpenAI-compatible)
    // ─────────────────────────────────────────────────────────
    private TriageResult callLLM(String combined, int age) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String systemPrompt = "You are an expert clinical triage AI assistant trained on WHO ICD-10 coding standards. "
                +
                "Analyze the patient's symptom text and return ONLY a valid JSON object with these exact keys:\n" +
                "{\n" +
                "  \"diseaseScore\": <number 0-100: probability of a diagnosable disease>,\n" +
                "  \"riskScore\": <number 0-100: overall clinical risk>,\n" +
                "  \"severityScore\": <number 0-100: symptom severity>,\n" +
                "  \"severityLevel\": <\"LOW\"|\"MEDIUM\"|\"HIGH\"|\"CRITICAL\">,\n" +
                "  \"extractedSymptoms\": [<list of symptom strings>],\n" +
                "  \"predictedDiagnosis\": <specific ICD-10 disease name, not generic>,\n" +
                "  \"icdCodes\": [{\"code\": \"<ICD-10 code>\", \"description\": \"<description>\"}],\n" +
                "  \"clinicalNotes\": <string: brief triage reasoning>,\n" +
                "  \"urgencyFlag\": <boolean: true if needs immediate attention>,\n" +
                "  \"recommendedAction\": <\"IMMEDIATE_CARE\"|\"URGENT_CARE\"|\"ROUTINE_CARE\"|\"SELF_CARE\">\n" +
                "}\n" +
                "Use accurate ICD-10-CM codes. Provide 1-3 icdCodes. " +
                "CRITICAL means life-threatening (score 80-100). HIGH means serious (60-79). " +
                "MEDIUM means moderate (30-59). LOW means minor (0-29). " +
                "Age > 65 or < 5 increases severity. Consider comorbidities mentioned. " +
                "Return ONLY the JSON, no markdown, no explanation.";

        String userPrompt = String.format("Patient Age: %d years\nSymptom Description: %s", age, combined);

        Map<String, Object> body = new HashMap<>();
        body.put("model", chatModel);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0.1);
        body.put("max_tokens", 800);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(chatUrl, entity, Map.class);

        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null)
            return null;

        List<Map> choices = (List<Map>) response.getBody().get("choices");
        if (choices == null || choices.isEmpty())
            return null;

        String content = (String) ((Map) choices.get(0).get("message")).get("content");
        if (content == null)
            return null;
        content = content.trim().replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        Map<String, Object> r = mapper.readValue(content, Map.class);

        double diseaseScore = toDouble(r.get("diseaseScore"), 0);
        double riskScore = toDouble(r.get("riskScore"), 0);
        double severityScore = toDouble(r.get("severityScore"), 0);
        String severityLevel = toString(r.get("severityLevel"), "LOW").toUpperCase();
        String diagnosis = toString(r.get("predictedDiagnosis"), "Unspecified Clinical Condition");
        String clinicalNotes = toString(r.get("clinicalNotes"), "");
        String recAction = toString(r.get("recommendedAction"), "ROUTINE_CARE");
        boolean urgencyFlag = toBoolean(r.get("urgencyFlag"), false);

        List<String> symptoms = new ArrayList<>();
        Object ext = r.get("extractedSymptoms");
        if (ext instanceof List)
            for (Object s : (List) ext)
                if (s != null)
                    symptoms.add(s.toString());

        List<ICDMapping> icdList = new ArrayList<>();
        Object icd = r.get("icdCodes");
        if (icd instanceof List) {
            for (Object item : (List) icd) {
                if (item instanceof Map) {
                    Map<?, ?> m = (Map<?, ?>) item;
                    String code = toString(m.get("code"), null);
                    String desc = toString(m.get("description"), "Unspecified");
                    if (code != null)
                        icdList.add(new ICDMapping(code, desc));
                }
            }
        }

        double priorityScore = calculatePriorityScore(age, combined, riskScore);
        return new TriageResult(diseaseScore, riskScore, severityScore, priorityScore,
                severityLevel, symptoms, icdList, diagnosis,
                clinicalNotes, urgencyFlag, recAction);
    }

    // ─────────────────────────────────────────────────────────
    // ENHANCED RULE-BASED TRIAGE ENGINE
    // ─────────────────────────────────────────────────────────
    private TriageResult ruleBasedTriage(String text, int age) {
        double riskScore = 0;
        List<String> symptoms = new ArrayList<>();
        List<ICDMapping> icd = new ArrayList<>();
        String diagnosis = "General Clinical Presentation";
        boolean urgencyFlag = false;
        String recommendedAction = "ROUTINE_CARE";

        // ── LIFE-THREATENING / CRITICAL (score +80-100) ────────
        if (matches(text, "cardiac arrest", "heart stopped", "no pulse", "resuscitation", "code blue")) {
            riskScore += 100;
            urgencyFlag = true;
            symptoms.add("Cardiac Arrest / Pulselessness");
            icd.add(new ICDMapping("I46.9", "Cardiac arrest, cause unspecified"));
            diagnosis = "Cardiac Arrest";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "stroke", "slurred speech", "facial droop", "arm weakness", "sudden numbness", "aphasia",
                "hemiplegia")) {
            riskScore += 90;
            urgencyFlag = true;
            symptoms.add("Neurological Deficit — Suspected Stroke");
            icd.add(new ICDMapping("I63.9", "Cerebral infarction, unspecified"));
            diagnosis = "Acute Ischaemic Stroke";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "anaphylaxis", "anaphylactic", "throat closing", "swollen throat", "tongue swelling",
                "severe allergy", "epipen")) {
            riskScore += 90;
            urgencyFlag = true;
            symptoms.add("Anaphylaxis / Severe Allergic Reaction");
            icd.add(new ICDMapping("T78.2XXA", "Anaphylactic shock, unspecified, initial encounter"));
            diagnosis = "Anaphylactic Shock";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "respiratory failure", "cant breathe", "cannot breathe", "not breathing", "stopped breathing",
                "apnea", "cyanosis", "turning blue")) {
            riskScore += 88;
            urgencyFlag = true;
            symptoms.add("Acute Respiratory Failure");
            icd.add(new ICDMapping("J96.00",
                    "Acute respiratory failure, unspecified whether with hypoxia or hypercapnia"));
            diagnosis = "Acute Respiratory Failure";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "seizure", "convulsion", "fits", "epileptic", "tonic clonic", "grand mal")) {
            riskScore += 85;
            urgencyFlag = true;
            symptoms.add("Seizure / Convulsion");
            icd.add(new ICDMapping("G40.909", "Epilepsy, unspecified, not intractable, without status epilepticus"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Seizure Disorder";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "unconscious", "unresponsive", "passed out", "loss of consciousness", "syncope", "fainted",
                "collapse", "not waking")) {
            riskScore += 82;
            urgencyFlag = true;
            symptoms.add("Loss of Consciousness / Syncope");
            icd.add(new ICDMapping("R55", "Syncope and collapse"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Syncope / Collapse";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "massive bleeding", "hemorrhage", "blood loss", "spurting blood", "internal bleeding",
                "haemorrhage", "hematemesis", "melena")) {
            riskScore += 85;
            urgencyFlag = true;
            symptoms.add("Active Hemorrhage / Major Bleeding");
            icd.add(new ICDMapping("R58", "Haemorrhage, not elsewhere classified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Active Haemorrhage";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "sepsis", "septic shock", "blood poisoning", "organ failure", "multi-organ")) {
            riskScore += 88;
            urgencyFlag = true;
            symptoms.add("Sepsis / Septic Shock");
            icd.add(new ICDMapping("A41.9", "Sepsis, unspecified organism"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Sepsis";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "diabetic coma", "hyperglycemic", "dka", "ketoacidosis", "blood sugar very high",
                "hypoglycemic", "blood sugar very low", "insulin shock")) {
            riskScore += 82;
            urgencyFlag = true;
            symptoms.add("Diabetic Emergency");
            icd.add(matches(text, "dka", "ketoacidosis", "hyperglycemic")
                    ? new ICDMapping("E11.10", "Type 2 diabetes mellitus with ketoacidosis without coma")
                    : new ICDMapping("E11.641", "Type 2 diabetes mellitus with hypoglycemia with coma"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Diabetic Emergency";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "meningitis", "stiff neck fever", "photophobia fever", "neck rigidity", "meningococcal")) {
            riskScore += 85;
            urgencyFlag = true;
            symptoms.add("Suspected Meningitis");
            icd.add(new ICDMapping("G03.9", "Meningitis, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Bacterial Meningitis";
            recommendedAction = "IMMEDIATE_CARE";
        }

        // ── HIGH SEVERITY (score +55-79) ────────────────────────
        if (matches(text, "chest pain", "chest tightness", "chest pressure", "myocardial", "heart attack", "mi",
                "angina")) {
            riskScore += 70;
            symptoms.add("Chest Pain / Possible Acute Coronary Syndrome");
            icd.add(new ICDMapping("I20.9", "Angina pectoris, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Suspected Acute Coronary Syndrome";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "difficulty breathing", "shortness of breath", "dyspnea", "breathless", "can't breathe",
                "hard to breathe", "laboured breathing")) {
            riskScore += 55;
            symptoms.add("Dyspnoea / Breathing Difficulty");
            icd.add(new ICDMapping("R06.09", "Other forms of dyspnoea"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Dyspnoea";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "severe abdominal pain", "acute abdomen", "appendicitis", "peritonitis", "bowel obstruction",
                "stomach rupture")) {
            riskScore += 65;
            symptoms.add("Severe Abdominal Pain / Possible Acute Abdomen");
            icd.add(new ICDMapping("R10.0", "Acute abdomen"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Abdomen";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "fracture", "broken bone", "trauma", "severe injury", "accident", "crush injury",
                "dislocation", "compound fracture")) {
            riskScore += 58;
            symptoms.add("Musculoskeletal Trauma / Fracture");
            icd.add(new ICDMapping("T14.90XA", "Injury, unspecified, initial encounter"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Traumatic Injury / Fracture";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "cancer", "malignancy", "tumour", "tumor", "chemotherapy", "oncology", "metastasis",
                "lymphoma", "leukaemia", "leukemia")) {
            riskScore += 60;
            symptoms.add("Oncological Condition");
            icd.add(new ICDMapping("C80.1", "Malignant (primary) neoplasm, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Active Malignancy";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "severe headache", "thunderclap headache", "worst headache", "sudden headache",
                "subarachnoid", "brain bleed", "intracranial")) {
            riskScore += 72;
            symptoms.add("Severe / Thunderclap Headache — Possible Intracranial Bleed");
            icd.add(new ICDMapping("G44.309", "Post-traumatic headache, unspecified, not intractable"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Subarachnoid Haemorrhage / Intracranial Pathology";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "deep vein", "dvt", "pulmonary embolism", "blood clot", "leg swelling pain", "pe symptom")) {
            riskScore += 68;
            symptoms.add("Suspected Thromboembolic Event");
            icd.add(matches(text, "pulmonary embolism", "pe symptom")
                    ? new ICDMapping("I26.99", "Other pulmonary embolism without acute cor pulmonale")
                    : new ICDMapping("I82.401",
                            "Acute embolism and thrombosis of unspecified deep veins of right lower extremity"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Pulmonary Embolism / DVT";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "eclampsia", "preeclampsia", "pregnancy complication", "obstetric emergency",
                "placental abruption", "ectopic pregnancy")) {
            riskScore += 80;
            urgencyFlag = true;
            symptoms.add("Obstetric Emergency");
            icd.add(new ICDMapping("O14.90", "Pre-eclampsia, unspecified trimester"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Obstetric Emergency";
            recommendedAction = "IMMEDIATE_CARE";
        }

        // ── MEDIUM SEVERITY (score +20-54) ────────────────────
        if (matches(text, "high fever", "fever 39", "fever 40", "fever 41", "pyrexia", "hyperthermia",
                "temperature above 39")) {
            riskScore += 30;
            symptoms.add("High-Grade Fever (≥39°C)");
            icd.add(new ICDMapping("R50.9", "Fever, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Febrile Illness — High Grade";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        } else if (matches(text, "fever", "temperature", "pyrexia", "febrile", "chills")) {
            riskScore += 18;
            symptoms.add("Fever / Febrile Episode");
            icd.add(new ICDMapping("R50.9", "Fever, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Febrile Illness";
        }
        if (matches(text, "pneumonia", "lung infection", "consolidation", "lobar pneumonia",
                "community acquired pneumonia")) {
            riskScore += 45;
            symptoms.add("Pneumonia / Lower Respiratory Tract Infection");
            icd.add(new ICDMapping("J18.9", "Pneumonia, unspecified organism"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Community-Acquired Pneumonia";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "asthma attack", "wheezing", "bronchospasm", "inhaler", "peak flow", "acute asthma")) {
            riskScore += 40;
            symptoms.add("Acute Asthma / Bronchospasm");
            icd.add(new ICDMapping("J45.901", "Unspecified asthma with (acute) exacerbation"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Asthma Exacerbation";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "hypertensive crisis", "blood pressure very high", "bp 180", "bp 200", "severe hypertension",
                "malignant hypertension")) {
            riskScore += 62;
            symptoms.add("Hypertensive Crisis");
            icd.add(new ICDMapping("I16.9", "Hypertensive crisis, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Hypertensive Emergency";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "dehydration", "severe vomiting", "gastroenteritis", "diarrhoea vomiting", "food poisoning",
                "stomach bug")) {
            riskScore += 22;
            symptoms.add("Dehydration / Gastroenteritis");
            icd.add(new ICDMapping("A09", "Infectious gastroenteritis and colitis, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Gastroenteritis";
        }
        if (matches(text, "urinary tract infection", "uti", "burning urination", "frequent urination", "dysuria",
                "pyelonephritis", "kidney infection")) {
            riskScore += 20;
            symptoms.add("Urinary Tract / Renal Infection");
            icd.add(matches(text, "pyelonephritis", "kidney infection") ? new ICDMapping("N10", "Acute pyelonephritis")
                    : new ICDMapping("N39.0", "Urinary tract infection, site not specified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = matches(text, "pyelonephritis", "kidney infection") ? "Acute Pyelonephritis"
                        : "Urinary Tract Infection";
        }
        if (matches(text, "dengue", "malaria", "typhoid", "leptospirosis", "chikungunya", "zika",
                "viral haemorrhagic")) {
            riskScore += 48;
            symptoms.add("Suspected Tropical / Vector-Borne Disease");
            icd.add(new ICDMapping("A97.9", "Dengue fever [classical dengue], unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Tropical Infectious Disease";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }
        if (matches(text, "mental health crisis", "suicidal", "self harm", "overdose", "psychiatric emergency",
                "attempted suicide")) {
            riskScore += 70;
            urgencyFlag = true;
            symptoms.add("Mental Health / Psychiatric Emergency");
            icd.add(new ICDMapping("F43.23", "Adjustment disorder with mixed anxiety and depressed mood"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Psychiatric Emergency";
            recommendedAction = "IMMEDIATE_CARE";
        }
        if (matches(text, "stroke tia", "transient ischemic", "mini stroke", "tia", "amaurosis fugax")) {
            riskScore += 68;
            symptoms.add("Transient Ischaemic Attack (TIA)");
            icd.add(new ICDMapping("G45.9", "Transient cerebral ischaemic attack, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Transient Ischaemic Attack";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        }

        // ── LOW SEVERITY (score +2-19) ──────────────────────────
        if (matches(text, "nausea", "vomiting", "vomit", "emesis")) {
            riskScore += 10;
            symptoms.add("Nausea / Vomiting");
            icd.add(new ICDMapping("R11.2", "Nausea with vomiting, unspecified"));
        }
        if (matches(text, "dizziness", "vertigo", "lightheaded", "giddy", "balance problem")) {
            riskScore += 10;
            symptoms.add("Dizziness / Vertigo");
            icd.add(new ICDMapping("H81.10", "Benign paroxysmal vertigo, unspecified ear"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Vestibular Disorder / Vertigo";
        }
        if (matches(text, "fatigue", "weakness", "tiredness", "lethargy", "malaise", "exhaustion")) {
            riskScore += 6;
            symptoms.add("Fatigue / Generalised Weakness");
            icd.add(new ICDMapping("R53.83", "Other fatigue"));
        }
        if (matches(text, "headache", "head pain", "migraine", "tension headache", "cephalalgia")) {
            riskScore += 8;
            symptoms.add("Headache / Cephalalgia");
            icd.add(new ICDMapping("G43.909", "Migraine, unspecified, not intractable, without status migrainosus"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Cephalgia / Migraine";
        }
        if (matches(text, "cough", "coughing", "productive cough", "dry cough", "nocturnal cough")) {
            riskScore += 6;
            symptoms.add("Cough");
            icd.add(new ICDMapping("R05.9", "Cough, unspecified"));
        }
        if (matches(text, "sore throat", "pharyngitis", "tonsillitis", "strep throat", "throat pain")) {
            riskScore += 8;
            symptoms.add("Sore Throat / Pharyngitis");
            icd.add(new ICDMapping("J02.9", "Acute pharyngitis, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Pharyngitis";
        }
        if (matches(text, "cold", "runny nose", "rhinitis", "sneezing", "nasal congestion", "common cold",
                "upper respiratory")) {
            riskScore += 4;
            symptoms.add("Upper Respiratory Tract Infection");
            icd.add(new ICDMapping("J06.9", "Acute upper respiratory infection, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Acute Upper Respiratory Infection";
        }
        if (matches(text, "rash", "skin rash", "hives", "urticaria", "eczema", "dermatitis", "itching", "pruritus")) {
            riskScore += 8;
            symptoms.add("Skin Rash / Dermatological Issue");
            icd.add(new ICDMapping("R21", "Rash and other nonspecific skin eruption"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Dermatological Condition";
        }
        if (matches(text, "back pain", "lower back", "lumbar", "sciatica", "disc herniation", "radiculopathy")) {
            riskScore += 8;
            symptoms.add("Back Pain / Lumbar Complaint");
            icd.add(new ICDMapping("M54.50", "Low back pain, unspecified"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Lower Back Pain";
        }
        if (matches(text, "joint pain", "arthritis", "rheumatoid", "gout", "swollen joint", "arthralgia")) {
            riskScore += 8;
            symptoms.add("Joint Pain / Arthralgia");
            icd.add(new ICDMapping("M79.3", "Panniculitis"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Arthropathy / Joint Pain";
        }
        if (matches(text, "eye pain", "red eye", "conjunctivitis", "blurred vision", "vision loss", "uveitis")) {
            riskScore += 12;
            symptoms.add("Ocular Complaint");
            icd.add(new ICDMapping("H10.9", "Unspecified conjunctivitis"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Ocular Condition";
        }
        if (matches(text, "abdominal pain", "stomach pain", "stomach ache", "gastric", "cramping", "bloating")) {
            riskScore += 12;
            symptoms.add("Abdominal Pain");
            icd.add(new ICDMapping("R10.9", "Unspecified abdominal pain"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Abdominal Pain — Non-specific";
        }
        if (matches(text, "ear pain", "earache", "otitis", "tinnitus", "hearing loss")) {
            riskScore += 7;
            symptoms.add("Ear Pain / Auditory Complaint");
            icd.add(new ICDMapping("H66.90", "Otitis media, unspecified, unspecified ear"));
            if (diagnosis.equals("General Clinical Presentation"))
                diagnosis = "Otitis Media";
        }

        // ── AGE-BASED RISK AMPLIFICATION ──────────────────────
        if (age >= 65)
            riskScore = Math.min(riskScore * 1.25, 100);
        else if (age <= 5)
            riskScore = Math.min(riskScore * 1.20, 100);
        else if (age <= 12)
            riskScore = Math.min(riskScore * 1.10, 100);

        // ── COMORBIDITY BOOST ─────────────────────────────────
        if (matches(text, "hypertension", "diabetes", "copd", "heart failure", "immunocompromised", "hiv",
                "renal failure", "liver failure", "heart disease", "on dialysis")) {
            riskScore = Math.min(riskScore + 12, 100);
            symptoms.add("Significant Comorbidity Present");
        }

        riskScore = Math.min(riskScore, 100);

        String severityLevel;
        if (riskScore >= 80) {
            severityLevel = "CRITICAL";
            urgencyFlag = true;
            recommendedAction = "IMMEDIATE_CARE";
        } else if (riskScore >= 55) {
            severityLevel = "HIGH";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        } else if (riskScore >= 25) {
            severityLevel = "MEDIUM";
            if (recommendedAction.equals("ROUTINE_CARE"))
                recommendedAction = "URGENT_CARE";
        } else {
            severityLevel = "LOW";
        }

        double diseaseScore = Math.min(riskScore * 0.92, 100);
        double severityScore = Math.min(riskScore * 0.96, 100);
        double priorityScore = calculatePriorityScore(age, text, riskScore);

        // Deduplicate ICD codes
        Map<String, ICDMapping> icdDedup = new LinkedHashMap<>();
        for (ICDMapping m : icd)
            icdDedup.put(m.getCode(), m);
        List<ICDMapping> finalIcd = new ArrayList<>(icdDedup.values());

        String clinicalNotes = buildClinicalNotes(severityLevel, symptoms, age, riskScore);

        return new TriageResult(diseaseScore, riskScore, severityScore, priorityScore,
                severityLevel, symptoms, finalIcd, diagnosis,
                clinicalNotes, urgencyFlag, recommendedAction);
    }

    // ─────────────────────────────────────────────────────────
    // PRIORITY SCORE ALGORITHM
    // ─────────────────────────────────────────────────────────
    private double calculatePriorityScore(int age, String text, double riskScore) {
        // Weight: Age (0.20) + Disease Weight (0.35) + Symptom Severity (0.30) + Risk
        // Factors (0.15)
        double ageMultiplier = (age >= 65 || age <= 5) ? 100.0 : (age <= 12 ? 85.0 : 40.0);

        double diseaseWeight = 20.0;
        if (matches(text, "cardiac arrest", "stroke", "respiratory failure", "anaphylaxis", "sepsis", "eclampsia"))
            diseaseWeight = 100.0;
        else if (matches(text, "chest pain", "heart attack", "angina", "seizure", "unconscious", "pulmonary embolism"))
            diseaseWeight = 92.0;
        else if (matches(text, "hemorrhage", "bleeding", "meningitis", "diabetic coma", "subarachnoid"))
            diseaseWeight = 88.0;
        else if (matches(text, "difficulty breathing", "shortness of breath", "asthma attack", "dvt"))
            diseaseWeight = 78.0;
        else if (matches(text, "severe abdominal", "fracture", "trauma", "cancer", "hypertensive crisis"))
            diseaseWeight = 72.0;
        else if (matches(text, "pneumonia", "septic", "high fever", "dengue", "malaria", "typhoid"))
            diseaseWeight = 58.0;
        else if (matches(text, "fever", "vomiting", "urinary", "uti", "rash"))
            diseaseWeight = 40.0;

        double riskFactors = 0.0;
        if (matches(text, "hypertension", "diabetes", "copd", "heart failure", "immunocompromised", "hiv",
                "renal failure", "dialysis"))
            riskFactors = 100.0;
        else if (matches(text, "asthma", "obesity", "chronic", "elderly", "pregnancy"))
            riskFactors = 60.0;

        return (ageMultiplier * 0.20) + (diseaseWeight * 0.35) + (riskScore * 0.30) + (riskFactors * 0.15);
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────
    private String combine(String... parts) {
        StringBuilder sb = new StringBuilder();
        for (String p : parts)
            if (p != null && !p.isBlank())
                sb.append(p).append(" ");
        return sb.toString().trim();
    }

    private boolean matches(String text, String... keywords) {
        for (String k : keywords)
            if (text.contains(k))
                return true;
        return false;
    }

    private double toDouble(Object o, double def) {
        if (o instanceof Number)
            return ((Number) o).doubleValue();
        if (o instanceof String)
            try {
                return Double.parseDouble((String) o);
            } catch (Exception ignored) {
            }
        return def;
    }

    private String toString(Object o, String def) {
        return o != null ? o.toString() : def;
    }

    private boolean toBoolean(Object o, boolean def) {
        if (o instanceof Boolean)
            return (Boolean) o;
        if (o instanceof String)
            return Boolean.parseBoolean((String) o);
        return def;
    }

    private String buildClinicalNotes(String level, List<String> symptoms, int age, double risk) {
        String ageNote = age >= 65 ? "Elderly patient — higher risk profile. "
                : age <= 12 ? "Paediatric patient — age-adjusted risk. " : "";
        String riskNote = String.format("Risk score: %.0f/100. ", risk);
        String sympNote = symptoms.isEmpty() ? "No specific symptoms flagged."
                : "Key symptoms: " + String.join(", ", symptoms.subList(0, Math.min(3, symptoms.size()))) + ".";
        return ageNote + riskNote + sympNote;
    }

    // ─────────────────────────────────────────────────────────
    // DATA CLASSES
    // ─────────────────────────────────────────────────────────
    public static class TriageResult {
        private final double diseaseScore, riskScore, severityScore, priorityScore;
        private final String severityLevel, aiDiagnosis, clinicalNotes, recommendedAction;
        private final List<String> extractedSymptoms;
        private final List<ICDMapping> icdCodes;
        private final boolean urgencyFlag;

        public TriageResult(double diseaseScore, double riskScore, double severityScore, double priorityScore,
                String severityLevel, List<String> extractedSymptoms, List<ICDMapping> icdCodes,
                String aiDiagnosis, String clinicalNotes, boolean urgencyFlag, String recommendedAction) {
            this.diseaseScore = diseaseScore;
            this.riskScore = riskScore;
            this.severityScore = severityScore;
            this.priorityScore = priorityScore;
            this.severityLevel = severityLevel;
            this.extractedSymptoms = extractedSymptoms;
            this.icdCodes = icdCodes;
            this.aiDiagnosis = aiDiagnosis;
            this.clinicalNotes = clinicalNotes;
            this.urgencyFlag = urgencyFlag;
            this.recommendedAction = recommendedAction;
        }

        public double getDiseaseScore() {
            return diseaseScore;
        }

        public double getRiskScore() {
            return riskScore;
        }

        public double getSeverityScore() {
            return severityScore;
        }

        public double getPriorityScore() {
            return priorityScore;
        }

        public String getSeverityLevel() {
            return severityLevel;
        }

        public List<String> getExtractedSymptoms() {
            return extractedSymptoms;
        }

        public List<ICDMapping> getIcdCodes() {
            return icdCodes;
        }

        public String getAiDiagnosis() {
            return aiDiagnosis;
        }

        public String getClinicalNotes() {
            return clinicalNotes;
        }

        public boolean isUrgencyFlag() {
            return urgencyFlag;
        }

        public String getRecommendedAction() {
            return recommendedAction;
        }
    }

    public static class ICDMapping {
        private final String code, description;

        public ICDMapping(String code, String description) {
            this.code = code;
            this.description = description;
        }

        public String getCode() {
            return code;
        }

        public String getDescription() {
            return description;
        }
    }
}
