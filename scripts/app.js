'use strict';

var app = angular.module('app', ['ui.router', 'ngResource', 'flash', 'ui.bootstrap'])
        .config(function ($sceDelegateProvider) {
            $sceDelegateProvider.resourceUrlWhitelist([
                'self',
                '*://www.youtube.com/**'
            ]);
        })
        .config(function ($httpProvider) {
            $httpProvider.interceptors.push('AuthInterceptor');
        })
        .constant('backend', {
            url: 'http://localhost:3000',
            secure: 'https://localhost:8000'
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
                    .state('404', {
                        url: "/404",
                        templateUrl: "views/404.html"
                    })
                    ;
        })


        .factory('musculeService', function (backend, $resource) {
            return $resource(backend.url + '/muscule/:id', null, {'update': {method: 'PUT'}});
        })
        ;
app.controller('adminMusculeCommonCtrl', function ($scope, musculeService, flash, $location, genericServices) {
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
        }, function (err) {
            console.log(err);
        });
    };
    $scope.delete = function (m, inx) {
        console.log(m);
        musculeService.delete({id: m.id}, function () {
            if (inx) {
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