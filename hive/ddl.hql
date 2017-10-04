CREATE EXTERNAL TABLE newtwittercategorystream
( Tweet_Id bigint,
creeated_at timestamp,
Tweet varchar(8000),
Sentiment int,
Source varchar(8000),
InReplyToStatusId varchar(100),
InReplyToUserId varchar(100),
InReplyToUserName varchar(100),
UserId varchar(100),
UserFullName varchar(500),
UserScreenName varchar(100),
UserLocation varchar(100),
UserDescription varchar(1000),
UserURL varchar(1000),
UserProtected varchar(100),
UserVerified varchar(100),
UserFollowerCount varchar(100),
UserFollowingCount varchar(100),
UserStatusCount varchar(100),
UserFriendsCount varchar(100),
UserListedCount varchar(100),
UserFavouriteCount varchar(100),
UserCreateAt varchar(100),
UserGeoEnabled varchar(100),
UserLanguage varchar(100),
UserProfileImageURL varchar(1000),
UserDefaultProfile varchar(100),
UserDefaultProfileImage varchar(100),
tweetlongitude varchar(500),
tweetlatitude varchar(1000),
RetweetCount varchar(100),
FavouriteCount int,
Retweeted varchar(100),
Favourited varchar(100),
FilterLevel varchar(100),
Language varchar(100),
PlaceType varchar(100),
PlaceName varchar(100),
PlaceFullName varchar(100),
PlaceCountryCode varchar(100),
PlaceCountry varchar(100),
Place_coordinate1_lng varchar(100),
Place_coordinate1_lat varchar(100),
Place_coordinate2_lng varchar(100),
Place_coordinate2_lat varchar(100),
Place_coordinate3_lng varchar(100),
Place_coordinate3_lat varchar(100),
Place_coordinate4_lng varchar(100),
Place_coordinate4_lat varchar(100),
Hashtags varchar(1000),
user_mentions varchar(1000),
Urls varchar(1000),
Category int,
geolatitude varchar(100),
geolongitude varchar(100)
)
PARTITIONED BY (create_date string)
row format delimited fields terminated by "|"
LOCATION '/grosvenor/twitter/newtwittercategoryflume/';

ALTER TABLE newtwittercategorystream ADD PARTITION(create_date='16-11-28') location '/grosvenor/twitter/newtwittercategoryflume/16-11-28';
ALTER TABLE newtwittercategorystream ADD PARTITION(create_date='16-11-29') location '/grosvenor/twitter/newtwittercategoryflume/16-11-29';


CREATE EXTERNAL TABLE facebookdata (
id       bigint,
about     string,
bio                     string,    
business                string ,   
category                string  ,  
categorylist            string,    
coverid                 string,    
coveroffsetx            int   ,
coveroffsety            int   ,
coversource             string,
description             string,
engagementcount         int   ,
socialsentence          string,
fancount                int   ,
hrs_mon_open            string, 
hrs_mon_close           string, 
hrs_tue_open            string,
hrs_tue_close           string,
hrs_wed_open            string,
hrs_wed_close           string,
hrs_thur_open           string,
hrs_thur_close          string,
hrs_fri_open            string,
hrs_fri_close           string,
hrs_sat_open            string,
hrs_sat_close           string,
hrs_sun_open            string,
hrs_sun_close           string,
isalwaysopen            string,
isverified              string,
ispermanentlyclosed     string,
isunclaimed             string,
link                    string,
locationcity            string,
locationcountry         string,
locationlatt            string,
locationlong            string,
locationstreet          string,
locationzip             string,
name                    string,
star_rating             int,
placetype               string,
pricerange              string,
ratingcount             int   ,
username                string,
verification_status     string,
website                 string,
message                 string,
sentimentscore          int   ,
picture                 string,
videosource             string,
feedlink                string,
action                  string,
messagetag              string,
publishedtime           string,
createdtime             string,
createddate             string,
hours                   int   ,
weekday                 string,
timeframe               string,
categorize              int
)
PARTITIONED BY (fb_date string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/facebook/facebooktopic/';



create external table DimPostCode (
	DWPostCodeAreaId int ,
	PostCode string,
	PostCodeAlt string,
	PostCodeLatitude double,
	PostCodeLongitude double,
	OACode string,
	LSOACode string,
	LSOAName string,
	MSOACode string,
	MSOAName string,
	LADCode string,
	LADName string,
	LADWName string,
	OALatitude double,
	OALongitude double,
	LSOALatitude double,
	LSOALongitude double,
	MSOALatitude double,
	MSOALongitude double,
	LADLatitude double,
	LADLongitude double
)
row format delimited 
fields terminated by ',' 
lines terminated by '\n' 
location '/grosvenor/facebook/DimPostCode';

CREATE EXTERNAL TABLE fbEvents(
eventid string,
eventname string,
eventdescription string,
eventcreatedate string,
eventcreatetime string,
eventstartdate string,
eventstarttime string,
eventenddate string,
eventendtime string,
placename string,
city string,
country string,
latitude string,
longitude string,
street string,
zip string) 
ROW FORMAT DELIMITED FIELDS TERMINATED BY '|' LOCATION '/grosvenor/facebook/fbeventstopic/events'; 

CREATE EXTERNAL TABLE safeLiverpoolAreas(
areacode string,
latitude string,
longitude string,
safescore string,
unsafescore string) 
ROW FORMAT DELIMITED 
FIELDS TERMINATED BY '|' 
LOCATION '/grosvenor/liverpoolone/SafeAreas/';

CREATE EXTERNAL TABLE facebookcomments (
name      string,
userid     bigint,
message   string,
postid  bigint,
commentsid  string,
commentsdate  string,
commentstime  string,
commentsday   string,
commentsperiod  string,
commentstimeframe  string,
sentiment  int,
abusiveflag int
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/facebook/fbcommentstopic/liverpoolone';



CREATE EXTERNAL TABLE flickrdata (
id  string,
owner string,
title string ,
photoid string ,
dateuploaded string,
owner_nsid string,
owner_username string,
owner_realname  string,
owner_location  string,
description   string,
dateposted  string,
phototaken  string,
photolastupdate string, 
views int, 
latitude string,
longitude string,
url string,
media string,
commentid string, 
author string,
authorname string,
commentlink  string,
authorrealname  string,
content string
)
PARTITIONED BY (create_date string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/flickr/';

CREATE EXTERNAL TABLE facebookstorecomments (
name      string,
userid     bigint,
message   string,
postid  bigint,
commentsid  string,
commentsdate  string,
commentstime  string,
commentsday   string,
commentsperiod  string,
commentstimeframe  string,
sentiment  int,
abusiveflag int
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/facebook/fbcommentstopic/stores';


CREATE EXTERNAL TABLE HKEvents(
watching_count string, 
olson_path string, 
calendar_count string, 
comment_count string, 
region_abbr string, 
postal_code string, 
going_count string, 
all_day string, 
latitude string, 
groups string, 
url string, 
id string, 
privacy string, 
city_name string, 
link_count string, 
longitude string, 
country_name string, 
country_abbr string, 
region_name string, 
start_time string, 
tz_id string,  
description string, 
modified string, 
venue_display string, 
tz_country string, 
performers_creator string, 
performers_linker string,  
performers_name string, 
performers_url string, 
performers_id string, 
performers_shortbio string, 
title string, 
venue_address string, 
geocode_type string, 
tz_olson_path string, 
recur_string string, 
calendars string, 
owner string, 
going string, 
country_abbr2 string, 
image string, 
created string, 
venue_id string, 
tz_city string,  
stop_time string, 
venue_name string, 
venue_url string
) ROW FORMAT DELIMITED FIELDS TERMINATED BY "|" LOCATION '/grosvenor/HongKong/Events/';


CREATE EXTERNAL TABLE HKPriceFall
(
address string,
building string,	
color string,	
info string,	
caseInfo string,	
city string,	
country	string,
dateFormatted	string,
date2	string,
incident_year string,	
dayNum string,	
district string,	
lat_Lon string,
latitude string,	
longitude string,	
month_num string,
numOfRecords string,	
record string
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
	WITH SERDEPROPERTIES (
	   "separatorChar" = ',',
	   "quoteChar"     = '\"',
	   "escapeChar"    = '\\'
	)  
	STORED AS TEXTFILE
	LOCATION '/grosvenor/HongKong/HousePriceFalls/' tblproperties ("skip.header.line.count"="1");
	
	
	
CREATE EXTERNAL TABLE realtimeparkingvacancy (
parkId string,
pcVacancyType string,
pcVacancyEV string,
pcVacancyDIS string,
pcVacancy string,
pcCategory string,
pcLastUpdated string,
lgvVacancyType string, 
lgvVacancyEV string,
lgvVacancyDIS string,
lgvVacancy string,
lgvCategory string,
lgvLastUpdated string,
hgvVacancyType string,
hgvVacancyEV string,
hgvVacancyDIS string,
hgvVacancy string,
hgvCategory string,
hgvLastUpdated string,
mcVacancyType string,
mcVacancyEV string,
mcVacancyDIS string,
mcVacancy string,
mcCategory string,
mcLastUpdated string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/HongKong/ParkingInfo/vacancy/';

CREATE EXTERNAL TABLE propertytransaction (
trans_date string,
trans_dt_format string,
trans_address string,
trans_price_HKD_in_million string,
trans_SA string,
trans_GFA string,
cost_SA_per_sqft string,
cost_GFA_per_sqft string,
status string,
town string,
latitude string,
longitude string
)
ROW FORMAT DELIMITED 
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/HongKong/PropertyTransaction/';

CREATE EXTERNAL TABLE hkrestaurantdetails(
  scraped_date string,
  rest_id string,
  rest_name string,
  status string,
  image_url string,
  price_range string,
  cuisinetype string,
  no_of_reviews string,
  no_of_ratings string,
  address string,
  smile_face_rating string,
  sad_face_rating string,
  latitude string,
  longitude string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/HongKong/RestaurantDetails'

CREATE EXTERNAL TABLE hkPublicEventsDetails (
event_id string,
titlec string,
titlee string,
cat1 string,
cat2 string,
predateC string,
predateE string,
progtimec string,
progtimee string,
venue_id string,
agelimitc string,
agelimite string,
pricec string,
pricee string,
descc string,
desce string,
urlc string,
urle string,
tagenturlc string,
tagenturle string,
remarkc string,
remarke string,
enquiry string,
fax string,
email string,
saledate string,
interbook string,
presenterorgc string,
presenterorge string,
prog_image string,
detail_image1 string,
detail_image2 string,
detail_image3 string,
detail_image4 string,
detail_image5 string,
video_link string,
video2_link string,
my_culture_app string,
submitdate string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/HongKong/PublicEvents/events';

CREATE EXTERNAL TABLE hkPublicVenuesDetails (
venue_id string,
venuee string,
venuec string,
latitude string,
longitude string
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '|'
LOCATION '/grosvenor/HongKong/PublicEvents/venues';
