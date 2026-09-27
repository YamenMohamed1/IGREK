# ------------------------------------------------------------
#  Stage 1 – Build (install only production dependencies)
# ------------------------------------------------------------
FROM node:20-alpine AS builder

# Set a working directory inside the image
WORKDIR /app

# Copy only the files needed for npm install first.
# This allows Docker to cache the layer if package.json hasn't changed.
COPY package.json package-lock.json* ./

# Install **only** production dependencies (none at the moment,
# but the command is ready for future packages).
RUN npm install --production

# ------------------------------------------------------------
#  Stage 2 – Runtime (copy compiled files, set env, run)
# ------------------------------------------------------------
FROM node:20-alpine AS runtime

# Create a non‑root user (best practice for security)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy the production node_modules from the builder stage
COPY --from=builder /app .

# Railway (and most other platforms) injects a PORT env var.
# Fallback to 8000 for local testing.
ENV PORT=${PORT:-8000}
ENV NODE_ENV=production

# Expose the port that the service will listen on.
EXPOSE 8000

# Use the npm start script – this respects any future changes you make
# to the start command in package.json.
CMD ["npm", "start"]
