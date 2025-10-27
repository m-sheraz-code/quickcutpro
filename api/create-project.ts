import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, name, monday_item_id, priority, due_date, file_url, file_name } = req.body;

    const { error } = await supabase.from('projects').insert({
      user_id,
      name,
      status: 'Not Started',
      priority,
      monday_item_id,
      due_date,
      file_url,
      file_name,
    });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
