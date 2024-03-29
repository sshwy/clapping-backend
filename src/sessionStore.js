/* abstract */ class SessionStore {
  findSession (id) { }
  saveSession (id, session) { }
  findAllSessions () { }
}

class InMemorySessionStore extends SessionStore {
  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession (id) {
    return this.sessions.get(id);
  }

  saveSession (id, session) {
    this.sessions.set(id, session);
  }

  findAllSessions () {
    // @ts-ignore
    return [...this.sessions.values()];
  }
}

const sessionStore = new InMemorySessionStore();

module.exports = sessionStore;