// issueRecording.js
var fs = require("fs");
function scanRecordingId(body) {
  const match = body.match(/https:\/\/app.replay\.io\/recording\/([a-zA-Z0-9\-]+)/);
  if (!match) {
    return null;
  }
  const titleAndId = match[1];
  const match2 = titleAndId.match(/^.*?--([a-zA-Z0-9\-]+)$/);
  if (match2) {
    return match2[1];
  }
  return titleAndId;
}
async function getIssueRecording(options) {
  const { github, eventPath, repositoryName } = options;
  const eventPayload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const [owner, repo] = repositoryName.split("/");
  const prNumber = eventPayload.pull_request.number;
  const prRevision = eventPayload.pull_request.head.sha;
  console.log("PullRequestData", owner, repo, prNumber, prRevision);
  const query = `
    query($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          closingIssuesReferences(first: 10) {
            nodes {
              number
            }
          }
        }
      }
    }
  `;
  const linkedIssuesResult = await github.graphql(query, {
    owner,
    repo,
    prNumber
  });
  const linkedIssues = linkedIssuesResult.repository.pullRequest.closingIssuesReferences.nodes.map((node) => node.number);
  console.log("LinkedIssueNumbers", JSON.stringify(linkedIssues));
  if (!linkedIssues.length) {
    throw new Error("No linked issues found");
  }
  if (linkedIssues.length > 1) {
    throw new Error("More than one linked issue found");
  }
  const issueNumber = linkedIssues[0];
  const issue = await github.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  });
  console.log("LinkedIssueContents", issueNumber, issue.data.title, issue.data.body);
  const recordingId = scanRecordingId(issue.data.body);
  return { owner, repo, prNumber, prRevision, issueNumber, recordingId };
}
module.exports = getIssueRecording;
