# Use official Node.js runtime as a parent image (Node 20+ required for global File/undici)
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the backend files
COPY . .

ENV NODE_ENV=production
ENV PORT=5000

# Expose the API port
EXPOSE 5000

# Container-level health check hits the liveness endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the application
CMD ["npm", "start"]
