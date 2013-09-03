# Catapult Game

This is the code from the Sitepoint 4 part Article [Create a Windows 8 Game With JavaScript](http://www.sitepoint.com/series/create-a-windows-8-game-with-javascript/). It is based on a Microsoft Developer Network Article [Catapult Wars Lab](http://msdn.microsoft.com/en-us/windowsphonetrainingcourse_2dgamedevelopmentwithxnalab.aspx)


## Necessary Changes

The code here builds and runs. It shows the differences from the code as published on sitepoint.com that are necessary to use the latest (2013-09) versions of the CreateJS libraries PreloadJS and EaselJS. I have added 4 clouds that all scud either from right to left or left to right randomly. Each time a cloud goes off one side, it reappears on the other side with a random speed.

Some (all, I hope) of the changes from the published code necessary are:

1. The Bitmap class is now referenced as createjs.Bitmap
2. The PreloadJS class is now createjs.LoadQueue
3. The Stage class is now createjs.Stage
4. The Point class is now createjs.Point
5. Calls to getResult() no longer need .result appended.

The link to CatapultWars_4_0.zip in the article is not correct. The correct link is in the comments at the bottom, and is also in the first paragraph above.

