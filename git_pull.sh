#!/usr/bin/env bash
git checkout master
git stash
git pull --quiet
npm install
git stash clear
