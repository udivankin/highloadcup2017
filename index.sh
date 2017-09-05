unzip -o /tmp/data/data.zip -d ./data
node --expose-gc --max-old-space-size=3600 --max-semi-space-size=200 --nouse_idle_notification index.js 80
# node warmup.js 80 & node --expose-gc --max-old-space-size=3200 --max-semi-space-size=800 --nouse-idle-notification index.js 80 && fg
