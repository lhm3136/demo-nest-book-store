FROM node:20

WORKDIR /app

COPY package*.json ./

COPY . .

COPY start.sh ./

RUN chmod +x start.sh

EXPOSE 80

CMD [ "./start.sh" ]