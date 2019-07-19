FROM python:3.7
WORKDIR /opt/sample

COPY Pipfile .
COPY Pipfile.lock .
COPY index.html .
COPY project/ ./project

RUN pip install pipenv && \
    pipenv sync

CMD ["pipenv", "run", "python", "-m", "project"]
