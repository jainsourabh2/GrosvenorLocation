var conf = {};

conf.venuesUrl = 'http://www2.lcsd.gov.hk/php/gen_xml_to_psi/xml/venues.xml';
conf.eventsUrl = 'http://www2.lcsd.gov.hk/php/gen_xml_to_psi/xml/events.xml';

// conf.localOutputPath = '/opt/nodeprojects/GrosvenorLocation/HongKong/HKPublicEventsList/output';
conf.localOutputPath = 'output';
conf.hdfsVenuesOutputPath = '/grosvenor/HongKong/PublicEvents/venues';
conf.hdfsEventsOutputPath = '/grosvenor/HongKong/PublicEvents/events';
conf.venuesOutputFileName = 'hkPublicVenuesList.txt';
conf.eventsOutputFileName = 'hkPublicEventsList.txt';

module.exports = conf;