 angular.module('symbiote.data')
 	.factory('eventService', EventService);

 /* ngInject */
 function EventService($rootScope) {

 	var service = {
 		on: addListener,
 		raise: fireEvent
 	};

 	return service;

 	function addListener(eventName, listener) { 		
        return $rootScope.$on(eventName, listener);   
 	}

 	function fireEvent(eventName, args) {
        $rootScope.$emit(eventName, args); 		
 	}
 }