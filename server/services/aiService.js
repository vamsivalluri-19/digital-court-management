const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. Using fallback simulation.");
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    return null;
  }
};

const generateCaseSummary = async (caseDetails) => {
  const prompt = `You are a Digital Court AI Legal Assistant. Analyze the following lawsuit details and provide:
1. A concise professional executive legal summary of the case.
2. A list of key legal issues, disputes, or core allegations.
3. Suggest the relevant sections of Indian law (e.g. CPC, CrPC, IT Act, etc.) that apply.
4. Suggested next steps for court proceedings.

Case Details:
- Case Number: ${caseDetails.caseNumber}
- Title: ${caseDetails.title}
- Jurisdiction / Type: ${caseDetails.type}
- Priority: ${caseDetails.priority}
- Petitioner Name: ${caseDetails.petitioner?.name || 'Unknown'}
- Respondent Name: ${caseDetails.respondentName}
- Description: ${caseDetails.description}

Provide a clean, well-formatted response using markdown suitable for displaying in a legal chamber portal.`;

  const geminiResponse = await callGemini(prompt);
  if (geminiResponse) {
    return geminiResponse;
  }

  // Fallback simulation
  const typeLabel = caseDetails.type.toUpperCase();
  return `[Simulated Assessment] Based on the filed petition under ${typeLabel} jurisdiction, the petitioner asserts a claim regarding "${caseDetails.title}". Key details of the grievance involve: ${caseDetails.description}. Under Indian Jurisprudence, this case touches upon core principles of ${getJurisdictionSection(caseDetails.type)}.`;
};

const getRelatedCases = async (caseType, caseTitle, caseDescription) => {
  const prompt = `You are an expert legal research assistant. Find 2 landmark Indian court judgments (Supreme Court or High Court) relevant to this lawsuit:
- Title: ${caseTitle}
- Type: ${caseType}
- Description: ${caseDescription}

Format the response as a JSON array of objects with exactly this structure:
[
  {
    "citation": "Name of Case (Year)",
    "description": "Brief description of the legal precedent established and how it applies to this type of case."
  }
]
Provide ONLY the raw JSON array block. Do not include markdown formatting, code blocks, or any introductory text.`;

  const geminiResponse = await callGemini(prompt);
  if (geminiResponse) {
    try {
      let cleanedJson = geminiResponse.trim();
      if (cleanedJson.startsWith("```json")) {
        cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
      }
      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error("Error parsing Gemini related cases JSON:", e, geminiResponse);
    }
  }

  // Fallback dataset
  const dataset = {
    civil: [
      { citation: "S.P. Gupta v. Union of India (1981)", description: "Dealt with locus standi in civil petitions and public litigation rights." },
      { citation: "Babu Ram v. Santokh Singh (2019)", description: "Precedent on civil property valuation and partition claims." }
    ],
    criminal: [
      { citation: "Lalita Kumari v. Govt. of UP (2014)", description: "Mandated the registration of FIR in cognizable offenses." },
      { citation: "State of Haryana v. Bhajan Lal (1992)", description: "Guidelines for quashing FIRs and criminal trial management." }
    ],
    family: [
      { citation: "Shayara Bano v. Union of India (2017)", description: "Landmark judgment outlining gender equality in personal family law." },
      { citation: "Naveen Kohli v. Neelu Kohli (2006)", description: "Dealt with irretrievable breakdown of marriage criteria." }
    ],
    property: [
      { citation: "Suraj Lamp & Industries v. State of Haryana (2011)", description: "Clarified validity of power of attorney sales of immovable property." },
      { citation: "Ravinder Kaur Grewal v. Manjit Kaur (2019)", description: "Key judgment on acquisition of title via adverse possession." }
    ],
    cyber_crime: [
      { citation: "Shreya Singhal v. Union of India (2015)", description: "Struck down Section 66A of the IT Act, defining online free speech limits." },
      { citation: "SMC Pneumatics v. Jogesh Kwatra (2001)", description: "First Indian case on cyber defamation and employer security liability." }
    ],
    consumer: [
      { citation: "Indian Medical Association v. V.P. Shantha (1995)", description: "Brought medical services under the consumer protection regulations." },
      { citation: "Lucknow Development Authority v. M.K. Gupta (1994)", description: "Expanded consumer forum powers to cover statutory government authorities." }
    ]
  };

  return dataset[caseType.toLowerCase()] || dataset.civil;
};

const answerFAQ = async (query, caseDetails, user) => {
  const prompt = `You are a Digital Court AI Legal Assistant inside the "CourtConnect" digital platform.
The user asking this question is logged in as a: ${user.role} (Name: ${user.name}).
They are asking a question about the active lawsuit: "${caseDetails.title}" (Case Number: ${caseDetails.caseNumber}).

Case Summary:
- Petitioner: ${caseDetails.petitioner?.name || 'Citizen'}
- Respondent: ${caseDetails.respondentName}
- Status: ${caseDetails.status}
- Assigned Lawyer: ${caseDetails.assignedLawyer?.name || 'Unassigned'}
- Assigned Judge: ${caseDetails.assignedJudge?.name || 'Unassigned'}

User's Question: "${query}"

Guidelines for your response:
1. Provide a direct, professional, and helpful answer to the user's question.
2. Tailor your perspective to their role:
   - If they are a CITIZEN, explain legal concepts simply and guide them on dashboard actions (like confirming hearings, uploading documents).
   - If they are a LAWYER, give precise legal suggestions, draft suggestions, citation references, or guidance on filings and e-signatures.
   - If they are a JUDGE, provide benched summaries, evidentiary outlines, and guidance on scheduling or digital orders.
3. Keep the response clean and formatted with markdown.`;

  const geminiResponse = await callGemini(prompt);
  if (geminiResponse) {
    return geminiResponse;
  }

  // Fallback simulation
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('hear') || lowerQuery.includes('date') || lowerQuery.includes('when')) {
    return "Hearing dates are scheduled by the Judge. Check 'Hearings & Timelines' tab.";
  }
  return `[Simulated Assistant] Thank you for asking. Under Digital Case Management guidelines, only authorized participants can perform actions on case ${caseDetails.caseNumber}. Please specify your request or refer to standard legal templates.`;
};

const getJurisdictionSection = (type) => {
  switch (type.toLowerCase()) {
    case 'civil': return 'Section 9 of the Civil Procedure Code';
    case 'criminal': return 'Code of Criminal Procedure and Indian Penal Code provisions';
    case 'family': return 'personal family status laws and Special Marriage acts';
    case 'property': return 'Transfer of Property Act and Specific Relief Act';
    case 'cyber_crime': return 'Information Technology Act, 2000';
    case 'consumer': return 'Consumer Protection Act, 2019';
    default: return 'the relevant constitutional provisions';
  }
};

module.exports = {
  generateCaseSummary,
  getRelatedCases,
  answerFAQ
};
