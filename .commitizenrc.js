module.exports = {
  types: [
    { value: 'feat', name: 'feat:     A new feature' },
    { value: 'fix', name: 'fix:      A bug fix' },
    { value: 'docs', name: 'docs:     Documentation only changes' },
    { value: 'style', name: 'style:    Changes that do not affect the meaning of the code' },
    { value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature' },
    { value: 'perf', name: 'perf:     A code change that improves performance' },
    { value: 'test', name: 'test:     Adding missing tests or correcting existing tests' },
    { value: 'chore', name: 'chore:    Changes to the build process or auxiliary tools' },
    { value: 'revert', name: 'revert:   Revert to a previous commit' },
    { value: 'ci', name: 'ci:        Changes to CI configuration files and scripts' },
    { value: 'build', name: 'build:    Changes that affect the build system or external dependencies' },
  ],
  
  scopes: [
    { name: 'components', description: 'UI components' },
    { name: 'pages', description: 'Pages and routing' },
    { name: 'api', description: 'API endpoints' },
    { name: 'lib', description: 'Utility functions and libraries' },
    { name: 'types', description: 'TypeScript type definitions' },
    { name: 'styles', description: 'CSS and styling' },
    { name: 'tests', description: 'Testing infrastructure' },
    { name: 'docs', description: 'Documentation' },
    { name: 'config', description: 'Configuration files' },
    { name: 'deps', description: 'Dependencies' },
    { name: 'ci', description: 'CI/CD' },
    { name: 'dev', description: 'Development tools' },
  ],
  
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix', 'refactor', 'perf'],
  
  // Limit the length of the commit message
  subjectLimit: 100,
  
  // Customize the commit message format
  messages: {
    type: "Select the type of change that you're committing:",
    scope: 'Denote the SCOPE of this change (optional):',
    subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
    body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: 'List any BREAKING CHANGES (optional):\n',
    footer: 'List any ISSUES CLOSED by this change (optional). E.g.: ISSUES CLOSED: #123, #456:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above?',
  },
};
