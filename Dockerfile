# Use official lightweight Node.js 18 image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app source code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build the Next.js app
RUN npm run build

# Expose port 3000 for the app
EXPOSE 3000

# Start the app
CMD [ "npm", "start" ]
