(function () {
    'use strict';
    angular.module('symbiote.data', []);
}());
(function () {
    'use strict';
    angular.module('symbiote.data').factory('storageService', StorageService);
    /* @ngInject */
    function StorageService($window) {
        var _local = $window.localStorage;
        var _session = $window.sessionStorage;
        return {
            get: _get,
            set: _set,
            has: _has,
            remove: _remove
        };
        function _get(key) {
            var sessionValue = _session[key];
            if (_isSet(sessionValue))
                return _safeParse(sessionValue);
            var localValue = _local[key];
            if (_isSet(localValue))
                return _safeParse(localValue);
            return undefined;
        }
        function _set(key, value, persist) {
            if (_isUnset(value))
                return _remove(key);
            var store = !!persist ? _local : _session;
            var json = JSON.stringify(value);
            store.setItem(key, value);
        }
        function _remove(key) {
            delete _local[key];
            delete _session[key];
        }
        function _has(key) {
            return _isSet(_session[key]) || _isSet(_local[key]);
        }
        function _safeParse(jsonText) {
            if (jsonText === undefined || jsonText === null)
                return jsonText;
            if (typeof jsonText !== 'string')
                return jsonText;
            if (jsonText.length === 0)
                return jsonText;
            try {
                return JSON.parse(jsonText);
            } catch (e) {
                return jsonText;
            }
        }
        function _isUnset(value) {
            return value === undefined || value === null;
        }
        function _isSet(value) {
            return value !== undefined && value != null;
        }
    }
    StorageService.$inject = ["$window"];
}());
(function () {
    'use strict';
    angular.module('symbiote.data').provider('httpClient', HttpClientProvider);
    function HttpClientProvider() {
        this.baseUri = '';
        this.authTokenName = 'auth-token';
        this.authTokenType = 'Bearer';
        var provider = this;
        this.$get = HttpClient;
        /* @ngInject */
        function HttpClient($http, $q, $cacheFactory, storageService) {
            var service = {
                get: _get,
                post: _post,
                put: _put,
                delete: _delete,
                patch: _patch
            };
            return service;
            function _get(uri, config) {
                return _execute('GET', uri, null, config);
            }
            function _post(uri, data, config) {
                return _execute('POST', uri, data, config);
            }
            function _put(uri, data, config) {
                return _execute('PUT', uri, data, config);
            }
            function _delete(uri, config) {
                return _execute('DELETE', uri, null, config);
            }
            function _patch(uri, data, config) {
                return _execute('PATCH', uri, data, config);
            }
            function _execute(method, uri, data, config) {
                config = _extendConfig(config);
                var request = {
                    method: method,
                    url: _getAbsoluteUri(uri),
                    data: data
                };
                angular.extend(request, config);
                if (config.forceRefresh) {
                    var httpCache = $cacheFactory.get('$http');
                    httpCache.remove(fullUri);
                }
                return $http(request);
            }
            function _getAbsoluteUri(uri) {
                if (!provider.baseUri)
                    return uri;
                uri = uri || '';
                if (uri.startsWith('/') && provider.baseUri.endsWith('/'))
                    uri = uri.substring(1);
                return uri.indexOf('://', 0) < 0 ? provider.baseUri + uri : uri;
            }
            function _extendConfig(config) {
                if (!config)
                    return {};
                //TODO: Move the authentication token stuff into an interceptor
                if (config.auth) {
                    var authKey = '';
                    for (var scheme in config.auth) {
                        authKey += scheme + ' ' + config.auth[scheme] + ' ';
                    }
                    angular.extend(config, { headers: { Authorization: authKey } }, angular.copy(config));
                } else if (provider.authTokenName && provider.authTokenType) {
                    var token = storageService.get(provider.authTokenName);
                    if (token) {
                        angular.extend(config, { headers: { Authorization: provider.authTokenType + ' ' + token } }, angular.copy(config));
                    }
                }
                return config;
            }
        }
        HttpClient.$inject = ["$http", "$q", "$cacheFactory", "storageService"];
    }
}());
(function () {
    'use strict';
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str) {
            return this.slice(0, str.length) == str;
        };
    }
    if (typeof String.prototype.endsWith != 'function') {
        String.prototype.endsWith = function (str) {
            return this.slice(-str.length) == str;
        };
    }
    if (typeof String.prototype.snakeCase != 'function') {
        String.prototype.snakeCase = function (separator) {
            var SNAKE_CASE_REGEXP = /[A-Z]/g;
            separator = separator || '-';
            return this.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
                return (pos ? separator : '') + letter.toLowerCase();
            });
        };
    }
    if (typeof String.prototype.contains != 'function') {
        String.prototype.contains = function (substring) {
            return this.indexOf(substring) !== -1;
        };
    }
}());
(function () {
    'use strict';
    angular.module('symbiote.common', ['symbiote.data']);
}());
//# sourceMappingURL=symbiote-ng-common.js.map