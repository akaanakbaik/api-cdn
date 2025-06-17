require('dotenv').config();

module.exports = (req, res) => {
  const parts = req.url.split('/');
  const filename = parts.pop() || parts.pop(); // memastikan ambil nama file agar tidak tabrakan maut 🗿
  const raw = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/public/${filename}`;
  res.writeHead(302, { Location: raw });
  res.end();
};
