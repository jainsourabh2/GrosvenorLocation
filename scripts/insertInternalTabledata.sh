boroughcode="hive -e insert into table internal_aggregated_borough Select name,latitude,longitude,createddate, sum(case when category = 'Bar' then postcount else 0 end) as p2, sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3, sum(case when category = 'Movie Theater' then postcount else 0 end ) as p4, sum(case when category = 'Restaurant' then postcount else 0 end) as p5 From ( select count(1) as postcount,B.ladname as name,B.ladlatitude as latitude ,B.ladlongitude as longitude,A.category as category,A.createddate as createddate from facebookdata as A join NewDimPostCode B on A.locationzip = B.postcode where A.category IN ('Movie Theater','Bar','Restaurant','Casino & G aming') group by B.ladname,B.ladlatitude,B.ladlongitude,A.category,A.createddate ) as G Group by G.name,G.latitude,G.longitude, G.createddate; "

echo "Moving aggregated Borough data into internal table "
eval $boroughcode
echo "Completed for borough table "

msoacode="hive -e insert into table internal_aggregated_msoa Select name,latitude,longitude,createddate,postcodelatitude,postcodelongitude,sum(case when category = 'Bar' then postcount else 0 end) as p2,sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3,sum(case when category = 'Movie T heater' then postcount else 0 end) as p4,sum(case when category = 'Restaurant' then postcount else 0 end) as p5 From ( select count(1) as postcount,B .msoaname as name,B.msoalatitude as latitude ,B.msoalongitude as longitude,A.category as category,A.createddate as createddate,B.postcodelatitude as postcodelatitude,B.postcodelongitude as postcodelongitude from facebookdata as A join NewDimPostCode B on A.locationzip = B.postcode where A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') group by B.msoaname,B.msoalatitude,B.msoalongitude,A.category,A.createddate,B.postcodelatitude,B.postcodelongitude) as G Group by G.name,G.latitude,G.longitude,G.createddate,G.postcodelatitude,G.postcodelongitude ;"

echo "Moving aggregated MSOA data into internal table "
eval $msoacode
echo "Completed for MSOA table "

lsoacode="hive -e insert into table internal_aggregated_lsoa Select name,latitude,longitude,createddate,postcodelatitude,postcodelongitude,sum(case when category = 'Bar' then postcount else 0 end) as p2,sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3,sum(case when category = 'Movie T heater' then postcount else 0 end) as p4,sum(case when category = 'Restaurant' then postcount else 0 end) as p5 From ( select count(1) as postcount,B .lsoaname as name,B.lsoalatitude as latitude ,B.lsoalongitude as longitude,A.category as category,A.createddate as createddate,B.postcodelatitude as postcodelatitude,B.postcodelongitude as postcodelongitude from facebookdata as A join NewDimPostCode B on A.locationzip = B.postcode where A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') group by B.lsoaname,B.lsoalatitude,B.lsoalongitude,A.category,A.createddate,B.postcodelatitude,B.postcodelongitude) as G Group by G.name,G.latitude,G.longitude,G.createddate,G.postcodelatitude,G.postcodelongitude ;" echo "Moving aggregated LSOA data into internal table "

echo "Moving aggregated LSOA data into internal table "
eval $lsoacode
echo "Completed for LSOA table "

