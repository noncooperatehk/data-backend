#!/usr/bin/env sh
API_DATA_PATH="dist/v2"
# abort on errors
set -e

# clean
if [ -d "./dist" ]; then
  rm -rf "./dist"
fi

# build
mkdir -p $API_DATA_PATH
cp -R location $API_DATA_PATH
cp -R article $API_DATA_PATH
cp -R tag $API_DATA_PATH

# navigate into the build output directory
cd dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:noncooperatehk/data-backend.git master:gh-pages

cd -
