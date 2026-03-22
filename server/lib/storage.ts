import crypto from 'crypto'

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')

export const uploadToSupabaseStorage = async (opts: {
  bucket: string
  path: string
  contentType: string
  data: Buffer
}) => {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  const normalizedBase = supabaseUrl.replace(/\/$/, '')
  const objectPath = encodePath(opts.path)
  const uploadUrl = `${normalizedBase}/storage/v1/object/${opts.bucket}/${objectPath}`

  const res = await fetch(uploadUrl, {
    method: 'POST',
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
    throw new Error(`Supabase Storage upload failed (${res.status}): ${text || res.statusText}`)
  }

  return `${normalizedBase}/storage/v1/object/public/${opts.bucket}/${objectPath}`
}

export const makeUploadKey = (opts: { userId: number; originalName: string }) => {
  const ext = opts.originalName.includes('.') ? `.${opts.originalName.split('.').pop()}` : ''
  const rand = crypto.randomBytes(16).toString('hex')
  return `${opts.userId}/${Date.now()}-${rand}${ext}`
}

