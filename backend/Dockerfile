# Use official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the backend files
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
