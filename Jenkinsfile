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
          CI=false npm install
          CI=false npm run build
        '''
      }
    }

    stage('Docker Compose Up') {
      steps {
        sh '''
	  docker-compose -f $COMPOSE_FILE down --remove-orphans || true
      	  docker-compose -f $COMPOSE_FILE rm -f -s -v || true
      	  docker-compose -f $COMPOSE_FILE up -d --build
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

    stage('Run Selenium Tests') {
      steps {
        sh '''
          docker-compose -f $COMPOSE_FILE up --build --abort-on-container-exit selenium_tests
          docker cp recruiter_selenium_tests:/app/report.html selenium-report.html || true
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'selenium-report.html', allowEmptyArchive: true
        }
      }
    }

    stage('Email Results') {
      steps {
        script {
          def committerEmail = sh(
            script: "git show -s --format=%ae",
            returnStdout: true
          ).trim()

          emailext(
            to: committerEmail,
            subject: "RecruiterYu CI: ${currentBuild.currentResult} (#${env.BUILD_NUMBER})",
            body: """
Build Result: ${currentBuild.currentResult}
Build URL: ${env.BUILD_URL}
Committer: ${committerEmail}
""",
            attachmentsPattern: "selenium-report.html"
          )
        }
      }
    }

  }

  post {
    always {
      // keep your Jenkins node clean
      sh 'docker-compose -f $COMPOSE_FILE down || true'
    }
    success {
      echo "CI pipeline succeeded"
    }
    failure {
      echo "CI pipeline failed — printing docker logs…"
      sh 'docker-compose -f $COMPOSE_FILE logs --no-color --tail 200 || true'
    }
  }
}
