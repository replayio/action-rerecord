// rerecord.js
function assert(condition, message) {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}
async function rerecordIssue(options) {
  const {
    client,
    apiKey,
    serverURL,
    recordingId,
    revision
  } = options;
  await client.initialize();
  const sessionRv = await client.sendCommand({
    method: "Recording.createSession",
    params: { recordingId }
  });
  const { sessionId } = sessionRv;
  assert(sessionId);
  const rv = await client.sendCommand({
    method: "Session.experimentalCommand",
    params: {
      name: "rerecordCompare",
      params: {
        rerecordServerURL: serverURL,
        apiKey
      }
    },
    sessionId
  });
  console.log("rerecordCompare finished", JSON.stringify(rv));
  const {
    result,
    rerecordedRecordingId,
    originalScreenshotURL,
    rerecordedScreenshotURL
  } = rv.rval;
  assert(result === "Success");
  assert(rerecordedRecordingId);
  assert(originalScreenshotURL);
  assert(rerecordedScreenshotURL);
  return `
Rerecording for ${revision}: https://app.replay.io/recording/${rerecordedRecordingId}

<table>
  <tr>
    <td>Before</td>
     <td>After</td>
  </tr>
  <tr>
    <td><img alt="Before" src="${originalScreenshotURL}"></td>
    <td><img alt="After" src="${rerecordedScreenshotURL}"></td>
  </tr>
</table>
`;
}
module.exports = rerecordIssue;
