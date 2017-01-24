"use strict";

module.exports.members=[
{slug:"michelin-star-restaurants",owner_screen_name:"LRestaurants"},
{slug:"aa-rosette-restaurants-3",owner_screen_name:"LRestaurants"},
{slug:"aa-rosette-restaurants-1",owner_screen_name:"LRestaurants"},
{slug:"good-food-guide-top-50",owner_screen_name:"LRestaurants"},
{slug:"sunday-times-top-100",owner_screen_name:"LRestaurants"},
{slug:"the-world-s-best-50",owner_screen_name:"LRestaurants"}
];

module.exports.constants = {
	mysql_username	: 'root',
	mysql_password	: '',
	mysql_database	: 'grosvenor',
	mysql_host		: 'localhost',
	twitter_consumer_key	: '',
	twitter_consumer_secret	: '',
	twitter_access_token_key		: '',
	twitter_access_token_secret		: '',
	twitter_maxMembersFetchCount	: 1500,
	facebook_access	: '',
	facebook_api_version : 'v2.8',
        facebook_app_id :   "",
	facebook_app_secret:  "",
	google_search_key : '',
	google_search_cx : '',
	access_token: []

};

module.exports.middlewareconstants = {
	fieldDelimter	:	'|',
	facebooklocations : 'locations.csv',
	facebooksearchtype	: 'Restaurant'
};
