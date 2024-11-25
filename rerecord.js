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
        apiKey,
      },
    },
    sessionId,
  });
  console.log("rerecordCompare finished", JSON.stringify(rv));

  const {
    result,
    rerecordedRecordingId,
    originalScreenshotURL,
    rerecordedScreenshotURL,
  } = rv.rval;

  assert(result === "Success");
  assert(rerecordedRecordingId);
  assert(originalScreenshotURL);
  assert(rerecordedScreenshotURL);

  return `
Rerecording: https://app.replay.io/recording/${rerecordedRecordingId}

Original screenshot:

![original](${originalScreenshotURL})

Rerecorded screenshot:

![rerecorded](${rerecordedScreenshotURL})
`;
}

module.exports = rerecordIssue;
