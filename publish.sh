#!/bin/bash

pnpm prettier
pnpm run lint
pnpm run build
pnpm run build:web
rm -rf docs/*
cp -r dist-web/* docs/