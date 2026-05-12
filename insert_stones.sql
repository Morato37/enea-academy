USE [PSStandarts]
GO

INSERT INTO [dbo].[Stone] ([ID], [Name], [Morphology], [Producer], [Origin], [Color], [Area_Mediterranean], [Area_CentralEurope], [Area_Alpine], [Usage_Tiles], [Usage_BlockSteps], [Usage_Paving], [Usage_Walls], [Usage_Pool], [Usage_Chipping], [Finishes_Split], [Finishes_Flamed], [Finishes_Blasted], [Finishes_Sawn], [Finishes_Hammered], [Finishes_Polished], [Finishes_Honed], [Resistance_Frost], [Resistance_LessFrost], [Resistance_NotFrost]) VALUES
(1, N'Guber', N'Quartz sandstone', N'Guber', N'CH, OW', N'grey-brown', 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0),
(2, N'Bollinger', N'Sandstone', N'Kuster AG', N'CH, SG', N'light-grey', 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0),
(3, N'Rohrschacher', N'Sandstone', N'Baerlocher AG', N'CH, SG', N'light-grey', 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0),
(4, N'Andeer', N'Gneiss', N'Toscano AG', N'CH, GR', N'silver-green', 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0),
(5, N'San Bernardino', N'Gneiss', N'Toscano AG', N'CH, GR', N'silver-grey', 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0),
(6, N'Maggia', N'Gneiss', N'De Zanet AG', N'CH, TI', N'silver-anthrazite', 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0),
(7, N'Valser', N'Quartzite', N'Truffer AG', N'CH, GR', N'silver-grey', 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0),
(8, N'Katzenkopk', N'Sediments', N'De Zanet AG', N'CH', N'grey', 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(9, N'Luserna', N'Gneiss', N'De Zanet AG', N'IT ', N'warm-grey', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0),
(10, N'Pietra Piasentina', N'Limestone', N'Consorzio PP', N'IT', N'grey-brown', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0),
(11, N'Grigio Olivo', N'Dolomite', N'Marmi Faedo SRL', N'IT', N'olive-grey', 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0),
(12, N'Santa Fiora', N'Travertine', N'Santa Fiora SRL', N'IT', N'beige', 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
(13, N'Basaltite', N'Basalt', N'Basaltite AG', N'IT', N'anthrazite-grey', 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0),
(14, N'Jurakalk', N'Chalk sandstone', N'Franken Schotter', N'GER, BAY', N'beige', 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1),
(15, N'Wachenzeller', N'Dolomite', N'Franken Schotter', N'GER, BAY', N'beige-brown', 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0),
(16, N'Kirchheimer Muschelkalk', N'Limestone', N'Kuster AG', N'GER, BW', N'light-grey-orange', 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0),
(17, N'Fiscal Brown', N'Quartz Sandstone', N'De Zanet AG', N'POR / ESP', N'grey-brown', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0),
(19, N'Lava', N'Basalte', N'Blanc Carrare', N'FR ', N'anthrazite', 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
(18, N'Alta, Oppdal, Otta, Offerdal', N'Slate', N'Minera Skifer AS', N'NOR / SWE', N'anthrazite', 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0),
(20, N'Vulcano Black', N'Basalt', N'De Zanet AG', N'CHI', N'anthrazite', 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0),
(21, N'Tiger Basalt', N'Basalt', N'De Zanet AG', N'VIE', N'anthrazite', 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0),
(22, N'Nex Beige', N'Limestone', N'De Zanet AG', N'Croatia', N'dark grey/beige', 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0),
(23, N'Kanfanar', N'Limestone', N'De Zanet AG', N'Croatia', N'beige', 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0),
(24, N'Serizzo', N'Gneiss', N'De Zanet AG', N'IT', N'white /black', 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0),
(25, N'Nero Assoluto', N'Granit', N'De Zanet AG', N'Africa', N'black', 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0),
(26, N'Onsernone', N'Gneiss', N'De Zanet AG', N'CH', N'grey / blue', 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(27, N'Silber Quarzit', N'Quarzit', N'De Zanet AG', N'IT', N'silver grey', 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0),
(28, N'Bianco Cristallo', N'Granit', N'De Zanet AG', N'ESP', N'white grey', 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0),
(29, N'Flusswacken gespalten', N'Kalk', N'De Zanet AG', N'IT', N'colored', 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0);
GO
