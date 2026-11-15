import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes'
import roomRouter from './routes/rooms.routes'
import { envConfig } from './config/env.config'

const app = express()
const PORT = envConfig.PORT || 5000

const allowedOrigins = (
    envConfig.CORS_ORIGIN ??
    'http://localhost:3000'
)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean)

app.use(
    cors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomRouter)


app.listen(PORT, () => {
    console.log(`Server is running on Port: ${PORT}`)
})