export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these values
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, semicolons, etc.)
        'refactor', // Code refactoring (no functional changes)
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system or external dependencies
        'ci', // CI/CD configuration changes
        'chore', // Maintenance tasks
        'revert', // Reverting a previous commit
      ],
    ],
    // Scope is optional but should be lowercase if provided
    'scope-case': [2, 'always', 'lower-case'],
    // Subject should not be empty and not end with a period
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    // Body and footer are optional
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
