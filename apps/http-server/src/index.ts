import express from 'express'
import authRouter from './routes/auth.routes'
import roomRouter from './routes/rooms.routes'

const app = express()
const PORT = 3000

app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomRouter)


app.listen(PORT, () => {
    console.log(`Server is running on Port: ${PORT}`)
})