import axios from 'axios';
import type { FigmaField } from '../types/index.js';

export interface FigmaConfig {
  fileKey: string;
  nodeId: string;
  apiToken: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

export const extractFieldsFromFigma = async (
  config: FigmaConfig
): Promise<FigmaField[]> => {
  try {
    const { fileKey, nodeId, apiToken } = config;
    
    // Fetch Figma file
    const response = await axios.get(
      `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
      {
        headers: {
          'X-Figma-Token': apiToken,
        },
      }
    );

    const node = response.data.nodes[nodeId]?.document;
    if (!node) {
      throw new Error('Node not found in Figma file');
    }

    const fields: FigmaField[] = [];
    let orderCounter = 0;

    // Recursive function to traverse Figma tree
    const traverseNode = (
      currentNode: FigmaNode,
      section: string = '',
      subsection: string = '',
      screen: string = 'view'
    ) => {
      const nodeName = currentNode.name || '';

      // Detect sections (e.g., FRAME or SECTION with specific naming)
      if (currentNode.type === 'FRAME' || currentNode.type === 'SECTION') {
        const newSection = section || nodeName;
        
        if (currentNode.children) {
          currentNode.children.forEach(child => {
            traverseNode(child, newSection, subsection, screen);
          });
        }
      }
      // Detect subsections (e.g., GROUP)
      else if (currentNode.type === 'GROUP') {
        const newSubsection = nodeName;
        
        if (currentNode.children) {
          currentNode.children.forEach(child => {
            traverseNode(child, section, newSubsection, screen);
          });
        }
      }
      // Detect fields (e.g., TEXT, INPUT, RECTANGLE with text)
      else if (
        currentNode.type === 'TEXT' ||
        currentNode.type === 'RECTANGLE' ||
        currentNode.type === 'INSTANCE'
      ) {
        // Only add if it looks like a field (has meaningful name)
        if (nodeName && !nodeName.startsWith('_') && nodeName.trim()) {
          // Determine screen_name from node name or parent context
          let screenName = screen;
          if (nodeName.toLowerCase().includes('create')) screenName = 'create';
          else if (nodeName.toLowerCase().includes('edit')) screenName = 'edit';
          else if (nodeName.toLowerCase().includes('delete')) screenName = 'delete';
          else if (nodeName.toLowerCase().includes('view')) screenName = 'view';

          fields.push({
            section: section || 'Default Section',
            subsection: subsection || 'Default Subsection',
            field_name: nodeName,
            order: ++orderCounter,
            screen_name: screenName,
          });
        }
      }

      // Continue traversing children
      if (currentNode.children) {
        currentNode.children.forEach(child => {
          traverseNode(child, section, subsection, screen);
        });
      }
    };

    traverseNode(node);

    return fields;
  } catch (error) {
    console.error('Error fetching Figma data:', error);
    throw new Error(`Failed to fetch Figma data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};