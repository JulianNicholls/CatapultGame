# Catapult Game

This is the code from the [Sitepoint Article](http://www.sitepoint.com/series/create-a-windows-8-game-with-javascript/) Create a Windows 8 Game With JavaScript. It is based on a [Microsoft Developer Network Article](http://msdn.microsoft.com/en-us/windowsphonetrainingcourse_2dgamedevelopmentwithxnalab.aspx)


## Necessary Changes

The code here builds and runs. It shows the differences from the code as published on sitepoint.com that are necessary to use the latest (2013-09) versions of the CreateJS libraries PreloadJS and EaselJS.

Some of the changes necessary are:

1. Bitmap becomes createjs.Bitmap
2. PreloadJS class is now createjs.LoadQueue
3. calls to getResult() no longer need .result appended.

The link to CatapultWars_4_0.zip in the article is not correct. The correct link is in the comments at the bottom, and is also in the first paragraph above.

