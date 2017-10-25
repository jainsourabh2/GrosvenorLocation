var conf = {};

conf.url = 'https://www.openrice.com';
conf.baseLink = 'https://www.openrice.com/en/hongkong/restaurants?';
conf.closedRestUrl = 'https://www.openrice.com/api/pois/closed?&page=';

conf.districtsInputFile = 'input/districts';
conf.cuisinesInputFile = 'input/cuisines';

conf.localOutputPath = 'output/';
conf.hdfsOutputPath = '/grosvenor/HongKong/RestaurantDetails/';
conf.outputFileName = 'restaurantList.txt';

module.exports = conf;