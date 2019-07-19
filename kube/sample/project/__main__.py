import logging
import os
from pathlib import Path

import falcon
import requests
import waitress
from google.auth import jwt
from kubernetes import config, client
from kubernetes.config.incluster_config import SERVICE_TOKEN_FILENAME, SERVICE_CERT_FILENAME

logging.basicConfig(format='%(asctime)s - [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger("gateway")
logger.setLevel(logging.DEBUG)


class IndexRoute:
    def on_get(self, req, resp):
        resp.content_type = 'text/html'
        resp.body = Path("index.html").read_bytes()


class GetVaultTokenRoute:
    def on_get(self, req, resp):
        token_raw = Path(SERVICE_TOKEN_FILENAME).read_text()
        response = requests.put("http://192.168.99.100:32148/v1/auth/kubernetes/login", json={
            "role": "demo",
            "jwt": token_raw
        }).json()
        resp.media = response


class GetKubeServiceAccount:
    def on_get(self, req, resp):
        token_raw = Path(SERVICE_TOKEN_FILENAME).read_text()
        token = jwt.decode(token_raw, verify=False)
        sa_namespace = token["kubernetes.io/serviceaccount/namespace"]
        sa_name = token["kubernetes.io/serviceaccount/service-account.name"]

        resp.media = {
            "name": sa_name,
            "namespace": sa_namespace,
            "token": token_raw
        }


if __name__ == "__main__":
    config.load_incluster_config()
    kube = client.CoreV1Api()
    logger.info(Path(SERVICE_CERT_FILENAME).read_text())

    api = falcon.API()
    api.add_route("/", IndexRoute())
    api.add_route("/api/vaultToken", GetVaultTokenRoute())
    api.add_route("/api/serviceAccount", GetKubeServiceAccount())

    ip_address = os.getenv("WEB_HOST", "127.0.0.1")
    port = 3000

    logger.info("Starting web server on %s:%s", ip_address, port)
    waitress.serve(api, host=ip_address, port=port, _quiet=True)
