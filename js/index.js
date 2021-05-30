//
var angularApp = angularApp || angular.module('sport-squiggle', []);
angularApp.controller('sports', function($scope, $http) {
    var get_current_year = function() {
        return (new Date()).getFullYear();
    };
    var get_season = function(month) {
        return parseInt((month + 2) / 3);
    };
    var get_current_season = function() {
        return get_season((new Date()).getMonth()+1);
    };
    var get_init_team_list_url = function() {
        return 'https://api.squiggle.com.au/?q=teams';
    };
    var get_prediction_url = function() {
        return 'https://api.squiggle.com.au/?q=tips;year=' + get_current_year();
    };
    var get_season_results_url = function() {
        return 'https://api.squiggle.com.au/?q=games;year=' + get_current_year();
    };
    var get_opponent_game_details_url = function() {
        return 'https://api.squiggle.com.au/?q=games;year=' + get_current_year();
    };
    var get_venues_won_url = function() {
        return 'https://api.squiggle.com.au/?q=games;year=' + get_current_year();
    };
    $scope.fetch_team_list = function() {
        $http.get(get_init_team_list_url()).then(function(response) {
            $scope.teamlist = response['data']['teams']
        });
    };
    $scope.pagination_class = function(page) {
        return $scope.current_index == page ? "active" : "";
    };
    $scope.do_pagination = function(page) {
        var page_data_fn = function(data, start, end) {
            return data.slice(start, end);
        };
        $scope.current_index = page;
        var start = (Math.max(1,page) - 1) * $scope.page_size,
            end   = start + $scope.page_size;
        switch($scope.currentpage) {
        case 1:
            $scope.current_predictions = page_data_fn($scope.predictions, start, end);
            break;
        case 2:
            $scope.current_season_game_results = page_data_fn($scope.season_game_results, start, end);
            break;
        case 3:
            $scope.current_opponent_game_details = page_data_fn($scope.opponent_game_details, start, end);
            break;
        case 4:
            $scope.current_venues_won_season = page_data_fn($scope.venues_won_season, start, end);
            break;
        case 5:
            $scope.current_head_to_head = page_data_fn($scope.head_to_head, start, end);
            break;
        default: //NEVER happen
        }
    };
    $scope.page_size = 10;
    $scope.num_pages = 0;
    $scope.page_list = [];
    $scope.current_index = 1;
    // 1 -- Prediction
    // 2 -- Results of all games in this season
    // 3 -- Opponent &amp; games details
    // 4 -- All the venues
    // 5 -- Head-to-head games
    $scope.currentpage = 1;
    // id of my team
    $scope.myteam = '';
    // all teams
    $scope.teamlist = [];
    // all predictions
    $scope.predictions = [];
    // current page predictions
    $scope.current_predictions = [];
    // all results of the games played in this season
    $scope.season_game_results = [];
    // current page results of the games played in this season
    $scope.current_season_game_results = [];
    //
    $scope.opponent_game_details = [];
    $scope.current_opponent_game_details = [];
    //
    $scope.venues_won_season = [];
    $scope.current_venues_won_season = [];
    //
    $scope.head_to_head = [];
    $scope.current_head_to_head = [];
    // initialize team list
    $scope.fetch_team_list();
    // handle clicking event of left navigation menu item
    $scope.menu_clicked = function(identifier) {
        $scope.currentpage = identifier;
    };
    // handle of clicking "Predictions"
    $scope.update_predictions = function() {
        if($scope.myteam) {// a team is choosen
            $http.get(get_prediction_url()).then(function(response) {
                var new_predictions = []
                var all_tips = response['data']['tips'];
                var next_round = -1;
                var current_date = (new Date).toISOString().replace('T', ' ');
                for(var i = 0; i < all_tips.length; ++i) {
                    if(all_tips[i]['hteamid'] != $scope.myteam && all_tips[i]['ateamid'] != $scope.myteam) {
                        continue;
                    }
                    if(current_date >= all_tips[i]['date']) {
                        continue;
                    }
                    // filter
                    if(-1 == next_round) {
                        next_round = all_tips[i]['round'];
                    } else if(all_tips[i]['round'] != next_round) {
                        continue;
                    }
                    var hconfidence = parseFloat(all_tips[i]['hconfidence']),
                        aconfidence = parseFloat(all_tips[i]['confidence']);
                    if(all_tips[i]['hteamid'] == $scope.myteam && hconfidence > 50
                        || all_tips[i]['ateamid'] == $scope.myteam && aconfidence > 50) {
                        new_predictions.push(all_tips[i]);
                    }
                }
                // update predictions
                $scope.predictions  = new_predictions;
                $scope.current_index= 1;
                $scope.num_pages    = parseInt(($scope.predictions.length + $scope.page_size - 1) / $scope.page_size);
                $scope.page_list    = [];
                for(var i = 1; i <= $scope.num_pages; ++i) {
                    $scope.page_list.push(i);
                }
                $scope.do_pagination(1);
            });
        } else {// no team choosen
            $scope.predictions   = [];
            $scope.current_index = 1;
            $scope.num_pages     = 0;
            $scope.page_list     = [];
            $scope.do_pagination(1);
        }
    };
    // handle clicking of "Results of all games in this season"
    $scope.update_games_results = function() {
        if($scope.myteam) {
            $http.get(get_season_results_url()).then(function(response) {
                var season_results = [];
                var results = response['data']['games'];
                var current_season = get_current_season();
                for(var i = 0; i < results.length; ++i) {
                    if(results[i].hteamid != $scope.myteam && results[i].ateamid != $scope.myteam) {
                        continue;
                    }
                    var season = get_season(parseInt(results[i]['date'].split(' ')[0].split('-')[1]));
                    // only matches of this season
                    if(season == current_season && '100' == results[i]['complete']) {
                        season_results.push(results[i]);
                    }
                }
                $scope.season_game_results = season_results;
                $scope.current_index       = 1;
                $scope.num_pages           = parseInt(($scope.season_game_results.length + $scope.page_size - 1) / $scope.page_size);
                $scope.page_list           = [];
                for(var i = 1; i <= $scope.num_pages; ++i) {
                    $scope.page_list.push(i);
                }
                $scope.do_pagination(1);
            });
        } else {
            $scope.season_game_results = [];
            $scope.current_index       = 1;
            $scope.num_pages           = 0;
            $scope.page_list           = [];
        }
    };
    // handle clicking of Opponent & games details"
    $scope.update_opponent_games = function() {
        if($scope.myteam) {
            $http.get(get_opponent_game_details_url()).then(function(response) {
                var opponents = [];
                var results = response['data']['games'];
                var round = -1;
                var current_date = (new Date).toISOString().replace('T', ' ');
                for(var i = 0; i < results.length; ++i) {
                    if(results[i].hteamid != $scope.myteam && results[i].ateamid != $scope.myteam) {
                        continue;
                    }
                    // next 5 matches
                    if(results[i]['date'] > current_date && opponents.length < 5) {
                        opponents.push(results[i]);
                    }
                }
                $scope.opponent_game_details = opponents;
                $scope.current_index         = 1;
                $scope.num_pages             = parseInt(($scope.opponent_game_details.length + $scope.page_size - 1) / $scope.page_size);
                $scope.page_list             = [];
                for(var i = 1; i <= $scope.num_pages; ++i) {
                    $scope.page_list.push(i);
                }
                $scope.do_pagination(1);
            });
        } else {
            $scope.opponent_game_details = [];
            $scope.current_index         = 1;
            $scope.num_pages             = 0;
            $scope.page_list             = [];
        }
    };
    // handle clicking of "All the venues"
    $scope.update_venues = function() {
        if($scope.myteam) {
            $http.get(get_venues_won_url()).then(function(response) {
                var venues_won = [];
                var results = response['data']['games'];
                var current_season = get_current_season();
                for(var i = 0; i < results.length; ++i) {
                    if(results[i].hteamid != $scope.myteam && results[i].ateamid != $scope.myteam) {
                        continue;
                    }
                    if(results[i].winnerteamid != $scope.myteam) {
                        continue;
                    }
                    var season = get_season(parseInt(results[i]['date'].split(' ')[0].split('-')[1]));
                    // only matches of this season
                    if(season == current_season) {
                        venues_won.push(results[i]);
                    }
                }
                $scope.venues_won_season = venues_won;
                $scope.current_index     = 1;
                $scope.num_pages         = parseInt(($scope.venues_won_season.length + $scope.page_size - 1) / $scope.page_size);
                $scope.page_list         = [];
                for(var i = 1; i <= $scope.num_pages; ++i) {
                    $scope.page_list.push(i);
                }
                $scope.do_pagination(1);
            });
        } else {
            $scope.venues_won_season = [];
            $scope.current_index     = 1;
            $scope.num_pages         = 0;
            $scope.page_list         = [];
        }
    };
    // handle clicking of "Head-to-head games"
    $scope.update_head_to_head= function() {
        if($scope.myteam) {
            $http.get(get_season_results_url()).then(function(response) {
                var season_results = [];
                var results = response['data']['games'];
                var current_season = get_current_season();
                for(var i = 0; i < results.length; ++i) {
                    if(results[i].hteamid != $scope.myteam && results[i].ateamid != $scope.myteam) {
                        continue;
                    }
                    var season = get_season(parseInt(results[i]['date'].split(' ')[0].split('-')[1]));
                    // only matches of this season
                    if(season == current_season) {
                        season_results.push(results[i]);
                    }
                }
                $scope.head_to_head = season_results;
                $scope.current_index = 1;
                $scope.num_pages   = parseInt(($scope.head_to_head.length + $scope.page_size - 1) / $scope.page_size);
                $scope.page_list   = [];
                for(var i = 1; i <= $scope.num_pages; ++i) {
                    $scope.page_list.push(i);
                }
                $scope.do_pagination(1);
            });
        } else {
            $scope.head_to_head = [];
            $scope.current_index= 1;
            $scope.num_pages    = 0;
            $scope.page_list    = [];
        }
    };
    // update content according to the navigation menu item clicked
    var update_content_handle = function() {
        switch($scope.currentpage) {
        case 1: $scope.update_predictions();   break;
        case 2: $scope.update_games_results(); break;
        case 3: $scope.update_opponent_games();break;
        case 4: $scope.update_venues();        break;
        case 5: $scope.update_head_to_head();  break;
        default: // NEVER happen
            break;
        }
    };
    // watchers
    // update table list when myteam changes
    $scope.$watch('myteam', function(newVal, oldVal) {
        update_content_handle();
    });
    $scope.$watch('currentpage', function(newVal, oldVal) {
        update_content_handle();
    });
    // extra functions(update the css class of navigation menu item dynamically)
    $scope.get_nav_item_class = function(identifier) {
        var klass = "nav-menu-item";
        if(identifier == $scope.currentpage) {// is current menu item, then add "active"
            klass = klass + ' active';
        }
        return klass;
        
    };
});
