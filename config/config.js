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
	mysql_password	: 'root',
	mysql_database	: 'grosvenor',
	mysql_host		: 'localhost',
	twitter_consumer_key	: 'pKLFp7AepxzrYIwU6FC1Z6XvX',
	twitter_consumer_secret	: 'Ae17UScu4e16pS7YKdfiIhMP3uOkFxHeV89an2eOXmPOigsLcQ',
	twitter_access_token_key		: '2757166214-l3NzUoYCZeBvlRmspKzoWEcsWVqprS3V5FmkZRD',
	twitter_access_token_secret		: 'r3GlgvVcXuOlAsyiuJxEXCAkM9lINzw9Plf73H5rvqgOs',
	twitter_maxMembersFetchCount	: 1500,
	facebook_access	: '',
	facebook_api_version : 'v2.8',
	google_search_key : 'AIzaSyAC-4pIQKEU8J53QmgH1NkPdUhaILJvSEs',
	google_search_cx : '006310580493223584436:cr6c5x7pfks'
};

module.exports.middlewareconstants = {
	fieldDelimter	:	'|',
	facebooklocations : 'locations.csv',
	facebooksearchtype	: 'Restaurant'
};
