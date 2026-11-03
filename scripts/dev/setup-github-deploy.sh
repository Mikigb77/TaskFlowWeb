#!/usr/bin/env bash
# One-time Google Cloud setup so GitHub Actions can deploy from main:
#   - this repo's website (.github/workflows/deploy.yml), and
#   - the app repo's staging API (TaskFlow: .github/workflows/deploy-backend.yml).
#
# Run it once, as the project owner, in Google Cloud Shell
# (https://shell.cloud.google.com, nothing to install) or anywhere gcloud is
# signed in as tech.garbar@gmail.com. Safe to run again: it only adds what is
# missing.
#
# Keyless: GitHub's sign-in token is exchanged for a short-lived Google one
# (Workload Identity Federation). Only the main branch of Mikigb77/TaskFlow and
# Mikigb77/TaskFlowWeb, owned by GitHub user id 112938189, can use it. No
# service account key is created.
#
# The deployer can build images, deploy the existing Cloud Run services and
# jobs and run the migration job. It can't read secret values, change who may
# open a service, or administer the project.
set -euo pipefail

PROJECT=taskflow-511107
ACCOUNT_FLAG=()
if [[ "${1:-}" == "--account" && -n "${2:-}" ]]; then ACCOUNT_FLAG=(--account="$2"); fi
g() { gcloud "$@" --project="$PROJECT" "${ACCOUNT_FLAG[@]}" --quiet; }

NUMBER=$(g projects describe "$PROJECT" --format='value(projectNumber)')
POOL=github
PROVIDER=github
DEPLOYER_ID=github-deployer
DEPLOYER="$DEPLOYER_ID@$PROJECT.iam.gserviceaccount.com"
OWNER_ID=112938189
REPOS=(Mikigb77/TaskFlowWeb Mikigb77/TaskFlow)

echo "Project $PROJECT ($NUMBER)"
g services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

if ! g iam service-accounts describe "$DEPLOYER" >/dev/null 2>&1; then
  g iam service-accounts create "$DEPLOYER_ID" --display-name="GitHub Actions deployer (main only)"
fi

if ! g iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1; then
  g iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"
fi
CONDITION="assertion.repository_owner_id == '$OWNER_ID' && assertion.ref == 'refs/heads/main' && assertion.repository in ['${REPOS[0]}', '${REPOS[1]}']"
MAPPING='google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref,attribute.repository_owner_id=assertion.repository_owner_id'
if g iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  g iam workload-identity-pools providers update-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION"
else
  g iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --display-name="GitHub main" --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping="$MAPPING" --attribute-condition="$CONDITION"
fi
for repo in "${REPOS[@]}"; do
  g iam service-accounts add-iam-policy-binding "$DEPLOYER" --role=roles/iam.workloadIdentityUser \
    --member="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$repo" \
    --format=none
done

# Project roles: start builds and follow their logs, deploy Cloud Run (no IAM changes).
for role in roles/cloudbuild.builds.editor roles/logging.viewer roles/run.developer roles/serviceusage.serviceUsageConsumer; do
  g projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$DEPLOYER" --role="$role" --condition=None --format=none
done

# Act as the existing build and runtime identities, and nothing else.
for sa in taskflow-web-builder taskflow-web-runtime taskflow-api-builder taskflow-api-staging; do
  g iam service-accounts add-iam-policy-binding "$sa@$PROJECT.iam.gserviceaccount.com" \
    --member="serviceAccount:$DEPLOYER" --role=roles/iam.serviceAccountUser --format=none
done

# Upload build sources to the two build buckets; look up the built images.
for bucket in "$PROJECT-taskflow-web-builds" "$PROJECT-api-staging-builds"; do
  g storage buckets add-iam-policy-binding "gs://$bucket" --member="serviceAccount:$DEPLOYER" --role=roles/storage.admin --format=none
done
g artifacts repositories add-iam-policy-binding taskflow-web --location=europe-southwest1 \
  --member="serviceAccount:$DEPLOYER" --role=roles/artifactregistry.reader --format=none
g artifacts repositories add-iam-policy-binding taskflow-api --location=europe-west3 \
  --member="serviceAccount:$DEPLOYER" --role=roles/artifactregistry.reader --format=none

# The staging API pins the newest version of its config secret: list versions, never read them.
g secrets add-iam-policy-binding taskflow-api-staging-config \
  --member="serviceAccount:$DEPLOYER" --role=roles/secretmanager.viewer --format=none

echo
echo "Done. GitHub Actions on main can now deploy as $DEPLOYER."
echo "Provider: projects/$NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"
