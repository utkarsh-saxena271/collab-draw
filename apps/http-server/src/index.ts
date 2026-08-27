import express from 'express'
import authRouter from './routes/auth.routes'
import roomRouter from './routes/rooms.routes'
import { envConfig } from './config/env.config'

const app = express()
const PORT = envConfig.PORT || 5000

app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomRouter)


app.listen(PORT, () => {
    console.log(`Server is running on Port: ${PORT}`)
})