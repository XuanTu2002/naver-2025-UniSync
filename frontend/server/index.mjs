import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config({ path: process.cwd() + '/.env' })

const app = express()
app.use(cors())
app.use(express.json())

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('GEMINI_API_KEY is not set. /api/parse-event will return 501.')
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null
const modelName = 'gemini-1.5-flash'

// Helper to ensure strict JSON
const systemInstruction = `You convert Vietnamese natural language event descriptions into strict JSON.
Rules:
- Output ONLY JSON. No code fences. No extra text.
- Times in Vietnam timezone (Asia/Ho_Chi_Minh). If date is missing, assume today; if year is omitted, assume the current calendar year; if time range lacking end, infer duration 60 minutes.
- Fields: title (string), category (one of: class, assignment, exam, work, personal), start_ts (ISO 8601), end_ts (ISO 8601), location (string or empty), description (string or empty).
- If the input suggests a deadline (e.g., nộp, deadline), use category=assignment and set start_ts=end_ts at the deadline time (default 23:59 if only date).
Examples:
Input: Họp nhóm AI ngày mai 2 giờ chiều tại thư viện
JSON: {"title":"Họp nhóm AI","category":"work","start_ts":"<ISO>","end_ts":"<ISO>","location":"Thư viện","description":""}
Input: Nộp bài Toán thứ 6 lúc 17:00
JSON: {"title":"Nộp bài Toán","category":"assignment","start_ts":"<ISO>","end_ts":"<ISO>","location":"","description":""}`

app.post('/api/parse-event', async (req, res) => {
  const { text } = req.body ?? {}
  if (!text) return res.status(400).json({ error: 'text is required' })
  if (!genAI) return res.status(501).json({ error: 'Gemini not configured' })
  try {
    const model = genAI.getGenerativeModel({ model: modelName, systemInstruction })
    const prompt = `Input: ${text}\nJSON:`
    const result = await model.generateContent([{ text: prompt }])
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Basic post-processing: fill missing fields
    const now = new Date()
    const tzOffsetMs = 7 * 60 * 60 * 1000 // Asia/Ho_Chi_Minh (no DST)
    const toISO = (d) => new Date(d.getTime()).toISOString()

    let { title, category, start_ts, end_ts, location = '', description = '' } = parsed
    if (!title) title = text.slice(0, 60)
    if (!category) category = 'personal'

    let start = start_ts ? new Date(start_ts) : new Date(now.getTime())
    let end = end_ts ? new Date(end_ts) : new Date(start.getTime() + 60 * 60 * 1000)
    // If the model returned a different year but the user didn't specify a year, adjust to current year
    const hasYearInText = /(19|20)\d{2}/.test(text)
    const currentYear = now.getFullYear()
    if (!hasYearInText) {
      if (start.getFullYear() !== currentYear) start.setFullYear(currentYear)
      if (end.getFullYear() !== currentYear) end.setFullYear(currentYear)
    }
    // Ensure end after start
    if (end <= start) end = new Date(start.getTime() + 30 * 60 * 1000)

    return res.json({ title, category, start_ts: toISO(start), end_ts: toISO(end), location, description })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('parse-event error', e)
    return res.status(500).json({ error: 'Failed to parse', detail: String(e) })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`UniSync API listening on http://localhost:${port}`)
})
