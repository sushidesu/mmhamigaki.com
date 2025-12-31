import { Hono } from 'hono'
import { cacheMiddleware } from './middleware/cache'
import homepage from './routes/homepage'
import posts from './routes/posts'
import api from './routes/api'
import ogImage from './routes/og-image'
import assets from './routes/assets'

const app = new Hono()

app.use('*', cacheMiddleware())

app.route('/', homepage)
app.route('/posts', posts)
app.route('/api', api)
app.route('/og-image', ogImage)
app.route('/', assets)

export default app
