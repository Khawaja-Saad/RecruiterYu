pipeline {
  agent any

  environment {
    COMPOSE_FILE = "docker-compose-ci.yml"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Frontend') {
      steps {
        sh '''
        cd frontend
        npm install
        npm run build
        '''
      }
    }

    stage('Docker Compose Up') {
      steps {
        sh '''
        docker compose -f $COMPOSE_FILE down --remove-orphans || true
        docker compose -f $COMPOSE_FILE up -d
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
        echo "Waiting for backend..."
        for i in {1..30}; do
          if curl --fail --silent http://localhost:8081/docs; then
            echo "Backend OK"
            break
          fi
          sleep 2
        done || exit 1

        echo "Waiting for frontend..."
        for i in {1..30}; do
          if curl --fail --silent http://localhost:3001; then
            echo "Frontend OK"
            break
          fi
          sleep 2
        done || exit 1
        '''
      }
    }
  }

  post {
    success {
      echo "CI pipeline succeeded"
    }
    failure {
      echo "CI pipeline failed — printing docker logs…"
      sh 'docker compose -f $COMPOSE_FILE logs --no-color --tail 200 || true'
    }
  }
}
