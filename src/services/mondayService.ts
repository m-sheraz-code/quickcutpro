const MONDAY_API_URL = 'https://api.monday.com/v2';

interface MondayConfig {
  apiKey: string;
  boardId: string;
  groupId: string;
}

export class MondayService {
  private apiKey: string;
  private boardId: string;
  private groupId: string;

  // Column IDs from env - Only the columns you actually have
  private columns = {
    name: import.meta.env.MONDAY_NAME_COL_ID || 'name',
    status: import.meta.env.MONDAY_STATUS_COL_ID || 'project_status',
    priority: import.meta.env.MONDAY_PRIORITY_COL_ID || 'priority__1',
    file: import.meta.env.MONDAY_FILE_COL_ID || 'link__1',
    dueDate: import.meta.env.MONDAY_DUEDATE_COL_ID || 'date',
  };

  constructor(config: MondayConfig) {
    this.apiKey = config.apiKey;
    this.boardId = config.boardId;
    this.groupId = config.groupId;
  }

  // ─────────────────────────────────────────────
  // GENERIC REQUEST HANDLER
  // ─────────────────────────────────────────────
  private async makeRequest(query: string, variables?: any) {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Monday.com API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`Monday.com API error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  // ─────────────────────────────────────────────
  // CREATE ITEM (in specific group)
  // ─────────────────────────────────────────────
  async createItem(projectData: {
    name: string;
    status: string;
    priority: string;
    dueDate?: string;
    fileUrl?: string;
    fileName?: string;
  }) {
    const query = `
      mutation (
        $boardId: ID!,
        $groupId: String!,
        $itemName: String!,
        $columnValues: JSON!
      ) {
        create_item(
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    const c = this.columns;
    const columnValues: Record<string, any> = {};

    // ✅ Status (dropdown/select field)
    if (projectData.status && c.status) {
      columnValues[c.status] = { label: projectData.status };
    }

    // ✅ Priority (dropdown/select field)
    if (projectData.priority && c.priority) {
      columnValues[c.priority] = { label: projectData.priority };
    }

    // ✅ Due Date (must be YYYY-MM-DD format)
    if (projectData.dueDate && c.dueDate) {
      columnValues[c.dueDate] = { date: projectData.dueDate };
    }

    // ✅ File Link (link field)
    if (projectData.fileUrl && c.file) {
      columnValues[c.file] = {
        url: projectData.fileUrl,
        text: projectData.fileName || 'Project File',
      };
    }

    console.log('📤 Sending to Monday.com:', {
      itemName: projectData.name,
      columnValues,
    });

    const variables = {
      boardId: this.boardId,
      groupId: this.groupId,
      itemName: projectData.name,
      columnValues: JSON.stringify(columnValues),
    };

    try {
      const result = await this.makeRequest(query, variables);
      console.log('✅ Item created successfully:', result.create_item.id);
      return result.create_item.id;
    } catch (error) {
      console.error('❌ Error creating item:', error);
      console.error('📋 Column values sent:', JSON.stringify(columnValues, null, 2));
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE ITEM COLUMNS
  // ─────────────────────────────────────────────
  async updateItem(itemId: string, columnValues: any) {
    const query = `
      mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          board_id: $boardId,
          item_id: $itemId,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    const variables = {
      boardId: this.boardId,
      itemId,
      columnValues: JSON.stringify(columnValues),
    };

    try {
      await this.makeRequest(query, variables);
      console.log('✅ Item updated successfully:', itemId);
    } catch (error) {
      console.error('❌ Error updating item:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // ADD FEEDBACK (AS UPDATE)
  // ─────────────────────────────────────────────
  async addUpdate(itemId: string, message: string) {
    const query = `
      mutation ($itemId: ID!, $body: String!) {
        create_update(
          item_id: $itemId,
          body: $body
        ) {
          id
        }
      }
    `;

    const variables = { itemId, body: message };
    const result = await this.makeRequest(query, variables);
    return result.create_update.id;
  }

  // ─────────────────────────────────────────────
  // GET ITEM DETAILS
  // ─────────────────────────────────────────────
  async getItem(itemId: string) {
    const query = `
      query ($itemId: [ID!]) {
        items(ids: $itemId) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const variables = { itemId: [itemId] };
    const result = await this.makeRequest(query, variables);
    return result.items[0];
  }
}

// ─────────────────────────────────────────────
// FACTORY FUNCTION
// ─────────────────────────────────────────────
export function createMondayService(): MondayService | null {
  const apiKey = import.meta.env.VITE_MONDAY_API_KEY;
  const boardId = import.meta.env.VITE_MONDAY_BOARD_ID;
  const groupId = import.meta.env.VITE_MONDAY_GROUP_ID;

  if (!apiKey || !boardId || !groupId) {
    console.warn('⚠️ Monday.com credentials not configured');
    return null;
  }

  return new MondayService({ apiKey, boardId, groupId });
}