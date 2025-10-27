import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 🧩 Column IDs from environment
const MONDAY_NAME_COL_ID = process.env.MONDAY_NAME_COL_ID!;
const MONDAY_STATUS_COL_ID = process.env.MONDAY_STATUS_COL_ID!;
const MONDAY_PRIORITY_COL_ID = process.env.MONDAY_PRIORITY_COL_ID!;
const MONDAY_FILE_COL_ID = process.env.MONDAY_FILE_COL_ID!;
const MONDAY_DUEDATE_COL_ID = process.env.MONDAY_DUEDATE_COL_ID!;
const MONDAY_GRANT_ACCESS_COL_ID = process.env.MONDAY_GRANT_ACCESS_COL_ID!;
const MONDAY_FEEDBACK_COL_ID = process.env.MONDAY_FEEDBACK_COL_ID!;

interface MondayWebhookEvent {
  event: {
    type: string;
    pulseId: string;
    columnId?: string;
    value?: any;
    previousValue?: any;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  if (req.body?.challenge) return res.status(200).json({ challenge: req.body.challenge });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload safely
    let payload: MondayWebhookEvent;
    try {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      payload = req.body as any;
    }

    const { event } = payload || {};
    
    // ✅ FIX: Check pulseId - it might be under different keys
    const pulseId = event?.pulseId;
    
    if (!pulseId) {
      console.error('❌ Invalid payload - no pulseId found:', JSON.stringify(event, null, 2));
      return res.status(400).json({ error: 'Invalid webhook payload - missing pulseId' });
    }

    console.log('📍 Looking for pulseId:', pulseId);

    // ✅ FIX: Search by multiple possible columns
    let project;
    
    // First try: monday_item_id (your original field)
    let { data: foundProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('monday_item_id', pulseId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Supabase query error:', fetchError);
      throw fetchError;
    }

    // Second try: id field (in case pulseId is stored as id)
    if (!foundProject) {
      console.log('⚠️ Not found by monday_item_id, trying id field...');
      ({ data: foundProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', pulseId)
        .maybeSingle());

      if (fetchError) throw fetchError;
    }

    if (!foundProject) {
      console.warn('⚠️ Project not found. Checked fields: monday_item_id, id');
      console.warn('Looking for pulseId:', pulseId);
      
      // Log all projects for debugging
      const { data: allProjects } = await supabase.from('projects').select('id, monday_item_id, name');
      console.log('📋 All projects in DB:', allProjects);
      
      return res.status(404).json({ 
        error: 'Project not found',
        pulseId,
        message: 'Check if monday_item_id is correctly stored in Supabase'
      });
    }

    project = foundProject;
    console.log('✅ Found project:', project.id);

    const safeParse = (value: any) => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    };

    const v = safeParse(event.value);
    const updates: Record<string, any> = {};

    console.log('🔄 Processing columnId:', event.columnId, 'with value:', v);

    // 🧠 Dynamic column handling
    switch (event.columnId) {
      case MONDAY_STATUS_COL_ID:
        if (v?.label?.text) {
          updates.status = v.label.text;
        }
        break; 

      case MONDAY_PRIORITY_COL_ID:
      if (v?.label?.text) {
        const cleanText = v.label.text.replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g,
          ''
        ).trim();
        updates.priority = cleanText;
      }
      break;


      case MONDAY_FILE_COL_ID:
        if (v) {
          updates.file_url = v.url || v.text || event.value;
          updates.file_name = v.text || 'Project File';
        }
        break;

      case MONDAY_DUEDATE_COL_ID:
        if (v?.date) {
          updates.due_date = v.date;
        }
        break;

      case MONDAY_GRANT_ACCESS_COL_ID:
        updates.grant_view = v?.checked === true || v?.checked === 'true';
        break;

      case MONDAY_FEEDBACK_COL_ID:
        if (v?.text) {
          updates.feedback = v.text;
        }
        break;

      case MONDAY_NAME_COL_ID:
        if (v?.text) {
          updates.name = v.text;
        }
        break;

      default:
        console.log('⚠️ Unhandled columnId:', event.columnId);
    }

    console.log('🧩 Updates to apply:', updates);

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);

      if (updateError) throw updateError;
      console.log('✅ Updated project:', project.id);
    } else {
      console.warn('⚠️ No updates to apply');
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      projectId: project.id,
      updates,
    });
  } catch (err: any) {
    console.error('🔥 Webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}