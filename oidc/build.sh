#!/bin/bash

eval $(minikube docker-env)
docker build -t fryingcan/oidc .

