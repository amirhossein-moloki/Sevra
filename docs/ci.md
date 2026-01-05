# Branch Protection Strategy

To maintain code quality and ensure the stability of the `main` branch, it is highly recommended to enable branch protection rules in the GitHub repository settings.

## Recommended Rules for the `main` Branch

1.  **Require a pull request before merging:** This ensures that all changes to the main branch are reviewed and approved by at least one other team member. It prevents direct pushes to the main branch and encourages a collaborative development process.

2.  **Require status checks to pass before merging:** This rule enforces that the CI pipeline must complete successfully before a pull request can be merged. This prevents broken code from being merged into the main branch.
    *   Enable the `test` job from the `ci.yml` workflow as a required status check.

3.  **Require conversation resolution before merging:** This ensures that all comments and feedback on a pull request are addressed before it is merged.

## How to Enable Branch Protection

1.  Navigate to the repository's **Settings** tab.
2.  In the left sidebar, click **Branches**.
3.  Click **Add rule**.
4.  In the **Branch name pattern** field, type `main`.
5.  Enable the following options:
    *   **Require a pull request before merging**
        *   **Require approvals:** Set to at least `1`.
    *   **Require status checks to pass before merging**
        *   Search for and select the `test` status check.
    *   **Require conversation resolution before merging**
6.  Click **Create**.
