use grosvenor;

create table facebooklist
( id bigint primary key,
  name varchar(500),
  type varchar(50),
  location varchar(500),
  latitude float,
  longitude float,
  url varchar(200),
  epoch bigint,
  twitterhandle varchar(100),
  fblatitude double,
  fblongitude double,
  fbpostcode varchar(20)
);

create table twitterlist
(
  screen_name varchar(50),
  twitterid varchar(50)
);

create table restaurantnames
(
  Id bigint,
  name varchar(2000),
  latitude float,
  longitude float,
  street varchar(100),
  zip varchar(100)
);

create table stationnames(
  name varchar(500),
  latitude float,
  longitude float
);

create table stationrest(
  id bigint,
  name varchar(1000),
  type varchar(100),
  stationname varchar(1000),
  latitude float,
  longitude float,
  site varchar(1000),
  epoch varchar(1000)
);
