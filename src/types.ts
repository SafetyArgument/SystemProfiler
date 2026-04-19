/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectDetails {
  project: string;
  location: string;
  application: string;
  context: string;
}

export interface DeliverableNode {
  id: string;
  name: string;
  type: 'physical' | 'virtual';
  description: string;
  regulatoryReferences: string[]; // Standards influencing this node
}

export interface DeliverableLink {
  source: string;
  target: string;
  type: 'physical' | 'functional';
  label: string;
  regulatoryBasis: string; // The specific rule or standard justifying this connection
}

export interface AnalysisResult {
  nodes: DeliverableNode[];
  links: DeliverableLink[];
  foundStandards: string[];
}
