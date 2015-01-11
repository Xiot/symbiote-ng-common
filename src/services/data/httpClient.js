angular.module("symbiote.data")
    .provider('httpClient', HttpClientProvider);

function HttpClientProvider() {

    this.baseUri = "";
    this.authTokenName = "auth-token";
    this.authTokenType = "Bearer";

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

            uri = uri || "";

            if (uri.startsWith('/') && provider.baseUri.endsWith('/'))
                uri = uri.substring(1);

            return uri.indexOf('://', 0) < 0 ? provider.baseUri + uri : uri;
        }

        function _extendConfig(config) {

            config = config || {};
            
            
            //TODO: Move the authentication token stuff into an interceptor
            if (config.auth) {

                var authKey = '';
                for (var scheme in config.auth) {
                    authKey += scheme + ' ' + config.auth[scheme] + ' ';
                }

                angular.extend(config, {
                    headers: {
                        Authorization: authKey
                    }
                }, angular.copy(config));

            } else if (provider.authTokenName && provider.authTokenType) {
                var token = storageService.get(provider.authTokenName);
                if (token) {
                    angular.extend(config, {
                        headers: {
                            Authorization: provider.authTokenType + ' ' + token
                        }
                    }, angular.copy(config));
                }
            }
            return config;
        }
    }
}