# FROM node:20-slim

# # Install Java Runtime
# RUN apt-get update && apt-get install -y default-jre wget && apt-get clean

# WORKDIR /app

# # Download only the OpenStego JAR (not the whole folder)
# RUN wget https://github.com/syvaidya/openstego/releases/download/v0.8.6/openstego.jar -O /app/openstego.jar

# # Copy project files
# COPY package*.json ./
# RUN npm install --production
# COPY . .

# EXPOSE 5000

# CMD ["npm", "start"]


FROM node:20-slim

# Install Java (needed for OpenStego)
RUN apt-get update && apt-get install -y default-jre wget && apt-get clean

WORKDIR /app

# Download your OpenStego JAR from GitHub Releases
RUN wget https://github.com/Saqib73/CanvasGuard/releases/download/openstego/openstego.jar \
    -O /app/openstego.jar

# Install backend dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source code
COPY . .

EXPOSE 5000

CMD ["npm", "run"]



