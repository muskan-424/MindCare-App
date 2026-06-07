#!/bin/bash

# Vercel Ignored Build Step script
# Returns 1 (build) if there are changes in the backend directory.
# Returns 0 (skip build) if there are no changes in the backend directory.

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"
echo "VERCEL_GIT_PREV_COMMIT_SHA: $VERCEL_GIT_PREV_COMMIT_SHA"
echo "VERCEL_GIT_COMMIT_SHA: $VERCEL_GIT_COMMIT_SHA"

# If this is a build for a branch promotion or there is no previous commit, proceed with build
if [ -z "$VERCEL_GIT_PREV_COMMIT_SHA" ]; then
  echo "No previous commit SHA found. Proceeding with build."
  exit 1
fi

# Compare the current commit with the previous commit for the backend folder.
# Since this script runs in the root directory or backend directory, we'll check relative path.
# If we are in backend/, '.' is backend. If we are in root, 'backend/' is backend.
# Let's handle both dynamically:
if [ -d "backend" ]; then
  TARGET_PATH="backend/"
else
  TARGET_PATH="."
fi

echo "Comparing changes for path: $TARGET_PATH"
git diff --quiet $VERCEL_GIT_PREV_COMMIT_SHA $VERCEL_GIT_COMMIT_SHA -- "$TARGET_PATH"

RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "No changes detected in $TARGET_PATH. Skipping build."
else
  echo "Changes detected in $TARGET_PATH. Proceeding with build."
fi

exit $RESULT
