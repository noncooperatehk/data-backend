#!/usr/bin/env sh

# abort on errors
set -e

# clean
if [ -d "./dist" ]; then
  rm -rf "./dist"
fi

# build
mkdir -p dist
cp *.json dist/
cp -R company dist/

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
