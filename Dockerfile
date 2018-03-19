FROM node:carbon-stretch

WORKDIR /opt/ip-safe

ENV REPO_URL=https://github.com/pchojnacki/blocklist-ipsets 
ENV STORAGE=/tmp/repository_storage

RUN git clone https://github.com/firehol/blocklist-ipsets /tmp/repository_storage

COPY package*.json ./

RUN npm install

COPY . .

ENV SERVER=0.0.0.0:5000
EXPOSE 5000

CMD  ["node", "app.js"]
