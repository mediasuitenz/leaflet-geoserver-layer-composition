#!/bin/bash
rm -R dist/*
cp -v views/index.html dist/index.html
cp -R static dist/static
