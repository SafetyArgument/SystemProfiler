/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ProjectDetails, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function researchProjectLandscape(details: ProjectDetails): Promise<AnalysisResult> {
  const prompt = `Act as a High-Senior Regulatory Engineer, Systems Architect, and Graph Theory Specialist.
PROJECT DETAILS:
- Project Name: ${details.project}
- Jurisdiction (City/State): ${details.location}
- Application: ${details.application}
- Operational Context: ${details.context}

CORE OBJECTIVE:
Construct a SINGLE, FULLY COHESIVE Knowledge Graph of the application's engineering structure.

MANDATORY GRAPH CONSTRAINTS:
1. PHYSICAL BACKBONE: Identify 12-15 specific physical deliverables (Hardware).
2. VIRTUAL ASSOCIATION: Identify 5-8 virtual deliverables (Software/Data).
3. ABSOLUTE CONNECTIVITY (CRITICAL): 
   - THE GRAPH MUST BE A SINGLE, FULLY CONNECTED CLUSTER.
   - ZERO ORPHANED NODES OR FRAGMENTED CLUSTERS.
   - If two systems seem unrelated, you MUST invent a logic bridge (e.g. "Data Pipeline", "Management Interface", or "Power Source") to join them.
   - Every node MUST have at least one valid link connecting it to the core system structure.
4. REGULATORY INTEGRATION: 
   - Research top 10 applicable regulations.
   - Embed these as metadata (regulatoryReferences for nodes, regulatoryBasis for links).
   - NO nodes for standards.

QUALITY VALIDATION:
Check the resulting graph. If there are orphaned clusters, create the necessary physical or virtual connections to amalgamate the complete system into one cluster.

JSON SCHEMA:
{
  "nodes": [{
    "id": "unique_id", 
    "name": "Deliverable Name", 
    "type": "physical"|"virtual", 
    "description": "Functional description", 
    "regulatoryReferences": ["e.g. AS3000 Cl 4.2"]
  }],
  "links": [{
    "source": "id", 
    "target": "id", 
    "type": "physical"|"functional", 
    "label": "Nature of interface", 
    "regulatoryBasis": "Standard substantiation"
  }],
  "foundStandards": ["Full Standard Name 1", ...]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["physical", "virtual"] },
                  description: { type: Type.STRING },
                  regulatoryReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "name", "type", "description", "regulatoryReferences"],
              },
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["physical", "functional"] },
                  label: { type: Type.STRING },
                  regulatoryBasis: { type: Type.STRING },
                },
                required: ["source", "target", "type", "label", "regulatoryBasis"],
              },
            },
            foundStandards: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["nodes", "links", "foundStandards"],
        },
      },
    });

    const text = response.text || '{"nodes":[],"links":[],"foundStandards":[]}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Error researching project landscape:", error);
    return { nodes: [], links: [], foundStandards: [] };
  }
}
