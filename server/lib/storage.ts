import crypto from 'crypto'

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

const getSupabaseStorageEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  const normalizedBase = supabaseUrl.replace(/\/$/, '')
  return { normalizedBase, serviceRoleKey }
}

export const uploadToSupabaseStorage = async (opts: {
  bucket: string
  path: string
  contentType: string
  data: Buffer
}) => {
  const { normalizedBase, serviceRoleKey } = getSupabaseStorageEnv()
  const objectPath = encodePath(opts.path)
  const uploadUrl = `${normalizedBase}/storage/v1/object/${opts.bucket}/${objectPath}`

  const tryUpload = async (method: 'POST' | 'PUT') => {
    const res = await fetch(uploadUrl, {
      method,
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'content-type': opts.contentType,
        'x-upsert': 'true',
      },
      body: opts.data,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Supabase Storage upload failed (${res.status}, ${method}): ${text || res.statusText}`)
    }

    return res
  }

  try {
    await tryUpload('POST')
  } catch (e: any) {
    if (String(e?.message || '').includes('(405') || String(e?.message || '').includes('Method Not Allowed')) {
      await tryUpload('PUT')
    } else {
      throw e
    }
  }

  return `${normalizedBase}/storage/v1/object/public/${opts.bucket}/${objectPath}`
}

export const listSupabaseBuckets = async () => {
  const { normalizedBase, serviceRoleKey } = getSupabaseStorageEnv()
  const url = `${normalizedBase}/storage/v1/bucket`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase Storage list buckets failed (${res.status}): ${text || res.statusText}`)
  }

  const json = await res.json().catch(() => [])
  return Array.isArray(json) ? json : []
}

export const makeUploadKey = (opts: { userId: number; originalName: string }) => {
  const ext = opts.originalName.includes('.') ? `.${opts.originalName.split('.').pop()}` : ''
  const rand = crypto.randomBytes(16).toString('hex')
  return `${opts.userId}/${Date.now()}-${rand}${ext}`
}
