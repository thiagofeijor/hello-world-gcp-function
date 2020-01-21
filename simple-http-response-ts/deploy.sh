cd ./simple-http-response-ts

apt-get update
apt-get -qq -y install curl
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs

npm install
npx tsc

cp ./package.json ../dist
