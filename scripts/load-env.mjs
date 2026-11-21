// Load .env.local then .env before any module reads process.env.
// Imported first by scripts, because ES imports run before the importing
// file's own code.
import dotenv from 'dotenv'

dotenv.config({ path: ['.env.local', '.env'], quiet: true })
