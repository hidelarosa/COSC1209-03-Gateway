## Gateway Dockerfile

# Use official Node.js image from the Docker Hub
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the application will run on
EXPOSE 3000

# Start the Koa application
CMD ["node", "gateway.js"]
