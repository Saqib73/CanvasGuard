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

RUN apt-get update && apt-get install -y default-jre wget unzip && apt-get clean

WORKDIR /app

# Download zip release
RUN wget https://github.com/syvaidya/openstego/releases/download/v0.8.6/openstego-0.8.6.zip -O openstego.zip \
    && unzip openstego.zip -d /app/openstego \
    && rm openstego.zip

# Copy backend files
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 5000
CMD ["npm", "start"]
