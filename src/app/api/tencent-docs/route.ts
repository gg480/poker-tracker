import { NextRequest, NextResponse } from "next/server"

const CLIENT_ID = process.env.TENCENT_DOCS_CLIENT_ID || ""
const CLIENT_SECRET = process.env.TENCENT_DOCS_CLIENT_SECRET || ""
const REDIRECT_URI = process.env.TENCENT_DOCS_REDIRECT_URI || "http://localhost:3000/api/tencent-docs/callback"
const AUTH_URL = "https://docs.qq.com/oauth2/authorize"
const TOKEN_URL = "https://docs.qq.com/oauth2/token"
const API_BASE = "https://docs.qq.com/openapi"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  if (action === "auth-url") {
    if (!CLIENT_ID) {
      return NextResponse.json(
        { error: "未配置 TENCENT_DOCS_CLIENT_ID，请在 .env.local 中设置" },
        { status: 400 }
      )
    }
    const url = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=read`
    return NextResponse.json({ url })
  }

  if (action === "status") {
    return NextResponse.json({
      configured: !!(CLIENT_ID && CLIENT_SECRET),
      clientId: CLIENT_ID ? `${CLIENT_ID.slice(0, 4)}***` : "",
    })
  }

  if (action === "fetch-sheet") {
    const docId = searchParams.get("docId")
    const sheetId = searchParams.get("sheetId") || "0"
    const accessToken = searchParams.get("accessToken")

    if (!docId || !accessToken) {
      return NextResponse.json({ error: "缺少 docId 或 accessToken" }, { status: 400 })
    }

    try {
      const res = await fetch(
        `${API_BASE}/sheet/${docId}?tab=${sheetId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch (e) {
      return NextResponse.json({ error: "请求腾讯文档API失败" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: "缺少授权码" }, { status: 400 })
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { error: "未配置腾讯文档API密钥，请在 .env.local 中设置 TENCENT_DOCS_CLIENT_ID 和 TENCENT_DOCS_CLIENT_SECRET" },
        { status: 400 }
      )
    }

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
      return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 })
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    })
  } catch {
    return NextResponse.json({ error: "获取令牌失败" }, { status: 500 })
  }
}
