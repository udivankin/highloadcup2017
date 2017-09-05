FROM node:8.4.0-alpine

RUN mkdir -p /usr/src/

COPY . /usr/src/
# COPY ./tmp /tmp

WORKDIR /usr/src/

# Open 80th port
EXPOSE 80

# RUN apt-get update && \
# apt-get -y install nodejs nginx && \
#  cd /usr/src; npm install && \
#  chmod +x /usr/src/index.sh

# RUN echo "http://dl-4.alpinelinux.org/alpine/v3.6/main" >> /etc/apk/repositories && \
#    apk add --update nginx=1.12.1-r0 && \
#    rm -rf /var/cache/apk/* && \
#    chown -R root:wheel /var/lib/nginx && \
#    chown -R root:wheel /usr/src/nginx && \
#    mkdir -p /run/nginx && \
#    cd /usr/src; yarn install && \
#    chmod +x /usr/src/index.sh

COPY nginx/nginx.conf /etc/nginx/nginx.conf

# RUN apk add --no-cache make gcc g++ python && \
#    cd /usr/src; yarn install && \
#    chmod +x /usr/src/index.sh && \
#    apk del make gcc g++ python

# RUN echo "http://mirror.yandex.ru/mirrors/alpine/v3.6/main" >> /etc/apk/repositories && \
#     apk add --update redis=3.2.8-r0 && \
#     rm -rf /var/cache/apk/* && \
#     mkdir /data && \
#     chown -R redis:redis /data && \
#     echo -e "include /etc/redis-local.conf\n" >> /etc/redis.conf && \
#     cd /usr/src; yarn install; chmod +x /usr/src/index.sh;

RUN cd /usr/src; yarn install; chmod +x /usr/src/index.sh;

# Run server

CMD /usr/src/index.sh
