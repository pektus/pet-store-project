pipeline {
    agent {
        node {
            label 'docker-multi-agent'
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 1, unit: 'HOURS')
        timestamps()
        ansiColor('xterm')
    }

    parameters {
        string(
            name: 'OVERRIDE_RELEASE_VERSION',
            defaultValue: '',
            description: 'Optional: Manually specify the release version to publish (e.g. 1.0.0-RELEASE). Leave blank to auto-derive <baseVersion>-RELEASE from POM.'
        )
    }

    environment {
        // Gitea Server Configuration
        GITEA_HOST                 = '192.168.1.233'
        GITEA_SSH_PORT             = '2222'
        GITEA_URL                  = 'http://192.168.1.233'
        GITEA_PACKAGE_OWNER        = 'DevHome'
        GITEA_SCM_OWNER            = 'adrian'
        GITEA_REPO_NAME            = 'pet-store-project'

        // Jenkins Credentials IDs
        SSH_CREDENTIAL_ID          = 'gitea-ssh-key'   // SSH Username with private key
        GITEA_TOKEN_CREDENTIAL_ID  = 'gitea-token'     // Secret text (Gitea Personal Access Token)

        // Pipeline State Variables (populated dynamically)
        CURRENT_SNAPSHOT_VERSION   = ''
        RELEASE_VERSION            = ''
        RELEASE_TAG                = ''
        GIT_TARGET_BRANCH          = ''
        NEXT_SNAPSHOT_VERSION      = ''
    }

    stages {
        stage('Initialize & Inspect Version') {
            steps {
                script {
                    echo "=== Initializing Pipeline & Inspecting SCM Metadata ==="
                    
                    // Evaluate current POM version
                    CURRENT_SNAPSHOT_VERSION = sh(
                        script: "mvn help:evaluate -Dexpression='project.version' -q -DforceStdout",
                        returnStdout: true
                    ).trim()
                    echo "Detected POM version: ${CURRENT_SNAPSHOT_VERSION}"

                    // Derive base version without -SNAPSHOT or -RELEASE
                    def baseVersion = CURRENT_SNAPSHOT_VERSION.replace('-SNAPSHOT', '').replace('-RELEASE', '').trim()

                    // Release version with -RELEASE suffix (or parameter override)
                    if (params.OVERRIDE_RELEASE_VERSION && params.OVERRIDE_RELEASE_VERSION.trim()) {
                        RELEASE_VERSION = params.OVERRIDE_RELEASE_VERSION.trim()
                        echo "Using manually overridden release version: ${RELEASE_VERSION}"
                    } else {
                        RELEASE_VERSION = "${baseVersion}-RELEASE"
                        echo "Derived release version: ${RELEASE_VERSION}"
                    }

                    // Release tag matching release version
                    RELEASE_TAG = "v${RELEASE_VERSION}"
                    echo "Derived release tag: ${RELEASE_TAG}"

                    // Detect target Git branch (fallback to master if detached or unspecified)
                    GIT_TARGET_BRANCH = env.BRANCH_NAME ?: (env.GIT_BRANCH ? env.GIT_BRANCH.replace('origin/', '') : 'master')
                    echo "Target Git branch for SCM update: ${GIT_TARGET_BRANCH}"
                }
            }
        }

        stage('Configure Maven Settings') {
            steps {
                withCredentials([string(credentialsId: env.GITEA_TOKEN_CREDENTIAL_ID, variable: 'GITEA_TOKEN')]) {
                    script {
                        echo "Generating secure temporary settings-ci.xml for Gitea Package Registry..."
                        def mavenSettings = """<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
    <servers>
        <server>
            <id>gitea</id>
            <username>${env.GITEA_SCM_OWNER}</username>
            <password>${GITEA_TOKEN}</password>
        </server>
    </servers>
</settings>"""
                        writeFile file: 'settings-ci.xml', text: mavenSettings
                    }
                }
            }
        }

        stage('Build & Test SNAPSHOT') {
            steps {
                echo "=== Compiling & Testing SNAPSHOT Version (${CURRENT_SNAPSHOT_VERSION}) ==="
                // Maven compile lifecycle triggers frontend-maven-plugin (Node/NPM install & Angular build)
                // and runs JUnit 5 & Mockito test suites across pet-store-domain, pet-store-service, and pet-store-web
                sh 'mvn clean test -s settings-ci.xml -B -Dorg.slf4j.simpleLogger.showDateTime=true'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Deploy SNAPSHOT to Gitea') {
            steps {
                echo "=== Packaging & Deploying SNAPSHOT (${CURRENT_SNAPSHOT_VERSION}) to Gitea Package Registry ==="
                // Deploys snapshot artifacts to <snapshotRepository>
                sh 'mvn deploy -s settings-ci.xml -B -DskipTests'
            }
        }

        stage('Deploy RELEASE to Gitea') {
            steps {
                script {
                    echo "=== Setting POM Versions to ${RELEASE_VERSION} ==="
                    sh "mvn versions:set -DnewVersion=\"${RELEASE_VERSION}\" -DgenerateBackupPoms=false -B"

                    echo "=== Packaging & Deploying RELEASE (${RELEASE_VERSION}) to Gitea Package Registry ==="
                    // Re-packages artifacts with release version in manifests/POMs and deploys to <repository>
                    sh 'mvn clean package deploy -s settings-ci.xml -B -DskipTests'

                    // Archive generated RELEASE WAR/JAR/ZIP artifacts in Jenkins build record
                    archiveArtifacts artifacts: '**/target/*.jar, **/target/*.war, **/target/*.zip', allowEmptyArchive: true, fingerprint: true
                }
            }
        }

        stage('Commit & Tag Release in Gitea') {
            steps {
                script {
                    echo "=== Creating and Pushing Release Tag ${RELEASE_TAG} ==="
                    
                    // Push Release Commit and Git Tag via SSH
                    withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CREDENTIAL_ID, keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            git config user.name "Jenkins CI"
                            git config user.email "jenkins@devhome.local"
                            export GIT_SSH_COMMAND="ssh -i \${SSH_KEY} -p ${env.GITEA_SSH_PORT} -o StrictHostKeyChecking=no"
                            GIT_REMOTE_SSH="ssh://git@${env.GITEA_HOST}:${env.GITEA_SSH_PORT}/${env.GITEA_SCM_OWNER}/${env.GITEA_REPO_NAME}.git"

                            # Stage and commit release POM files
                            git add pom.xml **/pom.xml
                            git commit -m "chore(release): release ${RELEASE_VERSION} [skip ci]" || echo "No changes to commit for release."

                            # Push release commit to remote branch
                            echo "Pushing release commit to \${GIT_REMOTE_SSH} branch ${GIT_TARGET_BRANCH}..."
                            git push "\${GIT_REMOTE_SSH}" HEAD:${GIT_TARGET_BRANCH}

                            TAG_NAME="${RELEASE_TAG}"
                            echo "Tagging Git commit as \${TAG_NAME}..."
                            if git rev-parse "\${TAG_NAME}" >/dev/null 2>&1; then
                                echo "Tag \${TAG_NAME} already exists locally."
                            else
                                git tag -a "\${TAG_NAME}" -m "Release \${TAG_NAME} [Jenkins Build #${env.BUILD_NUMBER}]"
                            fi
                            git push "\${GIT_REMOTE_SSH}" "\${TAG_NAME}" || echo "Tag \${TAG_NAME} push completed (or already exists on remote)."
                        """
                    }

                    // Register Release in Gitea Releases API
                    withCredentials([string(credentialsId: env.GITEA_TOKEN_CREDENTIAL_ID, variable: 'GITEA_TOKEN')]) {
                        sh """
                            TAG_NAME="${RELEASE_TAG}"
                            echo "Registering Gitea release metadata..."
                            curl -k -s -X POST "${env.GITEA_URL}/api/v1/repos/${env.GITEA_SCM_OWNER}/${env.GITEA_REPO_NAME}/releases" \\
                                -H "Authorization: token \${GITEA_TOKEN}" \\
                                -H "Content-Type: application/json" \\
                                -d "{\\\"tag_name\\\":\\\"\${TAG_NAME}\\\",\\\"name\\\":\\\"Release \${TAG_NAME}\\\",\\\"body\\\":\\\"Automated release build #${env.BUILD_NUMBER}. Artifacts published to Gitea Maven Package Registry (${env.GITEA_PACKAGE_OWNER}) with version ${RELEASE_VERSION} and ${CURRENT_SNAPSHOT_VERSION}.\\\",\\\"draft\\\":false,\\\"prerelease\\\":false}" || echo "Gitea API release notification handled."
                        """
                    }
                }
            }
        }

        stage('Prompt for Next SNAPSHOT Version') {
            steps {
                script {
                    def suggestedNext = computeNextSnapshot(RELEASE_VERSION)
                    echo "Release Version: ${RELEASE_VERSION}. Suggested next SNAPSHOT: ${suggestedNext}"

                    // Timeout of 2 days allows review without blocking forever
                    timeout(time: 2, unit: 'DAYS') {
                        def userInput = input(
                            id: 'NextSnapshotVersionPrompt',
                            message: "Build and deployment of release version ${RELEASE_VERSION} (and ${CURRENT_SNAPSHOT_VERSION}) succeeded!\\nPlease provide the next SNAPSHOT version for ongoing development:",
                            ok: 'Confirm & Push to Git',
                            parameters: [
                                string(
                                    name: 'NEXT_SNAPSHOT_VERSION',
                                    defaultValue: suggestedNext,
                                    description: 'Next SNAPSHOT version to write into pom.xml (e.g. 1.0.2-SNAPSHOT)'
                                )
                            ]
                        )
                        // Handle Map or single String return value depending on Jenkins Pipeline version
                        NEXT_SNAPSHOT_VERSION = (userInput instanceof Map) ? userInput['NEXT_SNAPSHOT_VERSION'].trim() : userInput.toString().trim()
                    }
                    echo "User selected next SNAPSHOT version: ${NEXT_SNAPSHOT_VERSION}"
                }
            }
        }

        stage('Update SCM to Next SNAPSHOT & Push') {
            steps {
                script {
                    echo "=== Updating pom.xml Versions to ${NEXT_SNAPSHOT_VERSION} and Pushing via SSH ==="
                    withCredentials([sshUserPrivateKey(credentialsId: env.SSH_CREDENTIAL_ID, keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            git config user.name "Jenkins CI"
                            git config user.email "jenkins@devhome.local"

                            # Update all module POM versions
                            mvn versions:set -DnewVersion="${NEXT_SNAPSHOT_VERSION}" -DgenerateBackupPoms=false -B

                            # Stage and commit updated POM files
                            git add pom.xml **/pom.xml
                            git commit -m "chore: bump version to ${NEXT_SNAPSHOT_VERSION} [skip ci]"

                            # Push back to Gitea repository via SSH
                            export GIT_SSH_COMMAND="ssh -i \${SSH_KEY} -p ${env.GITEA_SSH_PORT} -o StrictHostKeyChecking=no"
                            GIT_REMOTE_SSH="ssh://git@${env.GITEA_HOST}:${env.GITEA_SSH_PORT}/${env.GITEA_SCM_OWNER}/${env.GITEA_REPO_NAME}.git"
                            
                            echo "Pushing updated version to \${GIT_REMOTE_SSH} branch ${GIT_TARGET_BRANCH}..."
                            git push "\${GIT_REMOTE_SSH}" HEAD:${GIT_TARGET_BRANCH}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Remove credentials settings file
            sh 'rm -f settings-ci.xml'
            cleanWs deleteDirs: false, notFailBuild: true, patterns: [[pattern: 'settings-ci.xml', type: 'INCLUDE']]
        }
        success {
            echo "Pipeline completed successfully! Both SNAPSHOT (${CURRENT_SNAPSHOT_VERSION}) and RELEASE (${RELEASE_VERSION}) deployed to Gitea, and repository updated to ${NEXT_SNAPSHOT_VERSION}."
        }
        failure {
            echo "Pipeline failed. Check stage logs for details."
        }
    }
}

/**
 * Calculates a reasonable increment for the next development SNAPSHOT version.
 * Example: 1.0.1-RELEASE -> 1.0.2-SNAPSHOT, 1.0.0 -> 1.0.1-SNAPSHOT
 */
def computeNextSnapshot(String version) {
    if (!version) {
        return '1.0.2-SNAPSHOT'
    }
    def base = version.replace('-SNAPSHOT', '').replace('-RELEASE', '').trim()
    def segments = base.tokenize('.')
    if (segments.size() >= 3 && segments[-1].isInteger()) {
        def patch = segments[-1].toInteger() + 1
        segments[-1] = patch.toString()
        return segments.join('.') + '-SNAPSHOT'
    } else if (segments.size() == 2 && segments[-1].isInteger()) {
        def minor = segments[-1].toInteger() + 1
        segments[-1] = minor.toString()
        return segments.join('.') + '.0-SNAPSHOT'
    } else if (segments.size() == 1 && segments[0].isInteger()) {
        return "${segments[0].toInteger() + 1}.0.0-SNAPSHOT"
    }
    return "${base}.1-SNAPSHOT"
}
