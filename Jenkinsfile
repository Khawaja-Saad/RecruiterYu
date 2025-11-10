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

    stage('Show workspace') {
      steps {
        sh 'pwd; ls -la'
      }
    }

    stage('Docker Compose Up') {
      steps {
        // Run docker compose on the host; ensure Jenkins user can run docker
        sh 'docker-compose -f $COMPOSE_FILE up -d --build --remove-orphans'
      }
    }

    stage('Wait & Smoke Test') {
      steps {
        sh '''
        echo "Waiting for containers to come up..."
        sleep 8
        # FastAPI Swagger UI is usually at /docs — check that first, fallback to root.
        if curl --fail --silent http://localhost:8081/docs >/dev/null 2>&1; then
          echo "Swagger UI reachable at /docs"
        elif curl --fail --silent http://localhost:8081/ >/dev/null 2>&1; then
          echo "App root responded"
        else
          echo "App didn't respond on expected endpoints" >&2
          docker-compose -f $COMPOSE_FILE logs --no-color --tail 200 || true
          exit 1
        fi
        '''
      }
    }
  }

  post {
    success {
      echo "CI pipeline succeeded"
    }
    failure {
      echo "CI pipeline failed — printing docker compose logs..."
      sh 'docker-compose -f $COMPOSE_FILE logs --no-color --tail 200 || true'
    }
  }
}

