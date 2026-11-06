import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { conversation_id, question } = await req.json()
    if (!conversation_id || !question) {
      return new Response(JSON.stringify({ error: 'Missing conversation_id or question' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify conversation ownership
    const { data: conv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Latest messages for context, oldest first. The app saves the question before
    // calling this function, so drop it here: it is added back below.
    const { data: latest } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(11)
    const history = (latest || []).reverse()
    const last = history[history.length - 1]
    if (last?.role === 'user' && last.content === question) history.pop()

    // Retrieve relevant database context
    const context = await gatherContext(supabase)

    // Build messages for Gemini
    const systemPrompt = buildSystemPrompt(context)
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ]

    // Call Google Gemini
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured. Please set GEMINI_API_KEY.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini error:', errText)
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiResponse.json()
    const answerParts: { text?: string }[] = geminiData?.candidates?.[0]?.content?.parts || []
    const answer = answerParts.map((part) => part.text || '').join('').trim()
      || 'Sorry, I could not generate a response. Please try again.'

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ── Data Retrieval ──

interface SupabaseClient {
  from: (table: string) => any
}

// Sends all company records rather than picking sections from keywords in the
// question: keywords missed other languages, employee names and most device types.
async function gatherContext(supabase: SupabaseClient): Promise<string> {
  const [inventoryRes, categoriesRes, assetsRes, employeesRes, assignmentsRes, requestsRes] = await Promise.all([
    supabase.from('inventory_items').select('name, quantity, min_stock_threshold, unit, location, category_id'),
    supabase.from('inventory_categories').select('id, name'),
    supabase.from('hardware_assets').select('id, name, asset_type, serial_number, status, brand, model, location, warranty_expiry'),
    supabase.from('employees').select('id, full_name, employee_id, email, department, job_title, status'),
    supabase.from('asset_assignments').select('asset_id, employee_id, assigned_date').eq('status', 'active'),
    supabase
      .from('purchase_requests')
      .select('request_number, status, notes, created_at, purchase_request_items(item_name, quantity)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const failed = [inventoryRes, categoriesRes, assetsRes, employeesRes, assignmentsRes, requestsRes].find((res) => res.error)
  if (failed) throw failed.error

  const inventory = inventoryRes.data || []
  const categories = categoriesRes.data || []
  const assets = assetsRes.data || []
  const employees = employeesRes.data || []
  const assignments = assignmentsRes.data || []
  const requests = requestsRes.data || []
  const employeeName = (id: string) => employees.find((e: any) => e.id === id)?.full_name || 'unknown employee'
  const countByStatus = (status: string) => assets.filter((a: any) => a.status === status).length

  const stockStatus = (i: any) =>
    i.quantity === 0 ? 'OUT OF STOCK' : i.quantity <= i.min_stock_threshold ? 'LOW STOCK' : 'In Stock'

  const sections = [
    `TODAY: ${new Date().toISOString().slice(0, 10)}`,
    `\nINVENTORY (${inventory.length} items):`,
    ...inventory.map((i: any) => {
      const category = categories.find((c: any) => c.id === i.category_id)?.name || 'N/A'
      return `- ${i.name} | Category: ${category} | ${i.quantity} ${i.unit} | Min: ${i.min_stock_threshold} | ${stockStatus(i)} | Location: ${i.location || 'N/A'}`
    }),
    `\nHARDWARE ASSETS (${assets.length} total: ${countByStatus('available')} available, ${countByStatus('assigned')} assigned, ${countByStatus('under_maintenance')} under maintenance, ${countByStatus('missing')} missing, ${countByStatus('retired')} retired):`,
    ...assets.map((a: any) => {
      const assignment = assignments.find((x: any) => x.asset_id === a.id)
      const holder = assignment ? `Assigned to ${employeeName(assignment.employee_id)} since ${assignment.assigned_date}` : 'Not assigned'
      return `- ${a.name} | Type: ${a.asset_type} | ${a.brand || ''} ${a.model || ''} | Serial: ${a.serial_number || 'N/A'} | Status: ${a.status} | ${holder} | Location: ${a.location || 'N/A'} | Warranty until: ${a.warranty_expiry || 'N/A'}`
    }),
    `\nEMPLOYEES (${employees.length} total):`,
    ...employees.map((e: any) => {
      const held = assignments
        .filter((x: any) => x.employee_id === e.id)
        .map((x: any) => assets.find((a: any) => a.id === x.asset_id)?.name || 'unknown asset')
      return `- ${e.full_name} (${e.employee_id || 'No ID'}) | Dept: ${e.department || 'N/A'} | Title: ${e.job_title || 'N/A'} | Email: ${e.email || 'N/A'} | Status: ${e.status} | Devices: ${held.join(', ') || 'none'}`
    }),
    `\nPURCHASE REQUESTS (${requests.length} most recent):`,
    ...requests.map((r: any) => {
      const items = (r.purchase_request_items || []).map((i: any) => `${i.quantity} x ${i.item_name}`).join(', ') || 'no items'
      return `- ${r.request_number || 'No number'} | Status: ${r.status} | Created: ${r.created_at.slice(0, 10)} | Items: ${items} | Notes: ${r.notes || 'none'}`
    }),
  ]

  return sections.join('\n')
}

function buildSystemPrompt(dataContext: string): string {
  return `You are Ask AI, the official office inventory and hardware asset assistant inside Smart Office Hub.

YOUR ROLE:
- Help authorized users understand their company's actual inventory, stock, employees, and hardware asset records.
- Answer questions using ONLY the data provided below. Never invent, guess, or assume information.

RULES:
1. ONLY answer questions about: office inventory, stock availability, low-stock items, employees, hardware assets, asset assignments, asset returns, purchase requests.
2. Use ONLY the actual data provided in the COMPANY DATA section below. Never fabricate records.
3. If no matching data exists, say clearly: "I couldn't find that in your current records."
4. If a question is ambiguous (e.g., multiple employees with same name), ask for clarification.
5. Keep answers concise, clear, and well-formatted. Use tables or lists when showing multiple records.
6. For unrelated questions (jokes, weather, coding, personal advice, general knowledge): politely decline with a short, friendly, varied response and redirect to office topics.

LANGUAGE:
- Reply in the language and script the user writes in, including Roman Urdu. Keep record names exactly as they appear in the data.

FORMATTING:
- Use markdown tables for structured data (assets, inventory lists).
- Use bullet points for simple lists.
- Bold important numbers and names.
- Keep responses short — don't repeat the entire database.

COMPANY DATA:
${dataContext}

Remember: Every fact you state must come from the COMPANY DATA above. If it's not there, say so.`
}
