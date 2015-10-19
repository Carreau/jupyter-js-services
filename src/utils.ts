// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';


/**
 * Copy the contents of one object to another, recursively.
 *
 * From [stackoverflow](http://stackoverflow.com/a/12317051).
 */
export
function extend(target: any, source: any): any {
  target = target || {};
  for (var prop in source) {
    if (typeof source[prop] === 'object') {
      target[prop] = extend(target[prop], source[prop]);
    } else {
      target[prop] = source[prop];
    }
  }
  return target;
}


/**
 * Get a random 128b hex string (not a formal UUID)
 */
export
function uuid(): string {
  var s: string[] = [];
  var hexDigits = "0123456789abcdef";
  var nChars = hexDigits.length;
  for (var i = 0; i < 32; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * nChars));
  }
  return s.join("");
}


/**
 * Join a sequence of url components with `'/'`.
 */
export
function urlPathJoin(...paths: string[]): string {
  var url = '';
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (path === '') {
      continue;
    }
    if (i > 0) {
      path = path.replace(/\/\/+/, '/');
    }
    if (url.length > 0 && url.charAt(url.length - 1) != '/') {
      url = url + '/' + paths[i];
    } else {
      url = url + paths[i];
    }
  }
  return url
}


/**
 * Like os.path.split for URLs.
 * Always returns two strings, the directory path and the base filename
 */
export function urlPathSplit(path: string): string[] {
    
    var idx = path.lastIndexOf('/');
    if (idx === -1) {
        return ['', path];
    } else {
        return [ path.slice(0, idx), path.slice(idx + 1) ];
    }
 };


/**
 * Encode just the components of a multi-segment uri.  
 *
 * Preserves the `'/'` separators.
 */
export
function encodeURIComponents(uri: string): string {
  return uri.split('/').map(encodeURIComponent).join('/');
}


/**
 * Encode and join a sequence of url components with `'/'`.
 */
export
function urlJoinEncode(...args: string[]): string {
  return encodeURIComponents(urlPathJoin.apply(null, args));
}


/**
 * Return a serialized object string suitable for a query.
 *
 * From [stackoverflow](http://stackoverflow.com/a/30707423).
 */
export
function jsonToQueryString(json: any): string {
  return '?' + Object.keys(json).map(key =>
    encodeURIComponent(key) + '=' + encodeURIComponent(json[key])
  ).join('&');
}


/**
 * Input settings for an AJAX request.
 */
export
interface IAjaxSettings {
  method: string;
  dataType: string;
  contentType?: string;
  data?: any;
}


/**
 * Options for AJAX calls.
 */
export
interface IAjaxOptions {
  timeout?: number;
  requestHeaders?: { [key: string]: string; };
  async?: boolean;
  withCredentials?: boolean;
  user?: string;
  password?: string;
}


/**
 * Success handler for AJAX request.
 */
export
interface IAjaxSuccess {
  data: any;
  statusText: string;
  xhr: XMLHttpRequest;
}


/**
 * Error handler for AJAX request.
 */
export
interface IAjaxError {
  xhr: XMLHttpRequest;
  statusText: string;
  error: ErrorEvent;
}


/**
 * Asynchronous XMLHTTPRequest handler.
 *
 * Based on this [example](http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest).
 */
export
function ajaxRequest(url: string, settings: IAjaxSettings, options?: IAjaxOptions): Promise<any> {
  options = options || {};
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.open(settings.method, url, options.async, options.user,
             options.password);
    if (settings.contentType) {
      req.setRequestHeader('Content-Type', settings.contentType);
    }
    if (options.timeout !== void 0) req.timeout = options.timeout;
    if (options.withCredentials !== void 0) {
      req.withCredentials = options.withCredentials;
    }
    if (options.requestHeaders !== void 0) {
       for (var prop in options.requestHeaders) {
         req.setRequestHeader(prop, (options as any).requestHeaders[prop]);
       }
    }
    req.onload = () => {
      var response = req.responseText;
      if (settings.dataType === 'json' && response) {
        response = JSON.parse(response);
      }
      resolve({ data: response, statusText: req.statusText, xhr: req });
    };
    req.onerror = (err: ErrorEvent) => {
      reject({ xhr: req, statusText: req.statusText, error: err });
    };
    req.ontimeout = () => {
      reject({ xhr: req, statusText: req.statusText,
               error: new Error('Operation Timed Out') });
    }
    if (settings.data) {
      req.send(settings.data);
    } else {
      req.send();
    }
  });
}


var XHR_ERROR = 'XhrError';

var ajax_error_msg = function (jqXHR:any) {
    /**
     * Return a JSON error message if there is one,
     * otherwise the basic HTTP status text.
     */
    if (jqXHR.responseJSON && jqXHR.responseJSON.traceback) {
        return jqXHR.responseJSON.traceback;
    } else if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
        return jqXHR.responseJSON.message;
    } else {
        return jqXHR.statusText;
    }
};

export var log_ajax_error = function (jqXHR:any, status:any, error:any) {
    /**
     * log ajax failures with informative messages
     */
    var msg = "API request failed (" + jqXHR.status + "): ";
    console.log(jqXHR);
    msg += ajax_error_msg(jqXHR);
    console.log(msg);
};


/**
 * Wraps an AJAX error as an Error object.
 */
export var wrap_ajax_error = function (jqXHR:any, status:any, error:any) {
    var wrapped_error = <any>(new Error(ajax_error_msg(jqXHR)));
    wrapped_error.name =  XHR_ERROR;
    // provide xhr response
    wrapped_error.xhr = jqXHR;
    wrapped_error.xhr_status = status;
    wrapped_error.xhr_error = error;
    return wrapped_error;
};

/**
 * Like $.ajax, but returning an ES6 promise. success and error settings
 * will be ignored.
 */
export var promising_ajax = function(url:string, settings:any) {
    settings = settings || {};
    return new Promise(function(resolve, reject) {
        settings.success = function(data, status, jqXHR) {
            resolve(data);
        };
        settings.error = function(jqXHR, status, error) {
            log_ajax_error(jqXHR, status, error);
            reject(wrap_ajax_error(jqXHR, status, error));
        };
        return ajaxRequest(url, settings);
    });
};


/**
 * A Promise that can be resolved or rejected by another object.
 */
export
class PromiseDelegate<T> {

  /**
   * Construct a new Promise delegate.
   */
  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * Get the underlying Promise.
   */
  get promise(): Promise<T> {
    return this._promise;
  }

  /**
   * Resolve the underlying Promise with an optional value or another Promise.
   */
  resolve(value?: T | Thenable<T>): void {
    // Note: according to the Promise spec, and the `this` context for resolve 
    // and reject are ignored
    this._resolve(value);
  }

  /**
   * Reject the underlying Promise with an optional reason.
   */
  reject(reason?: any): void {
    // Note: according to the Promise spec, and the `this` context for resolve 
    // and reject are ignored
    this._reject(reason);
  }

  private _promise: Promise<T>;
  private _resolve: (value?: T | Thenable<T>) => void;
  private _reject: (reason?: any) => void;
}
