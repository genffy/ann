export const runtime = 'edge'
export async function POST(req: Request) {
    const json = await req.json()
    return new Response(JSON.stringify(json))
}