build:
    docker build -t biometric-time-clock .

run:
    docker run -p 3000:3000 biometric-time-clock

test:
    npm test

docker-run: build run
