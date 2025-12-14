// functions/download.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fetch = require('node-fetch'); // npm install node-fetch

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { url } = JSON.parse(event.body || '{}');

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing YouTube URL' })
    };
  }

  // ---- place your API key here if you use a service ----
  // const apiKey = 'YOUR_API_KEY';
  // const apiUrl = `https://some-api.com/download?key=${apiKey}&url=${encodeURIComponent(url)}`;

  // For a self‑hosted yt-dlp solution:
  const cmd = `yt-dlp -f "best[ext=mp4]" -o "./downloads/%(title)s.%(ext)s" "${url}"`;
  let output, error;

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: __dirname });
    output = stdout;
    error = stderr;
  } catch (e) {
    error = e.message;
  }

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Download failed', details: error })
    };
  }

  // The file is saved in functions/downloads/ – expose it via a public URL
  // (Netlify serves the whole functions folder as static assets)
  const fileName = output.match(/Destination: (.+)/);
  const filePath = fileName ? fileName[1].trim() : null;

  return {
    statusCode: 200,
    body: JSON.stringify({
      url: `/.netlify/downloads/${filePath.split('/').pop()}`,
      message: 'Ready to download'
    })
  };
};
