export default function handler(req, res) {
  const { url } = req;
  const filePath = url.replace('/uploader/', '');
  const rawUrl = `https://raw.githubusercontent.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/${process.env.GITHUB_BRANCH}/public/${filePath}`;
  return res.redirect(302, rawUrl);
}
