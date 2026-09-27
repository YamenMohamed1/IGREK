# Single‑stage Dockerfile – simple, reliable for this small app
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy the whole source tree (Dockerignore will keep it lean)
COPY . .

# Install only production‑only dependencies (none at the moment)
RUN npm install --production

# Railway (and most other platforms) injects a PORT env var.
# Fallback to 8000 for local testing.
ENV PORT=${PORT:-8000}
ENV NODE_ENV=production

# Expose the listening port
EXPOSE 8000

# Start the server directly (no npm start wrapper)
CMD ["node", "local-server.js"]
