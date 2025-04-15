const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios');
const cors = require('@koa/cors'); // Importing CORS middleware

const app = new Koa();
const router = new Router();

// Enable CORS to allow cross-origin requests (for frontend in different port)
app.use(cors());

// Logging middleware for debugging
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log('%s %s - %s ms', ctx.method, ctx.url, ms);
});

// Gateway endpoint to fetch data from all microservices
router.get('/api/threads/:id/full', async (ctx) => {
  const threadId = ctx.params.id;

  try {
    // Fetch data from all microservices simultaneously using ECS service names
    const [threadRes, postsRes] = await Promise.all([
      axios.get(`http://threads-service:3002/api/threads/${threadId}`),
      axios.get(`http://posts-service:3001/api/posts/in-thread/${threadId}`)
    ]);

    const thread = threadRes.data;
    const posts = postsRes.data;

    // Get unique user IDs from posts
    const userIds = [...new Set(posts.map((post) => post.user))];

    // Fetch user info from the users service
    const userPromises = userIds.map((id) =>
      axios.get(`http://users-service:3003/api/users/${id}`)
    );
    
    // Fetch all user data
    const usersData = await Promise.all(userPromises);
    const users = usersData.map((res) => res.data);

    // Send the combined response back
    ctx.body = {
      thread,
      posts,
      users
    };
  } catch (error) {
    console.error('Error fetching data from microservices:', error.message);
    ctx.status = error.response?.status || 500;
    ctx.body = {
      error: 'An error occurred while fetching data from microservices',
      details: error.message
    };
  }
});

// Set up the router
app.use(router.routes());
app.use(router.allowedMethods());

// Start the API gateway on port 3000
app.listen(3000, () => {
  console.log('API Gateway running at http://0.0.0.0:3000');
});
