import { NextRequest, NextResponse } from "next/server"

const CLIENT_ID = process.env.TENCENT_DOCS_CLIENT_ID || ""
const CLIENT_SECRET = process.env.TENCENT_DOCS_CLIENT_SECRET || ""
const REDIRECT_URI = process.env.TENCENT_DOCS_REDIRECT_URI || "http://localhost:3000/api/tencent-docs/callback"
const TOKEN_URL = "https://docs.qq.com/oauth2/token"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL(`/profile?tencent_error=${encodeURIComponent(searchParams.get("error_description") || error)}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/profile?tencent_error=no_code", req.url)
    )
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/profile?tencent_error=no_config", req.url)
    )
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })

    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/profile?tencent_error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`, req.url)
      )
    }

    const html = `
<!DOCTYPE html>
<html>
<head><title>授权成功</title></head>
<body>
<script>
  window.opener?.postMessage({
    type: 'tencent-docs-token',
    accessToken: '${tokenData.access_token}',
    refreshToken: '${tokenData.refresh_token}',
    expiresIn: ${tokenData.expires_in || 7200}
  }, '*');
  setTimeout(() => window.close(), 1000);
</script>
<p style="text-align:center;padding-top:40px;font-family:sans-serif">授权成功，正在返回...</p>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch {
    return NextResponse.redirect(
      new URL("/profile?tencent_error=token_failed", req.url)
    )
  }
}
