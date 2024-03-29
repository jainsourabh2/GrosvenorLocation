DROP TABLE IF EXISTS ext_domestic_london_energy;

CREATE EXTERNAL TABLE ext_domestic_london_energy(
		LMK_KEY string,
		ADDRESS1 string,
		ADDRESS2 string,
		ADDRESS3 string,
		POSTCODE string,
		BUILDING_REFERENCE_NUMBER string,
		CURRENT_ENERGY_RATING string,
		POTENTIAL_ENERGY_RATING string,
		CURRENT_ENERGY_EFFICIENCY string,
		POTENTIAL_ENERGY_EFFICIENCY string,
		PROPERTY_TYPE string,
		BUILT_FORM string,
		INSPECTION_DATE string,
		LOCAL_AUTHORITY string,
		CONSTITUENCY string,
		COUNTY string,
		LODGEMENT_DATE string,
		TRANSACTION_TYPE string,
		ENVIRONMENT_IMPACT_CURRENT string,
		ENVIRONMENT_IMPACT_POTENTIAL string,
		ENERGY_CONSUMPTION_CURRENT string,
		ENERGY_CONSUMPTION_POTENTIAL string,
		CO2_EMISSIONS_CURRENT string,
		CO2_EMISS_CURR_PER_FLOOR_AREA string,
		CO2_EMISSIONS_POTENTIAL string,
		LIGHTING_COST_CURRENT string,
		LIGHTING_COST_POTENTIAL string,
		HEATING_COST_CURRENT string,
		HEATING_COST_POTENTIAL string,
		HOT_WATER_COST_CURRENT string,
		HOT_WATER_COST_POTENTIAL string,
		TOTAL_FLOOR_AREA string,
		ENERGY_TARIFF string,
		MAINS_GAS_FLAG string,
		FLOOR_LEVEL string,
		FLAT_TOP_STOREY string,
		FLAT_STOREY_COUNT string,
		MAIN_HEATING_CONTROLS string,
		MULTI_GLAZE_PROPORTION string,
		GLAZED_TYPE string,
		GLAZED_AREA string,
		EXTENSION_COUNT string,
		NUMBER_HABITABLE_ROOMS string,
		NUMBER_HEATED_ROOMS string,
		LOW_ENERGY_LIGHTING string,
		NUMBER_OPEN_FIREPLACES string,
		HOTWATER_DESCRIPTION string,
		HOT_WATER_ENERGY_EFF string,
		HOT_WATER_ENV_EFF string,
		FLOOR_DESCRIPTION string,
		FLOOR_ENERGY_EFF string,
		FLOOR_ENV_EFF string,
		WINDOWS_DESCRIPTION string,
		WINDOWS_ENERGY_EFF string,
		WINDOWS_ENV_EFF string,
		WALLS_DESCRIPTION string,
		WALLS_ENERGY_EFF string,
		WALLS_ENV_EFF string,
		SECONDHEAT_DESCRIPTION string,
		SHEATING_ENERGY_EFF string,
		SHEATING_ENV_EFF string,
		ROOF_DESCRIPTION string,
		ROOF_ENERGY_EFF string,
		ROOF_ENV_EFF string,
		MAINHEAT_DESCRIPTION string,
		MAINHEAT_ENERGY_EFF string,
		MAINHEAT_ENV_EFF string,
		MAINHEATCONT_DESCRIPTION string,
		MAINHEATC_ENERGY_EFF string,
		MAINHEATC_ENV_EFF string,
		LIGHTING_DESCRIPTION string,
		LIGHTING_ENERGY_EFF string,
		LIGHTING_ENV_EFF string,
		MAIN_FUEL string,
		WIND_TURBINE_COUNT string,
		HEAT_LOSS_CORRIDOOR string,
		UNHEATED_CORRIDOR_LENGTH string,
		FLOOR_HEIGHT string,
		PHOTO_SUPPLY string,
		SOLAR_WATER_HEATING_FLAG string,
		MECHANICAL_VENTILATION string,
		ADDRESS string,
		LOCAL_AUTHORITY_LABEL string,
		CONSTITUENCY_LABEL string,
		CERTIFICATE_HASH string	
)
	 ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
	WITH SERDEPROPERTIES (
	   "separatorChar" = ',',
	   "quoteChar"     = '\"',
	   "escapeChar"    = '\\'
	)  
	STORED AS TEXTFILE
	LOCATION '/tmp/energy/';



