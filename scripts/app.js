'use strict';

var app = angular.module('app', ['ui.router', 'ngResource', 'flash', 'ui.bootstrap'])
        .constant('backend', {
            url: 'http://localhost:3000',
            secure: 'https://localhost:8000'
        })
        .config(function ($sceDelegateProvider, backend) {
            $sceDelegateProvider.resourceUrlWhitelist([
                'self',
                '*://www.youtube.com/**',
                backend.url,
                backend.secure
            ]);
        })
        .config(function ($httpProvider) {
            $httpProvider.interceptors.push('AuthInterceptor');
        })
        .config(function($locationProvider){
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
});
        })

        .factory("genericServices", function () {
            return {
                videoId: function (url) {
                    if (!url) {
                        url = 'https://youtube.com';
                    }
                    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
                    var match = url.match(regExp);
                    if (match && match[7].length == 11) {
                        return match[7];
                    } else {
                        console.log("Url is incorrect");
                    }
                },
                setVideoId: function (url) {
                    this.videoId(url);
                },
                videoUrl: function (url) {
                    return "https://www.youtube.com/embed/" + this.videoId(url);
                }
            };
        })
        .directive('myYoutube', function ($sce) {
            return {
                restrict: 'EA',
                scope: {code: '='},
                replace: true,
                templateUrl: 'views/youtubeVideo.html',
                link: function (scope) {
                    console.log('here');
                    scope.$watch('code', function (newVal) {
                        if (newVal) {
                            scope.url = $sce.trustAsResourceUrl("http://www.youtube.com/embed/" + newVal);
                        }
                    });
                }
            };
        })

        .config(function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise("/404");
            $stateProvider
                    .state('index', {
                        url: '/',
                        templateUrl: "/views/index.html"
                    })
                    .state('admin', {
                        url: '/admin',
                        templateUrl: 'views/admin.html'
                    })
                    .state('admin.muscules', {
                        parent: 'admin',
                        url: '/muscules',
                        templateUrl: 'views/muscules.html',
                        controller: 'adminMusculeCtrl'
                    })
                    .state('admin.muscule', {
                        parent: 'admin',
                        url: '/muscule/:id',
                        templateUrl: 'views/muscule.html',
                        controller: 'singleMusculeCtrl'
                    })
                    .state('admin.exercises', {
                        parent: 'admin',
                        url: '/exercises',
                        templateUrl: 'views/exercises.html',
                        controller: 'adminExerciseCtrl'
                    })
                    .state('404', {
                        url: "/404",
                        templateUrl: "views/404.html"
                    })
                    ;
        })


        .factory('musculeService', function (backend, $resource) {
            return $resource(backend.url + '/muscule/:id', null, {'update': {method: 'PUT'}});
        })
        
        .factory('exerciseService', function (backend, $resource) {
            return $resource(backend.url + '/exercise/:id', null, {'update': {method: 'PUT'}});
        });
app.controller('adminMusculeCommonCtrl', function ($scope, musculeService, flash, $location, genericServices) {
    $scope.previewImageSrc = function (videoUrl) {
        // TODO move it to genericServices
        var url = "http://img.youtube.com/vi/" + genericServices.videoId(videoUrl) + "/mqdefault.jpg";
        return url;
    };
    $scope.populate = function (data) {
        $scope.popupAction = 'edit';
        $scope.master = data;
        $scope.m = angular.copy(data);
        console.log(data);
    };
    $scope.reset = function () {
        $scope.popupAction = 'add new';
        $scope.m = {};
    };
    $scope.update = function (m) {
        console.log('updaded ');
        var data = m;
        musculeService.update({id: m.id}, m, function () {
            $scope.master.title = data.title;
            $scope.master.description = data.description;
            $scope.master.video = data.video;
            $('#myModal').modal('hide');
            flash('alert alert-success', 'muscule ' + $scope.master.title + ' updated');
            $scope.code = genericServices.videoId($scope.master.video);
            console.log(typeof $scope.code);
            $scope.show = (typeof $scope.code == 'string');
        });
    };
    $scope.save = function (m) {
        musculeService.save(m, function (m) {
            $('#myModal').modal('hide');
            flash('alert alert-success', 'muscule "' + $scope.m.title + '" added');
            $scope.m = {};
            console.log(m);
            if ($scope.muscules)
                $scope.muscules.push(m);
        }, function (err) {
            console.log(err);
        });
    };
    $scope.delete = function (m, inx) {
        console.log(m);

        musculeService.delete({id: m.id}, function () {
            if (inx !== null) {
                var to_delete = $scope.muscules[inx];
                console.log(m);
                $scope.muscules.splice(inx, 1);
            } else {
                $location.path("admin/muscules");
            }
            flash('alert alert-warning', 'muscule "' + m.title + '" deleted');
        });
    };
});

app.controller('adminExerciseCommonCtrl', function ($scope, exerciseService, flash, $location) {    
    $scope.populate = function (data) {
        $scope.popupAction = 'edit';
        $scope.master = data;
        $scope.e = angular.copy(data);
        console.log(data);
    };
    $scope.reset = function () {
        $scope.popupAction = 'add new';
        $scope.e = {};
    };
    $scope.update = function (e) {
        console.log('updaded ');
        var data = e;
        exerciseService.update({id: e.id}, e, function () {
            $scope.master.name = data.name;
            $scope.master.description = data.description;
            
            $('#myModal').modal('hide');
            flash('alert alert-success', 'exercise ' + $scope.master.name + ' updated'); 
        });
    };
    $scope.save = function (e) {
        exerciseService.save(e, function (e) {
            console.log(e);
            $('#myModal').modal('hide');
            flash('alert alert-success', 'exercise "' + $scope.e.name + '" added');
            $scope.e = {};
            console.log(e);
            if ($scope.exercises)
                $scope.exercises.push(e);
        }, function (err) {
            console.log(err);
        });
    };
    $scope.delete = function (e, inx) {
        console.log(e);
        exerciseService.delete({id: e.id}, function () {
            if (inx !== null) {
                var to_delete = $scope.exercises[inx];
                console.log(e);
                $scope.exercises.splice(inx, 1);
            } else {
                $location.path("admin/exercises");
            }
            flash('alert alert-warning', 'exercise "' + e.title + '" deleted');
        });
    };
});





app.controller('adminMusculeCtrl', function ($scope, musculeService, $controller) {
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.perPage = 10;
    $scope.popupAction = 'add new';
    var getMuscules = function (page, perPage) {
        return musculeService.get({page: page, perPage: perPage}, function (muscules) {
            $scope.muscules = muscules.rows;
            console.log(muscules.rows);
            $scope.totalItems = parseInt(muscules.count);

        });
    };
    $scope.pageChanged = function () {
        $scope.muscules = getMuscules($scope.currentPage, $scope.perPage);
    };
    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };
    $scope.muscules = getMuscules($scope.currentPage, $scope.perPage);
    angular.extend(this, $controller('adminMusculeCommonCtrl', {$scope: $scope}));
});

app.controller('singleMusculeCtrl', function ($scope, $stateParams, musculeService, genericServices, $controller) {

    console.log($stateParams);
    var muscule = musculeService.get({id: $stateParams.id}, function () {
        //$scope.videoId = genericServices.videoId(muscule.video);
        $scope.video = genericServices.videoUrl(muscule.video);
        $scope.muscule = muscule;
        $scope.code = genericServices.videoId(muscule.video);
        $scope.show = (typeof $scope.code == 'string');
        console.log($scope.show);
    });
    angular.extend(this, $controller('adminMusculeCommonCtrl', {$scope: $scope}));

});
app.controller('adminExerciseCtrl', function ($scope, backend, flash, exerciseService, $controller) {
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.perPage = 10;
    var getExercises = function (page, perPage) {
        return exerciseService.get({page: page, perPage: perPage}, function (exercises) {
            $scope.exercises = exercises.rows;
            console.log(exercises.rows);
            $scope.totalItems = parseInt(exercises.count);

        });
    };
    $scope.pageChanged = function () {
        $scope.exercises = getExercises($scope.currentPage, $scope.perPage);
    };
    $scope.setPage = function (pageNo) {
        $scope.currentPage = pageNo;
    };
    $scope.exercises = getExercises($scope.currentPage, $scope.perPage);
    $scope.popupAction = 'add new';    
    angular.extend(this, $controller('adminExerciseCommonCtrl', {$scope: $scope}));
});
app.controller('loginCtrl', function ($scope, backend, $http, UserFactory, $state, flash) {
    //$scope.user = UserFactory.getUser();

    $scope.user = {
        username: UserFactory.getUser()
    };
    $scope.isLoggedIn = UserFactory.isLoggedIn();
    console.log($scope.isLoggedIn);
    $scope.login = function (name, password) {
        UserFactory.login(name, password)
                .success(function (data) {
                    $scope.user = data.user;
                    console.log(data);
                    $state.reload();
                    flash('alert alert-success', 'logging in');
                    $scope.isLoggedIn = true;
                })
                .error(function (err) {
                    flash('alert alert-danger', 'login or password are incorrect');
                });
    };
    $scope.logout = function () {
        UserFactory.logout();
        $scope.user = $scope.u = {};
        $scope.isLoggedIn = false;
    };
});
app.factory('UserFactory', function ($window, $http, backend, AuthTokenFactory, $q) {
    var store = $window.localStorage;
    return {
        login: function (name, password) {
            return $http.post(backend.secure + '/login', {
                username: name,
                password: password
            })
                    .success(function (data) {
                        AuthTokenFactory.setToken(data.token);
                        store.setItem('username', data.user.username);
                        console.log('user is');
                        console.log(data.user);
                    });
        },
        logout: function () {
            AuthTokenFactory.removeToken();
            store.removeItem('user');
        },
        getUser: function () {
            if (AuthTokenFactory.getToken()) {
                return store.getItem('username');
            } else {
                $q.reject('no auth token');
            }

        },
        isLoggedIn: function () {
            return !!AuthTokenFactory.getToken();
        }
    };
});
app.factory('AuthTokenFactory', function ($window, $location, flash) {
    var store = $window.localStorage;
    var key = 'auth-token';
    return {
        getToken: getToken,
        setToken: setToken,
        removeToken: removeToken
    };
    function getToken() {
        return store.getItem(key);
    }
    function setToken(token) {
        if (token) {
            store.setItem(key, token);
        } else {
            store.removeItem(key);
        }
    }
    function removeToken() {
        store.removeItem(key);
        $location.path("/");
        flash('alert alert-warning', 'logging out');
    }

});
app.factory('AuthInterceptor', function AuthInterceptor(AuthTokenFactory) {
    return {
        request: addToken
    };
    function addToken(config) {
        var token = AuthTokenFactory.getToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
    }
});