A= LOAD '/grosvenor/facebook/facebooktopic/16-12-12' USING PigStorage('|') AS (u1:chararray,u2:chararray,u3:chararray,u4:chararray,u5:chararray,u6:chararray,u7:chararray,u8:chararray,u9:chararray,u10:chararray,u11:chararray,u12:chararray,u13:chararray,u14:chararray,u15:chararray,u16:chararray,u17:chararray,u18:chararray,u19:chararray,u20:chararray,u21:chararray,u22:chararray,u23:chararray,u24:chararray,u25:chararray,u26:chararray,u27:chararray,u28:chararray,u29:chararray,u30:chararray,u31:chararray,u32:chararray,u33:chararray,u34:chararray,u35:chararray,u36:chararray,u37:chararray,u38:chararray,u39:chararray,u40:chararray,u41:chararray,u42:chararray,u43:chararray,u44:chararray,u45:chararray,u46:chararray,u47:chararray,u48:chararray,u49:chararray,u50:chararray,u51:chararray,u52:chararray,u53:chararray,u54:chararray,u55:chararray,u56:chararray);
B= FOREACH A GENERATE SUBSTRING(u56,0,10) AS create_date ,u1,u2,u3,u4,u5,u6,u7,u8,u9,u10,u11,u12,u13,u14,u15,u16,u17,u18,u19,u20,u21,u22,u23,u24,u25,u26,u27,u28,u29,u30,u31,u32,u33,u34,u35,u36,u37,u38,u39,u40,u41,u42,u43,u44,u45,u46,u47,u48,u49,u50,u51,u52,u53,u54,u55,u56;
C= FOREACH B GENERATE create_date,u1,u2,u3,u4,u5,u6,u7,u8,u9,u10,u11,u12,u13,u14,u15,u16,u17,u18,u19,u20,u21,u22,u23,u24,u25,u26,u27,u28,u29,u30,u31,u32,u33,u34,u35,u36,u37,u38,u39,u40,u41,u42,u43,u44,u45,u46,u47,u48,u49,u50,u51,u52,u53,u54,u55,u56;
D= FILTER C BY chararray(create_date) == chararray($date);
STORE D into '/grosvenor/facebook/facebooktopic/$date';