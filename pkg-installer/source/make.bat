@ECHO OFF
title make_package_custom 1.2
if not exist custom md custom

:: ----------------------------------------------
:: Simple script to build a PKG (by CaptainCPS-X)
:: ----------------------------------------------

:: Change these for your application / manual...
set CID=LSTORE-INSTALLER_00-0000000000000000
set PKG_DIR=./custom/
set PKG_NAME=localSTORE.v1.0.0-HDD.pkg

make_package_custom.exe --contentid %CID% %PKG_DIR% %PKG_NAME%

pause

ps3xploit_rifgen_edatresign %PKG_NAME%

