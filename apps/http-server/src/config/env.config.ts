import 'dotenv/config'

const requireEnv = (key:string):string => {
    const val = process.env[key]
    if(!val) throw new Error(`No env var found for ${key}`)

    return val;
}


export const envConfig = {
    PORT : requireEnv('PORT'),
    BUN_ENV : requireEnv('BUN_ENV'),
    DATABASE_URL : requireEnv('DATABASE_URL'),
    JWT_SECRET: requireEnv('JWT_SECRET')
}