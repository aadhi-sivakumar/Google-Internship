# Stage 1: Install dependencies and build the Next.js application
# Use a Node.js base image with a specific version for consistency
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock/package-lock.json first to leverage Docker cache
# This means npm install/yarn install will only run if these files change
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies (use npm ci for clean installs if using npm, or yarn install for yarn)
# For npm:
RUN npm install --prefer-offline --no-audit

# For Yarn (uncomment if you're using Yarn):
# RUN yarn install --frozen-lockfile

# Copy the rest of your application code
COPY . .

# Build the Next.js application
# Choose one of the following build commands based on your Next.js setup:

# Option 1: For Server-Side Rendering (SSR) and API Routes (default Next.js behavior)
# This creates a .next folder with the production build
RUN npm run build

# Option 2: For Static Export (if you're hosting as static files, e.g., on Cloud Storage)
# This creates an 'out' folder with static HTML, CSS, JS
# RUN npm run build && npm run export # Assuming your package.json has "export": "next export"

# --- End of Builder Stage ---

# Stage 2: Create the production-ready image
# Use a minimal Node.js base image for the final image to keep it small
FROM node:20-alpine AS runner

# Set environment variables for production
ENV NODE_ENV=production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the builder stage
# For SSR/API Routes:
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# If you have public assets:
COPY --from=builder /app/public ./public

# For Static Export (uncomment if using this option):
# COPY --from=builder /app/out ./out
# COPY --from=builder /app/package.json ./package.json

# Expose the port your Next.js application will run on
# Default for Next.js is 3000
EXPOSE 3000

# Define the command to run your Next.js application
# For SSR/API Routes:
CMD ["npm", "start"]

# For Static Export (if serving directly with a web server like Nginx/Caddy, or if you're uploading 'out' to storage):
# This Dockerfile isn't typically used for static export unless you're serving it with Node.js
# If you exported, you'd usually serve the 'out' directory with a lightweight web server (e.g., Nginx, Caddy)
# or upload it directly to a static hosting service.
# If you still wanted to serve it with Node.js in a Docker container, you might use a package like 'serve':
# RUN npm install -g serve
# CMD ["serve", "out", "-p", "3000"]
