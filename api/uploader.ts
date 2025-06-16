import type { VercelRequest, VercelResponse } from '@vercel/node'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: { bodyParser: false }
}

const allowedExtensions = [
  ".3ds", ".7z", ".aac", ".accdb", ".aiff", ".amr", ".apk", ".appimage", ".asp", ".avi",
  ".bat", ".bin", ".blend", ".bmp", ".bz2", ".config", ".css", ".csv", ".dat", ".deb", ".docx",
  ".dmg", ".env", ".eot", ".exe", ".fbx", ".flac", ".fnt", ".gif", ".go", ".gz", ".htm", ".html",
  ".ico", ".ini", ".iso", ".jar", ".java", ".jpeg", ".jpg", ".js", ".json", ".jsp", ".less", ".log",
  ".lua", ".lz", ".md", ".mdb", ".mid", ".mkv", ".mov", ".mp3", ".mp4", ".mpa", ".mpg", ".msi", ".mtl",
  ".odp", ".ods", ".odt", ".ogg", ".otf", ".pdf", ".php", ".png", ".pptx", ".ps1", ".py", ".rar", ".rb",
  ".rpm", ".rst", ".sass", ".scss", ".sh", ".skp", ".sql", ".svg", ".svgz", ".tar", ".tiff", ".toml",
  ".ts", ".tsx", ".ttf", ".txt", ".vue", ".wav", ".webm", ".webp", ".wma", ".woff", ".woff2", ".wmv",
  ".xml", ".yaml", ".zip"
]

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename)
  return base.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST method is allowed' })

  const form = formidable({ maxFileSize: 100 * 1024 * 1024 })

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) return res.status(400).json({ error: 'Invalid upload or file missing' })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const fileBuffer = fs.readFileSync(file.filepath)
    const ext = path.extname(file.originalFilename || '').toLowerCase()

    if (!allowedExtensions.includes(ext)) {
      return res.status(415).json({ error: `Unsupported file type: ${ext}` })
    }

    const safeName = sanitizeFilename(file.originalFilename || `upload-${Date.now()}${ext}`)
    const uploadPath = `public/${safeName}`

    const githubRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/${uploadPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'furina-uploader',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `upload ${safeName}`,
        content: fileBuffer.toString('base64'),
        branch: process.env.GITHUB_BRANCH || 'main',
      })
    })

    const result = await githubRes.json()

    if (!result?.content?.download_url) {
      return res.status(500).json({ error: 'Upload failed', detail: result })
    }

    return res.status(200).json({
      filename: safeName,
      url: `https://${process.env.CUSTOM_DOMAIN}/uploader/${safeName}`
    })
  })
  }
