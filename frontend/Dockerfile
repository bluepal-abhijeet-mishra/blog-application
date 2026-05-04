FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN if [ -d dist ]; then cp -r dist /app/static; elif [ -d build ]; then cp -r build /app/static; else echo "No dist or build directory found" && exit 1; fi

FROM nginx:alpine

COPY --from=build /app/static /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
