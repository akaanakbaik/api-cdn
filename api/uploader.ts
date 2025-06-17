import { IncomingForm } from 'formidable';
import { readFile } from 'fs/promises';
import { config } from 'dotenv';
import { Octokit } from '@octokit/rest';
import { extname } from 'path';

config();

export const configForm = {
  api: {
    bodyParser: false
  }
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const allowed = [
  '.jpeg','.jpg','.png','.gif','.webp','.svg','.bmp','.tiff','.avif','.heic',
  '.mp4','.webm','.avi','.mov','.mkv','.flv','.wmv','.ogv','.3gp','.ts',
  '.mp3','.wav','.ogg','.flac','.aac','.m4a','.wma','.amr','.aiff','.mid',
  '.pdf','.docx','.xlsx','.pptx','.odt','.ods','.odp','.txt','.csv','.json',
  '.xml','.yaml','.js','.ts','.vue','.jsx','.tsx','.css','.scss','.sass','.less',
  '.html','.htm','.php','.asp','.jsp','.rb','.py','.go','.lua','.sh','.bat',
  '.ps1','.sql','.db','.sqlite','.mdb','.accdb','.fnt','.ttf','.otf','.woff',
  '.woff2','.eot','.svgz','.md','.rst','.log','.gitignore','.env','.config',
  '.ini','.toml','.dat','.bin','.iso','.dmg','.exe','.apk','.appimage','.deb',
  '.rpm','.tar','.zip','.rar','.7z','.gz','.bz2','.xz','.lz','.skp','.blend',
  '.fbx','.obj','.stl','.3ds','.mtl'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = new IncomingForm({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err || !files.file) return res.status(400).json({ error: 'Upload failed' });

      const file = files.file;
      const buffer = await readFile(file.filepath);
      const ext = extname(file.originalFilename || '').toLowerCase();
      if (!allowed.includes(ext)) return res.status(415).json({ error: 'Unsupported file type' });

      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const path = `public/${name}`;

      await octokit.repos.createOrUpdateFileContents({
        owner: process.env.GITHUB_USERNAME,
        repo: process.env.GITHUB_REPO,
        path,
        message: `upload ${name}`,
        content: buffer.toString('base64'),
        branch: process.env.GITHUB_BRANCH
      });

      res.json({
        status: 'success',
        url: `${process.env.CUSTOM_DOMAIN}/uploader/${name}`,
        raw: `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/public/${name}`
      });
    } catch (e) {
      res.status(500).json({ error: 'Upload error', detail: e.message });
    }
  });
  }
