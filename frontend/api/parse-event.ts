import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const systemInstruction = `You convert Vietnamese natural language event descriptions into strict JSON.
Rules:
- Output ONLY JSON. No code fences. No extra text.
- Times in Vietnam timezone (Asia/Ho_Chi_Minh). If date is missing, assume today; if year is omitted, assume the current calendar year; if time range lacking end, infer duration 60 minutes.
- Fields: title (string), category (one of: class, assignment, exam, work, personal), start_ts (ISO 8601), end_ts (ISO 8601), location (string or empty), description (string or empty).
- If the input suggests a deadline (e.g., nộp, deadline), use category=assignment and set start_ts=end_ts at the deadline time (default 23:59 if only date).`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })

    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {}
    const { text } = body
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction })
    const prompt = `Input: ${text}\nJSON:`
    const result = await model.generateContent([{ text: prompt }])
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const now = new Date()
    const hasYearInText = /(19|20)\d{2}/.test(text)
    let { title, category, start_ts, end_ts, location = '', description = '' } = parsed
    if (!title) title = text.slice(0, 60)
    if (!category) category = 'personal'

    let start = start_ts ? new Date(start_ts) : new Date(now)
    let end = end_ts ? new Date(end_ts) : new Date(start.getTime() + 60 * 60 * 1000)
    if (!hasYearInText) {
      const y = now.getFullYear()
      if (start.getFullYear() !== y) start.setFullYear(y)
      if (end.getFullYear() !== y) end.setFullYear(y)
    }
    if (end <= start) end = new Date(start.getTime() + 30 * 60 * 1000)

    return res.status(200).json({
      title,
      category,
      start_ts: start.toISOString(),
      end_ts: end.toISOString(),
      location,
      description,
    })
  } catch (e: any) {
    console.error('parse-event error', e)
    return res.status(500).json({ error: 'Failed to parse', detail: String(e?.message || e) })
  }
}

