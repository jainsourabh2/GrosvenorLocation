>========================================================================================================================<
						Steps for Ingesting Energy dataset.
>========================================================================================================================<

1) Download the energy dataset by login into this link - https://epc.opendatacommunities.org/login
2) Download all the zip files - Domestic Energy(huge file around 3 Gb zipped) , NonDomestic zip and Display zip.
3) Extract this zip into individual folders. 
4) In case of NonDomestic and Display EPC, just transfer the complete folder into server path (/resource1/energydataset/staging).
5) Now Run the script - /resource1/energydataset/automate/script.sh and choose the option to ingest.
6) In case of Domestic EPC - we are ingesting only London and Liverpool region energy data. So we need to segregate London boroughs and Liverpool from domestic-energy datset (which has around 350 folders in it)
	So to segregate that dataset run the node script - F:\Energy\segregate\segregatedir.js . thi script takes two parameters first parameter the root path of domestic energy folder path and second parameter the destination path.
7) Running above script will create four folders in destination path - Liverpool, London1, London2, London3 (we are segregating London dataset into 3 folders as the volume of data is huge and the current machine spec does not have enough memory to process this huge volume at once.)
8) So to ingest Liverpool domestic data - Move this Liverpool folder created from above step sript into staging directory (/resource1/energydataset/staging) and run shell script.
9) To ingest London domestic EPC - Move each folder one at a time into staging path and run the script.