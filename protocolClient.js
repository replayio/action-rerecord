const WebSocket = require('ws');
const replayWsServer = "wss://dispatch.replay.io";

function logDebug(msg, tags = {}) {
  console.log(msg, JSON.stringify(tags));
}

class ProtocolError extends Error {
  protocolCode;
  protocolMessage;
  protocolData;

  constructor(error) {
    super(`protocol error ${error.code}: ${error.message}`);

    this.protocolCode = error.code;
    this.protocolMessage = error.message;
    this.protocolData = error.data ?? {};
  }

  toString() {
    return `Protocol error ${this.protocolCode}: ${this.protocolMessage}`;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

function createDeferred() {
  let resolve, reject;
  const promise = new Promise(r => { resolve = r }, r => { reject = r });
  return { promise, resolve, reject };
}

class ProtocolClient {
  eventListeners = new Map();
  nextMessageId = 1;
  pendingCommands = new Map();
  socket;

  constructor() {
    logDebug(`Creating WebSocket for ${replayWsServer}`);

    this.accessToken = accessToken;
    this.socket = new WebSocket(replayWsServer);

    this.socket.on("close", this.onSocketClose);
    this.socket.on("error", this.onSocketError);
    this.socket.on("open", this.onSocketOpen);
    this.socket.on("message", this.onSocketMessage);

    this.listenForMessage("Recording.sessionError", error => {
      logDebug(`Session error ${error}`);
    });
  }

  close() {
    this.socket.close();
  }

  listenForMessage(method, callback) {
    let listeners = this.eventListeners.get(method);
    if (listeners == null) {
      listeners = new Set([callback]);

      this.eventListeners.set(method, listeners);
    } else {
      listeners.add(callback);
    }

    return () => {
      listeners.delete(callback);
    };
  }

  sendCommand({ method, params, sessionId }) {
    const id = this.nextMessageId++;

    logDebug("Sending command", { id, method, params, sessionId });

    const command = {
      id,
      method,
      params,
      sessionId,
    };

    this.socket.send(JSON.stringify(command), error => {
      if (error) {
        logDebug("Received socket error", { error });
      }
    });

    const deferred = createDeferred();
    this.pendingCommands.set(id, deferred);
    return deferred.promise;
  }

  onSocketClose = () => {
    logDebug("Socket closed");
  };

  onSocketError = error => {
    logDebug(`Socket error ${error}`);
  };

  onSocketMessage = contents => {
    const { error, id, method, params, result } = JSON.parse(String(contents));

    if (id) {
      const deferred = this.pendingCommands.get(id);
      assert(deferred, `Received message with unknown id: ${id}`);

      this.pendingCommands.delete(id);
      if (result) {
        logDebug("Resolving response", { contents });
        deferred.resolve(result);
      } else if (error) {
        logDebug("Received error", { contents });
        deferred.reject(new ProtocolError(error));
      } else {
        logDebug("Received error", { contents });
        deferred.reject(new Error(`Channel error: ${contents}`));
      }
    } else if (this.eventListeners.has(method)) {
      logDebug("Received event", { contents });
      const callbacks = this.eventListeners.get(method);
      if (callbacks) {
        callbacks.forEach(callback => callback(params));
      }
    } else {
      logDebug("Received message without a handler", { contents });
    }
  };

  onSocketOpen = async () => {
    logDebug("Socket opened");
  };
}

module.exports = ProtocolClient;
