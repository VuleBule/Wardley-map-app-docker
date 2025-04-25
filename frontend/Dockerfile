FROM node:18-alpine

WORKDIR /app

# Copy package*.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables for React application
ENV REACT_APP_API_URL=http://localhost:8000
ENV NODE_ENV=development

# Expose port for the React application
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "start"]
