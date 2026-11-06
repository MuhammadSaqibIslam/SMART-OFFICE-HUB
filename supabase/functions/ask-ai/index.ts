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

    // Get conversation history (last 10 messages for context)
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Retrieve relevant database context
    const context = await gatherContext(supabase, question)

    // Build messages for Gemini
    const systemPrompt = buildSystemPrompt(context)
    const messages = [
      ...(history || []).map((m: { role: string; content: string }) => ({
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
            maxOutputTokens: 1024,
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
    const answer = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
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

async function gatherContext(supabase: SupabaseClient, question: string): Promise<string> {
  const q = question.toLowerCase()
  const sections: string[] = []

  // Always fetch summary stats
  const [inventoryRes, assetsRes, employeesRes] = await Promise.all([
    supabase.from('inventory_items').select('id, name, quantity, min_stock_threshold, unit, location, category_id'),
    supabase.from('hardware_assets').select('id, name, asset_type, serial_number, status, brand, model, location'),
    supabase.from('employees').select('id, full_name, employee_id, email, department, job_title, status'),
  ])

  const inventory = inventoryRes.data || []
  const assets = assetsRes.data || []
  const employees = employeesRes.data || []

  // Inventory context
  if (q.match(/inventory|stock|supply|item|keyboard|paper|pen|chair|furniture|stationery|office|low|reorder|available|quantity/)) {
    const lowStock = inventory.filter((i: any) => i.quantity <= i.min_stock_threshold)
    const outOfStock = inventory.filter((i: any) => i.quantity === 0)

    sections.push(`INVENTORY DATA (${inventory.length} items total):`)
    inventory.forEach((i: any) => {
      const status = i.quantity === 0 ? 'OUT OF STOCK' : i.quantity <= i.min_stock_threshold ? 'LOW STOCK' : 'In Stock'
      sections.push(`- ${i.name}: ${i.quantity} ${i.unit} (min: ${i.min_stock_threshold}) [${status}]${i.location ? ` Location: ${i.location}` : ''}`)
    })
    if (lowStock.length > 0) {
      sections.push(`\nLOW STOCK ITEMS (${lowStock.length}): ${lowStock.map((i: any) => i.name).join(', ')}`)
    }
    if (outOfStock.length > 0) {
      sections.push(`OUT OF STOCK (${outOfStock.length}): ${outOfStock.map((i: any) => i.name).join(', ')}`)
    }
  }

  // Asset context
  if (q.match(/asset|laptop|monitor|device|hardware|assign|who has|unassign|missing|maintenance|serial/)) {
    // Get assignments with employee names
    const { data: assignments } = await supabase
      .from('asset_assignments')
      .select('asset_id, employee_id, status, assigned_date')
      .eq('status', 'active')

    const activeAssignments = assignments || []

    sections.push(`\nHARDWARE ASSETS (${assets.length} total):`)
    for (const a of assets) {
      const assignment = activeAssignments.find((as: any) => as.asset_id === a.id)
      let assignedTo = 'Unassigned'
      if (assignment) {
        const emp = employees.find((e: any) => e.id === assignment.employee_id)
        assignedTo = emp ? `Assigned to ${emp.full_name}` : 'Assigned (unknown employee)'
      }
      sections.push(`- ${a.name} | Type: ${a.asset_type} | ${a.brand || ''} ${a.model || ''} | Serial: ${a.serial_number || 'N/A'} | Status: ${a.status} | ${assignedTo}`)
    }

    const available = assets.filter((a: any) => a.status === 'available').length
    const assigned = assets.filter((a: any) => a.status === 'assigned').length
    const missing = assets.filter((a: any) => a.status === 'missing').length
    const maintenance = assets.filter((a: any) => a.status === 'under_maintenance').length
    sections.push(`\nASSET SUMMARY: ${available} available, ${assigned} assigned, ${missing} missing, ${maintenance} under maintenance`)
  }

  // Employee context
  if (q.match(/employee|staff|who|department|people|team|sarah|john|ali|ahmed/i)) {
    sections.push(`\nEMPLOYEES (${employees.length} total):`)
    employees.forEach((e: any) => {
      sections.push(`- ${e.full_name} (${e.employee_id || 'No ID'}) | Dept: ${e.department || 'N/A'} | Title: ${e.job_title || 'N/A'} | Status: ${e.status}`)
    })

    // Employee asset assignments
    if (q.match(/assign|asset|device|laptop|has|given/)) {
      const { data: assignments } = await supabase
        .from('asset_assignments')
        .select('asset_id, employee_id')
        .eq('status', 'active')

      if (assignments && assignments.length > 0) {
        sections.push(`\nEMPLOYEE ASSIGNMENTS:`)
        for (const emp of employees) {
          const empAssignments = assignments.filter((a: any) => a.employee_id === emp.id)
          if (empAssignments.length > 0) {
            const assetNames = empAssignments.map((a: any) => {
              const asset = assets.find((as: any) => as.id === a.asset_id)
              return asset ? `${asset.name} (${asset.asset_type})` : 'Unknown asset'
            })
            sections.push(`- ${emp.full_name}: ${assetNames.join(', ')}`)
          }
        }
      }
    }
  }

  // Purchase requests context
  if (q.match(/purchase|request|order|pending|approved|pr-/i)) {
    const { data: prs } = await supabase
      .from('purchase_requests')
      .select('id, request_number, status, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (prs && prs.length > 0) {
      sections.push(`\nPURCHASE REQUESTS (${prs.length} recent):`)
      prs.forEach((pr: any) => {
        sections.push(`- ${pr.request_number}: Status=${pr.status} | Created: ${new Date(pr.created_at).toLocaleDateString()}`)
      })
    }
  }

  // If no specific match, provide general summary
  if (sections.length === 0) {
    sections.push(`GENERAL SUMMARY:`)
    sections.push(`- Total inventory items: ${inventory.length}`)
    sections.push(`- Total hardware assets: ${assets.length}`)
    sections.push(`- Total employees: ${employees.length}`)
    const lowStock = inventory.filter((i: any) => i.quantity <= i.min_stock_threshold)
    if (lowStock.length > 0) sections.push(`- Low stock items: ${lowStock.length}`)
    const missing = assets.filter((a: any) => a.status === 'missing')
    if (missing.length > 0) sections.push(`- Missing assets: ${missing.length}`)
  }

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

FORMATTING:
- Use markdown tables for structured data (assets, inventory lists).
- Use bullet points for simple lists.
- Bold important numbers and names.
- Keep responses short — don't repeat the entire database.

COMPANY DATA:
${dataContext}

Remember: Every fact you state must come from the COMPANY DATA above. If it's not there, say so.`
}
