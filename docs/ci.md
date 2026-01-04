# CI and Branch Protection

This document provides guidance on setting up branch protection rules in the GitHub repository to ensure code quality and stability.

## Branch Protection Rules

To protect the `main` branch, it is recommended to configure the following branch protection rules in the repository settings:

1.  **Require pull request before merging**: This ensures that all changes to the `main` branch are reviewed and approved through a pull request.
2.  **Require status checks to pass before merging**: This ensures that all required CI checks, including the `test-and-lint` job defined in `.github/workflows/ci.yml`, must pass before a pull request can be merged.
    -   Enable this setting and select the `test-and-lint` job from the list of available status checks.
3.  **Require branches to be up to date before merging**: This setting prevents pull requests from being merged if they are not up-to-date with the `main` branch, which helps to avoid merge conflicts.

### How to Configure Branch Protection

1.  Navigate to the repository's **Settings** tab.
2.  In the left sidebar, click **Branches**.
3.  Under **Branch protection rules**, click **Add rule**.
4.  In the **Branch name pattern** field, type `main`.
5.  Enable the recommended protection rules listed above.
6.  Click **Create** to save the rule.
