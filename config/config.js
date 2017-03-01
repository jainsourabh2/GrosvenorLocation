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
	mysql_username	: '',
	mysql_password	: '',
	mysql_database	: '',
	mysql_host		: '',
	twitter_consumer_key	: '',
	twitter_consumer_secret	: '',
	twitter_access_token_key		: '',
	twitter_access_token_secret		: '',
	twitter_maxMembersFetchCount	: 1500,
	facebook_access	: '',
	facebook_api_version : 'v2.8',
	google_search_key : '',
	google_search_cx : '',
	access_token: [],
	logDir	: '/var/log/grosvenor/',
	environment : 'development',
	null : null,
	undefined : undefined,
	flickr_api_key : "",
   
        flickr_secret : "",
   
        flickr_filename : "/opt/nodeprojects/GrosvenorLocation/flickr/op/flickrdata"
};

module.exports.middlewareconstants = {
	fieldDelimter	:	'|',
	facebooklocations : 'locations.csv',
	facebooksearchtype	: 'Restaurant'
};

module.exports.postcodes=[
'W1G'
];

/*
module.exports.postcodes=[
'W1G',
'W1X',
'W1E',
'W1B',
'W1U',
'W1S',
'W1M',
'W1D',
'W1K',
'W1A',
'W1C',
'W1H',
'W1P',
'W1N',
'W1R',
'W1V',
'W1F',
'W1T',
'W1J',
'W1Y',
'W1W',
'SW1E',
'SW1X',
'SW1H',
'SW1Y',
'SW1A',
'SW1V',
'SW1P',
'SW1W'
];
*/

module.exports.localbusiness=[
'RETAIL'
];

/*
module.exports.localbusiness=[
'RETAIL',
'SHOP',
'FASHION',
'FOOD',
'BAR',
'CAFÉ',
'PUB',
'RESTAURANT',
'BEAUTY',
'HAIR',
'ART',
'GALLERY',
'FLORIST',
'BOUTIQUE',
'DESIGNER',
'ANTIQUE',
'CAR',
'MOTOR',
'HEALTH',
'SPORT',
'YACHT'
];
*/
