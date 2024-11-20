# `replayio/action-rerecord`

Rerecord reported issues.

## Usage

1. Log into [app.replay.io](https://app.replay.io)
2. Create a [Team API key](https://docs.replay.io/docs/setting-up-a-team-f5bd9ee853814d6f84e23fb535066199#4913df9eb7384a94a23ccbf335189370) (Personal API keys can be used, but have a limit of 10 recordings)
3. Store the API key as a [GitHub Repository Secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) named `RECORD_REPLAY_API_KEY`
4. Add the configuration below to your existing workflow

```yaml
- uses: replayio/action-rerecord@latest
  with:
    api-key: ${{ secrets.RECORD_REPLAY_API_KEY }}
```

## Arguments

| Required           | Name                | Description                                                                                                                                           | Default |
| ------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| :white_check_mark: | `api-key`           | The Replay API Key used to upload recordings                                                                                                          |
| &nbsp;             | `public`            | When true, make the rerecorded replay public on upload                                                                                                              | `false` |
| &nbsp;             | `include-summaries` | When true, the rerecorded replay is added to the GitHub workflow summary page                                                                   | `true`  |
