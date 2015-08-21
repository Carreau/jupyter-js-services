// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

import expect = require('expect.js');

import { 
  ISessionId, ISessionOptions, NotebookSession
} from '../../lib/session';

import { deserialize, serialize } from '../../lib/serialize';

import { MockWebSocket, MockWebSocketServer } from './mocksocket';

import { RequestHandler, expectFailure } from './utils';


var DEFAULTS: ISessionOptions = {
  notebookPath: "test",
  kernelName: "python",
  baseUrl: "localhost",
  wsUrl: "ws://"
}

var DEFAULT_ID: ISessionId = {
  id: "1234", 
  notebook: { path: "test1" },
  kernel: { id: "1234", name: "test1" }
}


describe('jupyter.services - Session', () => {

  describe('#list()', () => {

    it('should yield a list of valid kernel ids', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data: ISessionId[] = [
        DEFAULT_ID,
        { id: "5678", 
          notebook: { path: "test2" },
          kernel: { id: "5678", name: "test2" }
        },
      ];
      handler.respond(200, data);
      return list.then((response: ISessionId[]) => {
        expect(response[0].kernel.id).to.be("1234"); 
        expect(response[0].kernel.name).to.be("test1"); 
        expect(response[0].notebook.path).to.be("test1");
        expect(response[0].id).to.be("1234");

        expect(response[1].kernel.id).to.be("5678"); 
        expect(response[1].kernel.name).to.be("test2");
        expect(response[1].notebook.path).to.be("test2");
        expect(response[1].id).to.be("5678");
        done();
      });
    });

    it('should throw an error for an invalid model', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data = { id: "1234", notebook: { path: "test" } };
      handler.respond(200, data);
      expectFailure(list, done, "Invalid Session list");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var list = NotebookSession.list('baseUrl');
      var data: ISessionId[] = [
        DEFAULT_ID,
        { id: "5678", 
          notebook: { path: "test2" },
          kernel: { id: "5678", name: "test2" }
        },
      ];
      handler.respond(201, data);
      expectFailure(list, done, "Invalid Status: 201");
    });

  });

  describe('#constructor()', () => {

    it('should set initial conditions', () => {
      var session = new NotebookSession(DEFAULTS);
      expect(session.kernel.name).to.be("python");
    });

  });

  describe('#start()', () => {

    it('should start a session', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      session.kernel.id = DEFAULT_ID.kernel.id;
      var server = new MockWebSocketServer(session.kernel.wsUrl);

      var start = session.start();
      var data = JSON.stringify(DEFAULT_ID);
      handler.respond(201, data);
      return start.then(() => {
        expect(session.kernel.id).to.be(DEFAULT_ID.kernel.id);
        expect(session.kernel.status).to.be('connected');
        done();
      });
    });

    it('should throw an error for an invalid session id', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var start = session.start();
      var data = { id: "1234" };
      handler.respond(200, data);
      return expectFailure(start, done, "Invalid response");
    });

    it('should throw an error for an invalid response', (done) => {
      var handler = new RequestHandler();
      var session = new NotebookSession(DEFAULTS);
      var start = session.start();
      handler.respond(200, DEFAULT_ID);
      return expectFailure(start, done, "Invalid response");
    });

  });

});
