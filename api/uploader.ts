const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

/** ekstensi yg di izinkan, klo perlu tambah aj sendiri, hehehe*/
const allowed = new Set([
  '.jpeg','.jpg','.png','.gif','.webp','.svg','.bmp','.tiff','.avif','.heic',
  '.mp4','.webm','.avi','.mov','.mkv','.flv','.wmv','.ogv','.3gp','.ts',
  '.mp3','.wav','.ogg','.flac','.aac','.m4a','.wma','.amr','.aiff','.mid',
  '.pdf','.docx','.xlsx','.pptx','.odt','.ods','.odp','.txt','.csv','.json',
  '.xml','.yaml','.js','.ts','.vue','.jsx','.tsx','.css','.scss','.sass',
  '.less','.html','.htm','.php','.asp','.jsp','.rb','.py','.go','.lua','.sh','.bat','.ps1',
  '.sql','.db','.sqlite','.mdb','.accdb','.fnt','.ttf','.otf','.woff','.woff2','.eot','.svgz',
  '.md','.rst','.log','.gitignore','.env','.ini','.config','.toml','.dat','.bin',
  '.iso','.dmg','.exe','.apk','.appimage','.deb','.rpm','.tar','.zip','.rar','.7z','.gz','.bz2','.xz','.lz',
  '.skp','.blend','.fbx','.obj','.stl','.3ds','.mtl'
]);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode harus POST' });
  }

  const form = formidable({ maxFileSize: 100 * 1024 * 1024 }); // limit upload nya 100 embe
  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'Upload gagal atau tidak ada file' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const ext = path.extname(file.originalFilename).toLowerCase();

    if (!allowed.has(ext)) {
      return res.status(415).json({ error: `Tipe file tidak didukung: ${ext}` });
    }

    const data = fs.readFileSync(file.filepath);
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const filename = `${id}${ext}`;
    const content = data.toString('base64');

    const ghUrl = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/contents/public/${filename}`;
    try {
      await axios.put(ghUrl, {
        message: `upload ${filename}`,
        branch: process.env.GITHUB_BRANCH,
        content
      }, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json'
        }
      });

      const fileUrl = `https://${process.env.CUSTOM_DOMAIN}/uploader/${filename}`;
      return res.status(200).json({ status: 'success', filename, url: fileUrl });
    } catch (e) {
      console.error('Upload error:', e.response?.data || e.message);
      return res.status(500).json({ error: 'Gagal upload ke GitHub', detail: e.response?.data || e.message });
    }
  });
};
